using Zerno.Domain.Common;

namespace Zerno.Domain.Notifications;

public sealed class NotificationItem : EntityBase
{
    public Guid UserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool Viewed { get; set; }
}
