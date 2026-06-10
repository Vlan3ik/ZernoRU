namespace Zerno.Application.Contracts.Logistics;

public sealed record DeliveryQuoteRequestDto(decimal DistanceKm, decimal Volume, string Mode);

public sealed record DeliveryQuoteDto(
    decimal DistanceKm,
    decimal Volume,
    string Mode,
    decimal Price,
    int EtaDays);
