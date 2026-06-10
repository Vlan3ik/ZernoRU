using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Notifications;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/notifications")]
public sealed class NotificationsController(INotificationService notificationService, ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<NotificationDto>> List(CancellationToken cancellationToken)
        => currentUserContext.UserId is { } userId
            ? notificationService.ListAsync(userId, cancellationToken)
            : Task.FromResult<IReadOnlyList<NotificationDto>>(Array.Empty<NotificationDto>());

    [HttpPost("mark-viewed")]
    public async Task<IActionResult> MarkViewed(CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return NoContent();
        }

        await notificationService.MarkAllViewedAsync(userId, cancellationToken);
        return NoContent();
    }
}
