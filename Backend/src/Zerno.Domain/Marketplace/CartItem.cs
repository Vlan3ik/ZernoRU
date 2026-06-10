using Zerno.Domain.Common;

namespace Zerno.Domain.Marketplace;

public sealed class CartItem : EntityBase
{
    public Guid UserId { get; set; }
    public Guid LotId { get; set; }
    public LotCategory Category { get; set; }
    public string LotTitle { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}
