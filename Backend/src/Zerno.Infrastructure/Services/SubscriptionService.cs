using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Subscriptions;
using Zerno.Domain.Subscriptions;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Infrastructure.Services;

public sealed class SubscriptionService(AppDbContext dbContext) : ISubscriptionService
{
    public async Task<SubscriptionDto> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var item = await dbContext.Subscriptions.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            ?? new SubscriptionState { Id = Guid.NewGuid(), UserId = userId, CreatedAtUtc = DateTime.UtcNow };

        return new SubscriptionDto(item.UserId, item.IsActive, item.Plan?.ToString(), item.ExpiresAtUtc?.ToString("O"));
    }

    public async Task<SubscriptionDto> ActivateAsync(Guid userId, ActivateSubscriptionRequestDto request, CancellationToken cancellationToken)
    {
        var subscription = await dbContext.Subscriptions.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (subscription is null)
        {
            subscription = new SubscriptionState { Id = Guid.NewGuid(), UserId = userId, CreatedAtUtc = DateTime.UtcNow };
            dbContext.Subscriptions.Add(subscription);
        }

        subscription.IsActive = true;
        subscription.Plan = NormalizePlan(request.Plan);
        subscription.ExpiresAtUtc = subscription.Plan == SubscriptionPlan.Corporate
            ? DateTime.UtcNow.AddYears(1)
            : DateTime.UtcNow.AddMonths(1);
        subscription.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return new SubscriptionDto(subscription.UserId, subscription.IsActive, subscription.Plan?.ToString(), subscription.ExpiresAtUtc?.ToString("O"));
    }

    private static SubscriptionPlan NormalizePlan(string plan)
    {
        return plan.Trim().ToLowerInvariant() switch
        {
            "professional" or "pro" or "yearly" or "quarterly" => SubscriptionPlan.Professional,
            "corporate" or "enterprise" => SubscriptionPlan.Corporate,
            _ => SubscriptionPlan.Basic
        };
    }
}
