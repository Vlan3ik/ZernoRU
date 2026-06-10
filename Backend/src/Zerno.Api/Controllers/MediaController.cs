using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/media")]
public sealed class MediaController(IMediaStorageService mediaStorage) : ControllerBase
{
    [HttpGet("{*objectKey}")]
    public async Task<IActionResult> Get(string objectKey, CancellationToken cancellationToken)
        => await GetMediaResultAsync(objectKey, cancellationToken);

    [HttpHead("{*objectKey}")]
    public async Task<IActionResult> Head(string objectKey, CancellationToken cancellationToken)
    {
        var media = await mediaStorage.GetAsync(objectKey, cancellationToken);
        return media is null ? NotFound() : Ok();
    }

    private async Task<IActionResult> GetMediaResultAsync(string objectKey, CancellationToken cancellationToken)
    {
        var media = await mediaStorage.GetAsync(objectKey, cancellationToken);
        if (media is null)
        {
            return NotFound();
        }

        return File(media.Stream, media.ContentType);
    }
}
