using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Marketplace;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/marketplace")]
public sealed class MarketplaceController(IMarketplaceService marketplaceService, ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet("grain")]
    public Task<IReadOnlyList<GrainLotDto>> Grain(CancellationToken cancellationToken)
        => marketplaceService.GetGrainLotsAsync(cancellationToken);

    [HttpGet("equipment")]
    public Task<IReadOnlyList<EquipmentLotDto>> Equipment(CancellationToken cancellationToken)
        => marketplaceService.GetEquipmentLotsAsync(cancellationToken);

    [HttpGet("lots/{lotId:guid}")]
    public Task<MarketplaceLotDto?> Lot(Guid lotId, CancellationToken cancellationToken)
        => marketplaceService.GetLotAsync(lotId, cancellationToken);

    [HttpPost("grain")]
    public Task<Guid> CreateGrain([FromBody] CreateGrainLotRequestDto request, CancellationToken cancellationToken)
        => marketplaceService.CreateGrainLotAsync(request, cancellationToken);

    [HttpPost("equipment")]
    public Task<Guid> CreateEquipment([FromBody] CreateEquipmentLotRequestDto request, CancellationToken cancellationToken)
        => marketplaceService.CreateEquipmentLotAsync(request, cancellationToken);

    [HttpGet("cart")]
    public async Task<IReadOnlyList<CartItemDto>> Cart(CancellationToken cancellationToken)
        => currentUserContext.UserId is { } userId
            ? await marketplaceService.GetCartAsync(userId, cancellationToken)
            : Array.Empty<CartItemDto>();

    [HttpPost("cart")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequestDto request, CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        await marketplaceService.AddToCartAsync(userId, request, cancellationToken);
        return NoContent();
    }

    [HttpPatch("cart/{itemId:guid}")]
    public async Task<IActionResult> UpdateCart(Guid itemId, [FromBody] UpdateCartQuantityRequestDto request, CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        await marketplaceService.UpdateCartQuantityAsync(userId, itemId, request.Quantity, cancellationToken);
        return NoContent();
    }

    [HttpDelete("cart/{itemId:guid}")]
    public async Task<IActionResult> RemoveCart(Guid itemId, CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        await marketplaceService.RemoveCartItemAsync(userId, itemId, cancellationToken);
        return NoContent();
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequestDto request, CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        var order = await marketplaceService.CheckoutAsync(userId, request, cancellationToken);
        return Ok(order);
    }

    [HttpGet("orders")]
    public Task<IReadOnlyList<OrderDto>> Orders(CancellationToken cancellationToken)
        => currentUserContext.UserId is { } userId
            ? marketplaceService.GetOrdersAsync(userId, cancellationToken)
            : Task.FromResult<IReadOnlyList<OrderDto>>(Array.Empty<OrderDto>());
}

public sealed record UpdateCartQuantityRequestDto(int Quantity);
