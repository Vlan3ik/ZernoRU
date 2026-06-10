namespace Zerno.Application.Contracts.Notifications;

public sealed record NotificationDto(
    Guid Id,
    Guid UserId,
    string Message,
    string CreatedAt,
    bool Viewed);
