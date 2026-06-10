using Zerno.Application.Contracts.Notifications;

namespace Zerno.Application.Abstractions;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> ListAsync(Guid userId, CancellationToken cancellationToken);
    Task MarkAllViewedAsync(Guid userId, CancellationToken cancellationToken);
}
