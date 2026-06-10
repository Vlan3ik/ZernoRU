using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Logistics;

namespace Zerno.Infrastructure.Services;

public sealed class LogisticsService : ILogisticsService
{
    public Task<DeliveryQuoteDto> CalculateAsync(DeliveryQuoteRequestDto request, CancellationToken cancellationToken)
    {
        var modeMultiplier = request.Mode.Trim().ToLowerInvariant() switch
        {
            "pickup" => 0.75m,
            "seller_delivery" => 1.0m,
            "partner_delivery" => 1.18m,
            _ => 1.0m
        };

        var price = Math.Round((request.DistanceKm * 22m + request.Volume * 8m) * modeMultiplier, 2);
        var etaDays = request.DistanceKm <= 100 ? 1 : request.DistanceKm <= 400 ? 3 : 6;
        return Task.FromResult(new DeliveryQuoteDto(request.DistanceKm, request.Volume, request.Mode, price, etaDays));
    }
}
