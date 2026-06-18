using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Marketplace;
using Zerno.Domain.Marketplace;
using Zerno.Domain.Users;
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

    public async Task<IReadOnlyList<AuctionSummaryDto>> GetAuctionSummariesAsync(CancellationToken cancellationToken)
    {
        var auctions = await dbContext.AuctionLots
            .Include(x => x.Bids)
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var lotTitles = await ResolveAuctionLotTitlesAsync(auctions.Select(x => x.LotId), cancellationToken);
        var lotOwners = await ResolveAuctionLotOwnersAsync(auctions.Select(x => x.LotId), cancellationToken);

        foreach (var auction in auctions.Where(x => x.Status == AuctionStatus.Active && DateTime.UtcNow >= x.EndsAtUtc))
        {
            await RefreshAuctionStateAsync(auction, cancellationToken, forceEnd: true);
        }

        return auctions.Select(auction => ToAuctionSummaryDto(
            auction,
            lotTitles.GetValueOrDefault(auction.LotId) ?? string.Empty,
            lotOwners.GetValueOrDefault(auction.LotId) ?? string.Empty)).ToList();
    }

    public async Task<AuctionSummaryDto?> GetAuctionAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var auction = await EnsureAuctionAsync(lotId, cancellationToken);
        if (auction is null)
        {
            return null;
        }

        await RefreshAuctionStateAsync(auction, cancellationToken);
        var lot = await GetLotEntityAsync(lotId, cancellationToken);
        return lot is null ? null : ToAuctionSummaryDto(auction, lot.Title, lot.SellerName);
    }

    public async Task<IReadOnlyList<AuctionBidDto>> GetAuctionBidsAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var auction = await EnsureAuctionAsync(lotId, cancellationToken);
        if (auction is null)
        {
            return Array.Empty<AuctionBidDto>();
        }

        await RefreshAuctionStateAsync(auction, cancellationToken);
        return auction.Bids
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new AuctionBidDto(
                x.Id,
                x.AuctionLotId,
                x.UserId,
                x.UserName,
                x.Amount,
                x.CreatedAtUtc.ToString("O"),
                x.IsWinning))
            .ToList();
    }

    public async Task<AuctionSummaryDto> PlaceAuctionBidAsync(Guid userId, Guid lotId, PlaceAuctionBidRequestDto request, CancellationToken cancellationToken)
    {
        var lot = await GetLotEntityAsync(lotId, cancellationToken) as GrainLot
            ?? throw new InvalidOperationException("Аукцион доступен только для зернового лота.");

        if (!lot.AuctionEnabled)
        {
            throw new InvalidOperationException("Для этого лота аукцион не включен.");
        }

        var auction = await EnsureAuctionAsync(lotId, cancellationToken)
            ?? throw new InvalidOperationException("Аукцион не найден.");

        await RefreshAuctionStateAsync(auction, cancellationToken);
        if (auction.Status != AuctionStatus.Active)
        {
            throw new InvalidOperationException("Аукцион уже завершен.");
        }

        if (DateTime.UtcNow >= auction.EndsAtUtc)
        {
            await RefreshAuctionStateAsync(auction, cancellationToken, forceEnd: true);
            throw new InvalidOperationException("Аукцион уже завершен.");
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException("Пользователь не найден.");

        if (!user.IsVerifiedSeller && user.SellerVerificationStatus != SellerVerificationStatus.Approved)
        {
            throw new InvalidOperationException("Участвовать в аукционе могут только пользователи с подтверждённой верификацией.");
        }

        var currentHighest = auction.Bids.Count == 0 ? auction.StartingPrice : auction.CurrentHighestBid;
        var minAllowed = currentHighest + auction.MinimumStep;
        if (request.Amount < minAllowed)
        {
            throw new InvalidOperationException($"Минимальная следующая ставка: {minAllowed:N0} ₽/т.");
        }

        var bid = new AuctionBid
        {
            Id = Guid.NewGuid(),
            AuctionLotId = auction.Id,
            UserId = user.Id,
            UserName = user.DisplayName,
            Amount = request.Amount,
            IsWinning = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        foreach (var existing in auction.Bids)
        {
            existing.IsWinning = false;
        }

        dbContext.AuctionBids.Add(bid);
        auction.CurrentHighestBid = bid.Amount;
        auction.LeadingUserId = user.Id;
        auction.LeadingUserName = user.DisplayName;
        auction.WinningBidId = null;
        auction.WinningUserId = null;
        auction.WinningUserName = null;
        auction.Status = AuctionStatus.Active;
        auction.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        var summary = ToAuctionSummaryDto(auction, lot.Title, lot.SellerName);
        return summary;
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

        if (request.AuctionEnabled)
        {
            dbContext.AuctionLots.Add(CreateAuctionLot(lot));
        }

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

        var buyer = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
        var lotSellers = await ResolveLotSellersAsync(items.Select(x => x.LotId), cancellationToken);

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

        var total = orderItems.Sum(x => x.UnitPrice * x.Quantity);
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
            DeliveryPrice = 0,
            Total = total,
            Status = OrderStatus.Created,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Orders.Add(order);
        foreach (var item in order.Items)
        {
            item.OrderId = order.Id;
        }

        var shortId = order.Id.ToString("N")[..8];
        dbContext.Notifications.Add(new Domain.Notifications.NotificationItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Message = $"Заказ {shortId} создан. Продавцу отправлено уведомление о новой сделке.",
            CreatedAtUtc = DateTime.UtcNow
        });

        var sellerIds = order.Items
            .Where(item => lotSellers.ContainsKey(item.LotId))
            .Select(item => lotSellers[item.LotId].SellerId)
            .Distinct()
            .ToList();

        foreach (var sellerId in sellerIds)
        {
            var sellerItems = order.Items
                .Where(item => lotSellers.TryGetValue(item.LotId, out var seller) && seller.SellerId == sellerId)
                .ToList();
            var sellerTotal = sellerItems.Sum(item => item.UnitPrice * item.Quantity);
            dbContext.Notifications.Add(new Domain.Notifications.NotificationItem
            {
                Id = Guid.NewGuid(),
                UserId = sellerId,
                Message = $"Новая сделка {shortId}: {sellerItems.Count} поз. на {sellerTotal:N0} ₽ от {buyer?.DisplayName ?? "покупателя"}.",
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        dbContext.CartItems.RemoveRange(items);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToOrderDto(order);
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync(Guid userId, CancellationToken cancellationToken)
    {
        var ownedGrainLotIds = await dbContext.GrainLots
            .Where(x => x.SellerId == userId)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
        var ownedEquipmentLotIds = await dbContext.EquipmentLots
            .Where(x => x.SellerId == userId)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
        var ownedLotIds = ownedGrainLotIds.Concat(ownedEquipmentLotIds).ToHashSet();

        return (await dbContext.Orders
                .Include(x => x.Items)
                .OrderByDescending(x => x.CreatedAtUtc)
                .ToListAsync(cancellationToken))
            .Where(order => order.UserId == userId || order.Items.Any(item => ownedLotIds.Contains(item.LotId)))
            .Select(ToOrderDto)
            .ToList();
    }


    private async Task<Dictionary<Guid, (Guid SellerId, string SellerName, string Title)>> ResolveLotSellersAsync(IEnumerable<Guid> lotIds, CancellationToken cancellationToken)
    {
        var ids = lotIds.Distinct().ToArray();
        var result = new Dictionary<Guid, (Guid SellerId, string SellerName, string Title)>();

        var grain = await dbContext.GrainLots
            .Where(x => ids.Contains(x.Id))
            .Select(x => new { x.Id, x.SellerId, x.SellerName, x.Title })
            .ToListAsync(cancellationToken);
        foreach (var lot in grain)
        {
            result[lot.Id] = (lot.SellerId, lot.SellerName, lot.Title);
        }

        var equipment = await dbContext.EquipmentLots
            .Where(x => ids.Contains(x.Id))
            .Select(x => new { x.Id, x.SellerId, x.SellerName, x.Title })
            .ToListAsync(cancellationToken);
        foreach (var lot in equipment)
        {
            result[lot.Id] = (lot.SellerId, lot.SellerName, lot.Title);
        }

        return result;
    }

    private async Task<MarketplaceLot?> GetLotEntityAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var grain = await dbContext.GrainLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
        if (grain is not null)
        {
            return grain;
        }

        return await dbContext.EquipmentLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
    }

    private async Task<AuctionLot?> EnsureAuctionAsync(Guid lotId, CancellationToken cancellationToken)
    {
        var auction = await dbContext.AuctionLots.Include(x => x.Bids).FirstOrDefaultAsync(x => x.LotId == lotId, cancellationToken);
        if (auction is not null)
        {
            return auction;
        }

        var lot = await dbContext.GrainLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
        if (lot is null || !lot.AuctionEnabled)
        {
            return null;
        }

        auction = CreateAuctionLot(lot);
        dbContext.AuctionLots.Add(auction);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await dbContext.AuctionLots.Include(x => x.Bids).FirstAsync(x => x.Id == auction.Id, cancellationToken);
    }

    private static AuctionLot CreateAuctionLot(GrainLot lot)
    {
        var step = Math.Max(100m, Math.Round(lot.PricePerTon * 0.005m, 0, MidpointRounding.AwayFromZero));
        var now = DateTime.UtcNow;
        return new AuctionLot
        {
            Id = Guid.NewGuid(),
            LotId = lot.Id,
            StartingPrice = lot.PricePerTon,
            MinimumStep = step,
            CurrentHighestBid = lot.PricePerTon,
            StartsAtUtc = now.AddHours(-1),
            EndsAtUtc = now.AddHours(6),
            Status = AuctionStatus.Active,
            CreatedAtUtc = now
        };
    }

    private async Task RefreshAuctionStateAsync(AuctionLot auction, CancellationToken cancellationToken, bool forceEnd = false)
    {
        if (auction.Status != AuctionStatus.Active)
        {
            return;
        }

        if (!forceEnd && DateTime.UtcNow < auction.EndsAtUtc)
        {
            return;
        }

        if (auction.Bids.Count == 0)
        {
            auction.CurrentHighestBid = auction.StartingPrice;
            auction.LeadingUserId = null;
            auction.LeadingUserName = null;
            auction.WinningBidId = null;
            auction.WinningUserId = null;
            auction.WinningUserName = null;
        }
        else
        {
            var winner = auction.Bids.OrderByDescending(x => x.Amount).ThenByDescending(x => x.CreatedAtUtc).First();
            foreach (var bid in auction.Bids)
            {
                bid.IsWinning = bid.Id == winner.Id;
            }

            auction.CurrentHighestBid = winner.Amount;
            auction.LeadingUserId = winner.UserId;
            auction.LeadingUserName = winner.UserName;
            auction.WinningBidId = winner.Id;
            auction.WinningUserId = winner.UserId;
            auction.WinningUserName = winner.UserName;
        }

        auction.Status = AuctionStatus.Ended;
        auction.UpdatedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<Dictionary<Guid, string>> ResolveAuctionLotTitlesAsync(IEnumerable<Guid> lotIds, CancellationToken cancellationToken)
    {
        var ids = lotIds.Distinct().ToArray();
        return await dbContext.GrainLots
            .Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.Title, cancellationToken);
    }

    private async Task<Dictionary<Guid, string>> ResolveAuctionLotOwnersAsync(IEnumerable<Guid> lotIds, CancellationToken cancellationToken)
    {
        var ids = lotIds.Distinct().ToArray();
        return await dbContext.GrainLots
            .Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => x.SellerName, cancellationToken);
    }

    private static AuctionSummaryDto ToAuctionSummaryDto(AuctionLot auction, string lotTitle, string sellerName)
    {
        var lastBid = auction.Bids.OrderByDescending(x => x.CreatedAtUtc).FirstOrDefault();
        return new AuctionSummaryDto(
            auction.LotId,
            lotTitle,
            auction.StartingPrice,
            auction.CurrentHighestBid,
            auction.MinimumStep,
            sellerName,
            auction.StartsAtUtc.ToString("O"),
            auction.EndsAtUtc.ToString("O"),
            auction.Status.ToString(),
            auction.Bids.Count,
            auction.LeadingUserId,
            auction.LeadingUserName,
            auction.WinningUserId,
            auction.WinningUserName,
            auction.WinningBidId,
            lastBid?.CreatedAtUtc.ToString("O"),
            auction.Status == AuctionStatus.Ended);
    }

    private static string Normalize(string value)
    {
        var normalized = value.Trim();
        var lower = normalized.ToLowerInvariant();

        return lower switch
        {
            "пшеница" => nameof(GrainType.Wheat),
            "ячмень" => nameof(GrainType.Barley),
            "кукуруза" => nameof(GrainType.Corn),
            "рожь" => nameof(GrainType.Rye),
            "овес" => nameof(GrainType.Oats),
            "овёс" => nameof(GrainType.Oats),
            "new" => nameof(EquipmentCondition.New),
            "used" => nameof(EquipmentCondition.Used),
            "card" => nameof(PaymentMethod.Card),
            "sbp" => nameof(PaymentMethod.Sbp),
            "invoice" => nameof(PaymentMethod.Invoice),
            "pickup" => nameof(DeliveryMode.Pickup),
            "seller_delivery" => nameof(DeliveryMode.SellerDelivery),
            "seller-delivery" => nameof(DeliveryMode.SellerDelivery),
            "partner_delivery" => nameof(DeliveryMode.PartnerDelivery),
            "partner-delivery" => nameof(DeliveryMode.PartnerDelivery),
            _ => ToPascalCase(normalized)
        };
    }

    private static string ToPascalCase(string value)
    {
        var parts = value.Replace('-', '_').Replace(' ', '_')
            .Split('_', StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length == 0)
        {
            return value;
        }

        return string.Concat(parts.Select(part =>
            part.Length == 1
                ? part.ToUpperInvariant()
                : char.ToUpperInvariant(part[0]) + part[1..]));
    }

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
