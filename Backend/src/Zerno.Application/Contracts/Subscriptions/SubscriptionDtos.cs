namespace Zerno.Application.Contracts.Subscriptions;

public sealed record SubscriptionDto(
    Guid UserId,
    bool IsActive,
    string? Plan,
    string? ExpiresAt);

public sealed record ActivateSubscriptionRequestDto(string Plan);
