using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Marketplace;
using Zerno.Domain.Marketplace;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Infrastructure.Services;

public sealed class MarketplaceService(AppDbContext dbContext) : IMarketplaceService
{
    public async Task<IReadOnlyList<GrainLotDto>> GetGrainLotsAsync(CancellationToken cancellationToken) =>
        await dbContext.GrainLots
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new GrainLotDto(
                x.Id, x.SellerId, x.SellerName, x.Title, x.Region, x.Description, x.Price, x.CoverImageUrl,
                x.GrainType.ToString(), x.Grade, x.VolumeTons, x.PricePerTon, x.QualityScore, x.HasOwnTransport,
                x.AuctionEnabled, x.MercuryCertificate, x.DeclarationOfConformity, x.StorageContract, x.CreatedAtUtc.ToString("O")))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<EquipmentLotDto>> GetEquipmentLotsAsync(CancellationToken cancellationToken) =>
        await dbContext.EquipmentLots
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new EquipmentLotDto(
                x.Id, x.SellerId, x.SellerName, x.Title, x.Region, x.Description, x.Price, x.CoverImageUrl,
                x.Brand, x.Year, x.Condition.ToString(), x.CreatedAtUtc.ToString("O")))
            .ToListAsync(cancellationToken);

    public async Task<MarketplaceLotDto?> GetLotAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var grain = await dbContext.GrainLots.FindAsync([lotId], cancellationToken);
        if (grain is not null)
        {
            return new GrainLotDto(
                grain.Id, grain.SellerId, grain.SellerName, grain.Title, grain.Region, grain.Description, grain.Price, grain.CoverImageUrl,
                grain.GrainType.ToString(), grain.Grade, grain.VolumeTons, grain.PricePerTon, grain.QualityScore, grain.HasOwnTransport,
                grain.AuctionEnabled, grain.MercuryCertificate, grain.DeclarationOfConformity, grain.StorageContract, grain.CreatedAtUtc.ToString("O"));
        }

        var equipment = await dbContext.EquipmentLots.FindAsync([lotId], cancellationToken);
        return equipment is null
            ? null
            : new EquipmentLotDto(
                equipment.Id, equipment.SellerId, equipment.SellerName, equipment.Title, equipment.Region, equipment.Description, equipment.Price, equipment.CoverImageUrl,
                equipment.Brand, equipment.Year, equipment.Condition.ToString(), equipment.CreatedAtUtc.ToString("O"));
    }

    public async Task<Guid> CreateGrainLotAsync(CreateGrainLotRequestDto request, CancellationToken cancellationToken)
    {
        var lot = new GrainLot
        {
            Id = Guid.NewGuid(),
            SellerId = request.SellerId,
            SellerName = request.SellerName,
            Title = request.Title,
            Region = request.Region,
            Description = request.Description,
            Price = request.Price,
            Category = LotCategory.Grain,
            CoverImageUrl = request.CoverImageUrl,
            GrainType = Enum.Parse<GrainType>(Normalize(request.GrainType), true),
            Grade = request.Grade,
            VolumeTons = request.VolumeTons,
            PricePerTon = request.PricePerTon,
            QualityScore = request.QualityScore,
            HasOwnTransport = request.HasOwnTransport,
            AuctionEnabled = request.AuctionEnabled,
            MercuryCertificate = request.MercuryCertificate,
            DeclarationOfConformity = request.DeclarationOfConformity,
            StorageContract = request.StorageContract,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.GrainLots.Add(lot);
        dbContext.Notifications.Add(new Domain.Notifications.NotificationItem
        {
            Id = Guid.NewGuid(),
            UserId = request.SellerId,
            Message = $"Лот \"{request.Title}\" опубликован.",
            CreatedAtUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        return lot.Id;
    }

    public async Task<Guid> CreateEquipmentLotAsync(CreateEquipmentLotRequestDto request, CancellationToken cancellationToken)
    {
        var lot = new EquipmentLot
        {
            Id = Guid.NewGuid(),
            SellerId = request.SellerId,
            SellerName = request.SellerName,
            Title = request.Title,
            Region = request.Region,
            Description = request.Description,
            Price = request.Price,
            Category = LotCategory.Equipment,
            CoverImageUrl = request.CoverImageUrl,
            Brand = request.Brand,
            Year = request.Year,
            Condition = Enum.Parse<EquipmentCondition>(Normalize(request.Condition), true),
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.EquipmentLots.Add(lot);
        await dbContext.SaveChangesAsync(cancellationToken);
        return lot.Id;
    }

    public async Task AddToCartAsync(Guid userId, AddToCartRequestDto request, CancellationToken cancellationToken)
    {
        var lot = await GetLotEntityAsync(request.LotId, cancellationToken) ?? throw new InvalidOperationException("Лот не найден.");
        var existing = await dbContext.CartItems.FirstOrDefaultAsync(x => x.UserId == userId && x.LotId == request.LotId, cancellationToken);

        if (existing is null)
        {
            dbContext.CartItems.Add(new CartItem
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                LotId = request.LotId,
                Category = lot.Category,
                LotTitle = lot.Title,
                SellerName = lot.SellerName,
                UnitPrice = lot.Price,
                Quantity = Math.Max(1, request.Quantity),
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        else
        {
            existing.Quantity = Math.Max(1, existing.Quantity + request.Quantity);
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CartItemDto>> GetCartAsync(Guid userId, CancellationToken cancellationToken) =>
        await dbContext.CartItems
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new CartItemDto(x.Id, x.LotId, x.Category.ToString(), x.LotTitle, x.SellerName, x.UnitPrice, x.Quantity, x.UnitPrice * x.Quantity))
            .ToListAsync(cancellationToken);

    public async Task UpdateCartQuantityAsync(Guid userId, Guid itemId, int quantity, CancellationToken cancellationToken)
    {
        var item = await dbContext.CartItems.FirstOrDefaultAsync(x => x.UserId == userId && x.Id == itemId, cancellationToken)
            ?? throw new InvalidOperationException("Элемент корзины не найден.");

        if (quantity <= 0)
        {
            dbContext.CartItems.Remove(item);
        }
        else
        {
            item.Quantity = quantity;
            item.UpdatedAtUtc = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveCartItemAsync(Guid userId, Guid itemId, CancellationToken cancellationToken)
    {
        var item = await dbContext.CartItems.FirstOrDefaultAsync(x => x.UserId == userId && x.Id == itemId, cancellationToken)
            ?? throw new InvalidOperationException("Элемент корзины не найден.");

        dbContext.CartItems.Remove(item);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<OrderDto> CheckoutAsync(Guid userId, CheckoutRequestDto request, CancellationToken cancellationToken)
    {
        var items = await dbContext.CartItems.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        if (items.Count == 0)
        {
            throw new InvalidOperationException("Корзина пуста.");
        }

        var orderItems = items.Select(x => new CartItem
        {
            Id = x.Id,
            UserId = x.UserId,
            LotId = x.LotId,
            Category = x.Category,
            LotTitle = x.LotTitle,
            SellerName = x.SellerName,
            UnitPrice = x.UnitPrice,
            Quantity = x.Quantity,
            CreatedAtUtc = x.CreatedAtUtc
        }).ToList();

        var total = orderItems.Sum(x => x.UnitPrice * x.Quantity) + request.DeliveryPrice;
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Items = orderItems.Select(item => new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = Guid.Empty,
                LotId = item.LotId,
                Category = item.Category,
                LotTitle = item.LotTitle,
                SellerName = item.SellerName,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                CreatedAtUtc = DateTime.UtcNow
            }).ToList(),
            PaymentMethod = Enum.Parse<PaymentMethod>(Normalize(request.PaymentMethod), true),
            DeliveryMode = Enum.Parse<DeliveryMode>(Normalize(request.DeliveryMode), true),
            DeliveryPrice = request.DeliveryPrice,
            Total = total,
            Status = OrderStatus.Created,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Orders.Add(order);
        foreach (var item in order.Items)
        {
            item.OrderId = order.Id;
        }
        dbContext.CartItems.RemoveRange(items);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToOrderDto(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync(Guid userId, CancellationToken cancellationToken) =>
        (await dbContext.Orders
            .Include(x => x.Items)
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken))
        .Select(ToOrderDto)
        .ToList();

    private async Task<MarketplaceLot?> GetLotEntityAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var grain = await dbContext.GrainLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
        if (grain is not null)
        {
            return grain;
        }

        return await dbContext.EquipmentLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
    }

    private static string Normalize(string value) =>
        value.Trim().Replace("-", "_").Replace(" ", "_");

    private static OrderDto ToOrderDto(Order x) =>
        new(
            x.Id,
            x.UserId,
            x.Items.Select(item => new OrderItemDto(item.Id, item.LotId, item.Category.ToString(), item.LotTitle, item.SellerName, item.UnitPrice, item.Quantity, item.UnitPrice * item.Quantity)).ToList(),
            x.PaymentMethod.ToString(),
            x.DeliveryMode.ToString(),
            x.DeliveryPrice,
            x.Total,
            x.CreatedAtUtc.ToString("O"),
            x.Status.ToString());
}
