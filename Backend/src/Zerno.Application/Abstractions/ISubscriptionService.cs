using Zerno.Application.Contracts.Subscriptions;

namespace Zerno.Application.Abstractions;

public interface ISubscriptionService
{
    Task<SubscriptionDto> GetAsync(Guid userId, CancellationToken cancellationToken);
    Task<SubscriptionDto> ActivateAsync(Guid userId, ActivateSubscriptionRequestDto request, CancellationToken cancellationToken);
}
