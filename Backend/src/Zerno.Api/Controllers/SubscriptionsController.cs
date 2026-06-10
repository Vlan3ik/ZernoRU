using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Subscriptions;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/subscriptions")]
public sealed class SubscriptionsController(ISubscriptionService subscriptionService, ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet]
    public Task<SubscriptionDto> Get(CancellationToken cancellationToken)
        => currentUserContext.UserId is { } userId
            ? subscriptionService.GetAsync(userId, cancellationToken)
            : Task.FromResult(new SubscriptionDto(Guid.Empty, false, null, null));

    [HttpPost("activate")]
    public async Task<IActionResult> Activate([FromBody] ActivateSubscriptionRequestDto request, CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var subscription = await subscriptionService.ActivateAsync(userId, request, cancellationToken);
        return Ok(subscription);
    }
}
