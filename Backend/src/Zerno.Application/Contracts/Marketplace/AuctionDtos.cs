namespace Zerno.Application.Contracts.Marketplace;

public sealed record AuctionSummaryDto(
    Guid LotId,
    string LotTitle,
    decimal StartingPrice,
    decimal CurrentHighestBid,
    decimal MinimumStep,
    string SellerName,
    string StartsAtUtc,
    string EndsAtUtc,
    string Status,
    int BidsCount,
    Guid? LeadingUserId,
    string? LeadingUserName,
    Guid? WinningUserId,
    string? WinningUserName,
    Guid? WinningBidId,
    string? LastBidAtUtc,
    bool IsEnded);

public sealed record AuctionBidDto(
    Guid Id,
    Guid AuctionLotId,
    Guid UserId,
    string UserName,
    decimal Amount,
    string CreatedAtUtc,
    bool IsWinning);

public sealed record PlaceAuctionBidRequestDto(decimal Amount);
