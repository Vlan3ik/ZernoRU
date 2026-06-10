using Zerno.Domain.Common;
using Zerno.Domain.Users;

namespace Zerno.Domain.Marketplace;

public abstract class MarketplaceLot : EntityBase
{
    public Guid SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public LotCategory Category { get; set; }
    public bool IsPublished { get; set; } = true;
    public bool IsVerifiedSellerOnly { get; set; }
    public string? CoverImageUrl { get; set; }
    public UserAccount? Seller { get; set; }
}
