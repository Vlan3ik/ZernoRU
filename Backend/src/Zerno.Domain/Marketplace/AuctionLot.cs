using Zerno.Domain.Common;

namespace Zerno.Domain.Marketplace;

public sealed class AuctionLot : EntityBase
{
    public Guid LotId { get; set; }
    public decimal StartingPrice { get; set; }
    public decimal MinimumStep { get; set; }
    public decimal CurrentHighestBid { get; set; }
    public Guid? LeadingUserId { get; set; }
    public string? LeadingUserName { get; set; }
    public Guid? WinningBidId { get; set; }
    public Guid? WinningUserId { get; set; }
    public string? WinningUserName { get; set; }
    public DateTime StartsAtUtc { get; set; }
    public DateTime EndsAtUtc { get; set; }
    public AuctionStatus Status { get; set; } = AuctionStatus.Active;

    public ICollection<AuctionBid> Bids { get; set; } = [];
}
