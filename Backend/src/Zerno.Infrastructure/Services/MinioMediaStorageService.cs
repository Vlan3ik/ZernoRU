using System.Net;
using System.Text;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Zerno.Application.Abstractions;

namespace Zerno.Infrastructure.Services;

public sealed class MinioMediaStorageService(IConfiguration configuration, ILogger<MinioMediaStorageService> logger) : IMediaStorageService
{
    private readonly string _bucket = configuration["Minio:Bucket"] ?? "zerno-media";
    private readonly IMinioClient _client = new MinioClient()
        .WithEndpoint(configuration["Minio:Endpoint"] ?? "minio:9000")
        .WithCredentials(configuration["Minio:AccessKey"] ?? "zerno", configuration["Minio:SecretKey"] ?? "zerno12345")
        .Build();

    public async Task EnsureBucketAsync(CancellationToken cancellationToken = default)
    {
        for (var attempt = 1; attempt <= 30; attempt++)
        {
            try
            {
                var exists = await _client.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucket), cancellationToken).ConfigureAwait(false);
                if (!exists)
                {
                    await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucket), cancellationToken).ConfigureAwait(false);
                }

                return;
            }
            catch when (attempt < 30)
            {
                await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken).ConfigureAwait(false);
            }
        }

        throw new InvalidOperationException("Не удалось подключиться к MinIO.");
    }

    public async Task SeedAsync(IEnumerable<MediaAssetSeed> assets, CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken).ConfigureAwait(false);

        using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
        foreach (var asset in assets)
        {
            var statArgs = new StatObjectArgs().WithBucket(_bucket).WithObject(asset.ObjectKey);
            try
            {
                await _client.StatObjectAsync(statArgs, cancellationToken).ConfigureAwait(false);
                continue;
            }
            catch
            {
                // Upload missing object.
            }

            try
            {
                var bytes = await LoadAssetBytesAsync(httpClient, asset.SourceUrl, cancellationToken).ConfigureAwait(false);
                await using var stream = new MemoryStream(bytes);
                var putArgs = new PutObjectArgs()
                    .WithBucket(_bucket)
                    .WithObject(asset.ObjectKey)
                    .WithStreamData(stream)
                    .WithObjectSize(stream.Length)
                    .WithContentType(asset.ContentType);
                await _client.PutObjectAsync(putArgs, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Не удалось сохранить медиа-ассет {ObjectKey}", asset.ObjectKey);
            }
        }
    }

    public async Task<MediaObjectResult?> GetAsync(string objectKey, CancellationToken cancellationToken = default)
    {
        await EnsureBucketAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            await _client.StatObjectAsync(new StatObjectArgs().WithBucket(_bucket).WithObject(objectKey), cancellationToken).ConfigureAwait(false);
        }
        catch
        {
            return null;
        }

        var stream = new MemoryStream();
        await _client.GetObjectAsync(
            new GetObjectArgs()
                .WithBucket(_bucket)
                .WithObject(objectKey)
                .WithCallbackStream(objectStream => objectStream.CopyTo(stream)),
            cancellationToken).ConfigureAwait(false);

        stream.Position = 0;
        return new MediaObjectResult(stream, GetContentType(objectKey));
    }

    private static string GetContentType(string objectKey)
        => Path.GetExtension(objectKey).ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".svg" => "image/svg+xml",
            _ => "image/jpeg"
        };

    private static async Task<byte[]> LoadAssetBytesAsync(HttpClient httpClient, string sourceUrl, CancellationToken cancellationToken)
    {
        if (sourceUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var commaIndex = sourceUrl.IndexOf(',');
            if (commaIndex < 0)
            {
                throw new InvalidOperationException("Неверный data URL для медиа-ассета.");
            }

            var meta = sourceUrl[..commaIndex];
            var payload = sourceUrl[(commaIndex + 1)..];
            if (meta.Contains(";base64", StringComparison.OrdinalIgnoreCase))
            {
                return Convert.FromBase64String(payload);
            }

            return WebUtility.UrlDecode(payload) is { } decoded
                ? Encoding.UTF8.GetBytes(decoded)
                : throw new InvalidOperationException("Неверный data URL для медиа-ассета.");
        }

        return await httpClient.GetByteArrayAsync(sourceUrl, cancellationToken).ConfigureAwait(false);
    }
}
