using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zerno.Application.Contracts.Portal;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/reference")]
public sealed class ReferenceController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("{category}")]
    public async Task<IReadOnlyList<ReferenceCatalogItemDto>> List(string category, CancellationToken cancellationToken)
        => await dbContext.ReferenceCatalogItems
            .Where(x => x.Category == category)
            .OrderBy(x => x.Title)
            .Select(x => new ReferenceCatalogItemDto(
                x.Id,
                x.Category,
                x.Slug,
                x.Title,
                x.Region,
                x.Summary,
                x.Details,
                x.Contacts,
                x.Status,
                x.Highlights))
            .ToListAsync(cancellationToken);

    [HttpGet("{category}/{slug}")]
    public async Task<ActionResult<ReferenceCatalogItemDto>> Get(string category, string slug, CancellationToken cancellationToken)
    {
        var item = await dbContext.ReferenceCatalogItems
            .Where(x => x.Category == category && x.Slug == slug)
            .Select(x => new ReferenceCatalogItemDto(
                x.Id,
                x.Category,
                x.Slug,
                x.Title,
                x.Region,
                x.Summary,
                x.Details,
                x.Contacts,
                x.Status,
                x.Highlights))
            .FirstOrDefaultAsync(cancellationToken);

        return item is null ? NotFound() : Ok(item);
    }
}
