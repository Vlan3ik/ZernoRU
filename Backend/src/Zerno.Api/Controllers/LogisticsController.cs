using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Logistics;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/logistics")]
public sealed class LogisticsController(ILogisticsService logisticsService) : ControllerBase
{
    [HttpPost("quote")]
    public Task<DeliveryQuoteDto> Quote([FromBody] DeliveryQuoteRequestDto request, CancellationToken cancellationToken)
        => logisticsService.CalculateAsync(request, cancellationToken);
}
