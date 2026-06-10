namespace Zerno.Application.Abstractions;

public sealed record MediaAssetSeed(string ObjectKey, string SourceUrl, string ContentType);
public sealed record MediaObjectResult(Stream Stream, string ContentType);

public interface IMediaStorageService
{
    Task EnsureBucketAsync(CancellationToken cancellationToken = default);
    Task SeedAsync(IEnumerable<MediaAssetSeed> assets, CancellationToken cancellationToken = default);
    Task<MediaObjectResult?> GetAsync(string objectKey, CancellationToken cancellationToken = default);
}
