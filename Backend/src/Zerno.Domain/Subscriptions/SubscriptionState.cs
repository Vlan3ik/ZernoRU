using Zerno.Domain.Common;

namespace Zerno.Domain.Subscriptions;

public sealed class SubscriptionState : EntityBase
{
    public Guid UserId { get; set; }
    public bool IsActive { get; set; }
    public SubscriptionPlan? Plan { get; set; }
    public DateTime? ExpiresAtUtc { get; set; }
}
