using Zerno.Application.Contracts.Marketplace;

namespace Zerno.Application.Abstractions;

public interface IMarketplaceService
{
    Task<IReadOnlyList<GrainLotDto>> GetGrainLotsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<EquipmentLotDto>> GetEquipmentLotsAsync(CancellationToken cancellationToken);
    Task<MarketplaceLotDto?> GetLotAsync(Guid lotId, CancellationToken cancellationToken);
    Task<Guid> CreateGrainLotAsync(CreateGrainLotRequestDto request, CancellationToken cancellationToken);
    Task<Guid> CreateEquipmentLotAsync(CreateEquipmentLotRequestDto request, CancellationToken cancellationToken);
    Task AddToCartAsync(Guid userId, AddToCartRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyList<CartItemDto>> GetCartAsync(Guid userId, CancellationToken cancellationToken);
    Task UpdateCartQuantityAsync(Guid userId, Guid itemId, int quantity, CancellationToken cancellationToken);
    Task RemoveCartItemAsync(Guid userId, Guid itemId, CancellationToken cancellationToken);
    Task<OrderDto> CheckoutAsync(Guid userId, CheckoutRequestDto request, CancellationToken cancellationToken);
    Task<IReadOnlyList<OrderDto>> GetOrdersAsync(Guid userId, CancellationToken cancellationToken);
}
