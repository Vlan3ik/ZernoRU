using Zerno.Domain.Common;

namespace Zerno.Domain.Marketplace;

public sealed class AuctionBid : EntityBase
{
    public Guid AuctionLotId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsWinning { get; set; }

    public AuctionLot? AuctionLot { get; set; }
}
