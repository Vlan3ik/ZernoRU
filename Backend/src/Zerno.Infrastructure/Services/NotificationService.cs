using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Notifications;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Infrastructure.Services;

public sealed class NotificationService(AppDbContext dbContext) : INotificationService
{
    public async Task<IReadOnlyList<NotificationDto>> ListAsync(Guid userId, CancellationToken cancellationToken) =>
        await dbContext.Notifications
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new NotificationDto(x.Id, x.UserId, x.Message, x.CreatedAtUtc.ToString("O"), x.Viewed))
            .ToListAsync(cancellationToken);

    public async Task MarkAllViewedAsync(Guid userId, CancellationToken cancellationToken)
    {
        var items = await dbContext.Notifications.Where(x => x.UserId == userId && !x.Viewed).ToListAsync(cancellationToken);
        foreach (var item in items)
        {
            item.Viewed = true;
            item.UpdatedAtUtc = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
