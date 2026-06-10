using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminController(
    ICurrentUserContext currentUserContext,
    AppDbContext dbContext,
    IMarketDataSyncService marketDataSyncService) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken cancellationToken)
    {
        if (!await IsAdminAsync(cancellationToken))
        {
            return Unauthorized();
        }

        return Ok(new
        {
            users = await dbContext.Users.CountAsync(cancellationToken),
            grainLots = await dbContext.GrainLots.CountAsync(cancellationToken),
            equipmentLots = await dbContext.EquipmentLots.CountAsync(cancellationToken),
            orders = await dbContext.Orders.CountAsync(cancellationToken),
            notifications = await dbContext.Notifications.CountAsync(cancellationToken),
            sellerApplications = await dbContext.SellerApplications.CountAsync(cancellationToken),
            news = await dbContext.NewsArticles.CountAsync(cancellationToken),
            prices = await dbContext.PriceRecords.CountAsync(cancellationToken)
        });
    }

    [HttpPost("sync-content")]
    public async Task<IActionResult> SyncContent(CancellationToken cancellationToken)
    {
        if (!await IsAdminAsync(cancellationToken))
        {
            return Unauthorized();
        }

        await marketDataSyncService.SyncAsync(cancellationToken);
        return Ok(new { ok = true });
    }

    private async Task<bool> IsAdminAsync(CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return false;
        }

        return await dbContext.Users.AnyAsync(x => x.Id == userId && x.Role == Zerno.Domain.Users.UserRole.Admin, cancellationToken);
    }
}
