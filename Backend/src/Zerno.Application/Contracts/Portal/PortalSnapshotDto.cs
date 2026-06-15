using Zerno.Application.Contracts.Auth;
using Zerno.Application.Contracts.Forum;
using Zerno.Application.Contracts.Logistics;
using Zerno.Application.Contracts.Marketplace;
using Zerno.Application.Contracts.Notifications;
using Zerno.Application.Contracts.Subscriptions;

namespace Zerno.Application.Contracts.Portal;

public sealed record PortalUserDto(
    Guid Id,
    string Email,
    string DisplayName,
    string Role,
    string Region,
    string FarmType,
    string? Inn,
    string? Ogrn,
    bool IsVerifiedSeller,
    string SellerVerificationStatus,
    string PreferredLanguage,
    bool TwoFactorEnabled,
    bool EmailNotificationsEnabled);

public sealed record SellerApplicationDto(
    Guid Id,
    Guid UserId,
    string Inn,
    string Ogrn,
    string CompanyName,
    string DocPhotoUrl,
    string Status,
    string SubmittedAt);

public sealed record NewsArticleDto(
    Guid Id,
    string Section,
    string Title,
    string Lead,
    string Date,
    string Country,
    string Culture,
    string Region,
    string Type,
    string? ImageUrl);

public sealed record PriceRecordDto(
    Guid Id,
    string Culture,
    string Region,
    decimal Day,
    decimal WeekChange);

public sealed record AnalyticsPointDto(
    string Month,
    decimal Ndvi,
    decimal Ssi,
    decimal PriceForecast,
    decimal Demand,
    decimal Supply);

public sealed record PortalSnapshotDto(
    IReadOnlyList<PortalUserDto> Users,
    Guid CurrentUserId,
    IReadOnlyList<GrainLotDto> GrainLots,
    IReadOnlyList<EquipmentLotDto> EquipmentLots,
    IReadOnlyList<AuctionSummaryDto> AuctionSummaries,
    IReadOnlyList<CartItemDto> Cart,
    IReadOnlyList<OrderDto> Orders,
    IReadOnlyList<ForumTopicDto> ForumTopics,
    IReadOnlyList<ForumReplyDto> ForumReplies,
    IReadOnlyList<NotificationDto> Notifications,
    IReadOnlyList<SellerApplicationDto> SellerApplications,
    SubscriptionDto Subscription,
    IReadOnlyList<NewsArticleDto> News,
    IReadOnlyList<PriceRecordDto> Prices,
    IReadOnlyList<AnalyticsPointDto> Analytics,
    DeliveryQuoteDto SampleDeliveryQuote);
