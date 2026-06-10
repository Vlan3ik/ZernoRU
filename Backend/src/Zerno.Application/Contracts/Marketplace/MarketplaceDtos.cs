namespace Zerno.Application.Contracts.Marketplace;

public abstract record MarketplaceLotDto(
    Guid Id,
    Guid SellerId,
    string SellerName,
    string Title,
    string Region,
    string Description,
    decimal Price,
    string CreatedAt,
    string Category,
    string? CoverImageUrl);

public sealed record GrainLotDto(
    Guid Id,
    Guid SellerId,
    string SellerName,
    string Title,
    string Region,
    string Description,
    decimal Price,
    string? CoverImageUrl,
    string GrainType,
    string Grade,
    decimal VolumeTons,
    decimal PricePerTon,
    int QualityScore,
    bool HasOwnTransport,
    bool AuctionEnabled,
    string MercuryCertificate,
    string DeclarationOfConformity,
    string StorageContract,
    string CreatedAt) : MarketplaceLotDto(Id, SellerId, SellerName, Title, Region, Description, Price, CreatedAt, "grain", CoverImageUrl);

public sealed record EquipmentLotDto(
    Guid Id,
    Guid SellerId,
    string SellerName,
    string Title,
    string Region,
    string Description,
    decimal Price,
    string? CoverImageUrl,
    string Brand,
    int Year,
    string Condition,
    string CreatedAt) : MarketplaceLotDto(Id, SellerId, SellerName, Title, Region, Description, Price, CreatedAt, "equipment", CoverImageUrl);

public sealed record CartItemDto(
    Guid Id,
    Guid LotId,
    string Category,
    string LotTitle,
    string SellerName,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal);

public sealed record AddToCartRequestDto(Guid LotId, int Quantity);

public sealed record CheckoutRequestDto(string PaymentMethod, string DeliveryMode, decimal DeliveryPrice);

public sealed record OrderItemDto(
    Guid Id,
    Guid LotId,
    string Category,
    string LotTitle,
    string SellerName,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal);

public sealed record OrderDto(
    Guid Id,
    Guid UserId,
    IReadOnlyList<OrderItemDto> Items,
    string PaymentMethod,
    string DeliveryMode,
    decimal DeliveryPrice,
    decimal Total,
    string CreatedAt,
    string Status);

public sealed record CreateGrainLotRequestDto(
    Guid SellerId,
    string SellerName,
    string Title,
    string Region,
    string Description,
    decimal Price,
    string GrainType,
    string Grade,
    decimal VolumeTons,
    decimal PricePerTon,
    int QualityScore,
    bool HasOwnTransport,
    bool AuctionEnabled,
    string MercuryCertificate,
    string DeclarationOfConformity,
    string StorageContract,
    string? CoverImageUrl);

public sealed record CreateEquipmentLotRequestDto(
    Guid SellerId,
    string SellerName,
    string Title,
    string Region,
    string Description,
    decimal Price,
    string Brand,
    int Year,
    string Condition,
    string? CoverImageUrl);
