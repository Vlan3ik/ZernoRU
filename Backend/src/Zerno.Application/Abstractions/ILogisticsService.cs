using Zerno.Application.Contracts.Logistics;

namespace Zerno.Application.Abstractions;

public interface ILogisticsService
{
    Task<DeliveryQuoteDto> CalculateAsync(DeliveryQuoteRequestDto request, CancellationToken cancellationToken);
}
