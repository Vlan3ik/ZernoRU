using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Forum;
using Zerno.Application.Contracts.Logistics;
using Zerno.Application.Contracts.Marketplace;
using Zerno.Application.Contracts.Notifications;
using Zerno.Application.Contracts.Portal;
using Zerno.Domain.Users;
using Zerno.Infrastructure.Persistence;
namespace Zerno.Infrastructure.Services;

public sealed class PortalSnapshotService(
    AppDbContext dbContext,
    IMarketplaceService marketplaceService,
    IForumService forumService,
    INotificationService notificationService,
    ISubscriptionService subscriptionService,
    ILogisticsService logisticsService,
    ICurrentUserContext currentUserContext) : IPortalSnapshotService
{
    public async Task<PortalSnapshotDto> GetSnapshotAsync(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users
            .OrderBy(x => x.DisplayName)
            .Select(x => new PortalUserDto(
                x.Id, x.Email, x.DisplayName, x.Role.ToString(), x.Region, x.FarmType, x.Inn, x.Ogrn, x.IsVerifiedSeller, x.SellerVerificationStatus.ToString(), x.PreferredLanguage, x.TwoFactorEnabled, x.EmailNotificationsEnabled))
            .ToListAsync(cancellationToken);

        var currentUserId = currentUserContext.UserId;

        var forumTopics = await forumService.GetTopicsAsync(cancellationToken);
        var forumReplies = new List<ForumReplyDto>();
        foreach (var topic in forumTopics)
        {
            forumReplies.AddRange(await forumService.GetRepliesAsync(topic.Id, cancellationToken));
        }

        var newsArticles = await dbContext.NewsArticles
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var news = newsArticles
            .Select(x => new NewsArticleDto(
                x.Id,
                x.Section,
                x.Title,
                x.Lead,
                x.DateText,
                x.Country,
                x.Culture,
                x.Region,
                x.Type,
                ResolveNewsImageUrl(x.Section, x.Title)))
            .ToList();

        if (currentUserId is null)
        {
            return new PortalSnapshotDto(
                users,
                Guid.Empty,
                await marketplaceService.GetGrainLotsAsync(cancellationToken),
                await marketplaceService.GetEquipmentLotsAsync(cancellationToken),
                await marketplaceService.GetAuctionSummariesAsync(cancellationToken),
                Array.Empty<CartItemDto>(),
                Array.Empty<OrderDto>(),
                forumTopics,
                forumReplies,
                Array.Empty<NotificationDto>(),
                await dbContext.SellerApplications
                    .OrderByDescending(x => x.SubmittedAtUtc)
                    .Select(x => new SellerApplicationDto(x.Id, x.UserId, x.Inn, x.Ogrn, x.CompanyName, x.DocPhotoUrl, x.Status.ToString(), x.SubmittedAtUtc.ToString("O")))
                    .ToListAsync(cancellationToken),
                await subscriptionService.GetAsync(Guid.Empty, cancellationToken),
                news,
                await dbContext.PriceRecords
                    .OrderBy(x => x.Culture)
                    .Select(x => new PriceRecordDto(x.Id, x.Culture, x.Region, x.DayPrice, x.WeekChange))
                    .ToListAsync(cancellationToken),
                await dbContext.AnalyticsPoints
                    .OrderBy(x => x.Month)
                    .Select(x => new AnalyticsPointDto(x.Month, x.Ndvi, x.Ssi, x.PriceForecast, x.Demand, x.Supply))
                    .ToListAsync(cancellationToken),
                await logisticsService.CalculateAsync(new DeliveryQuoteRequestDto(212, 110, "partner_delivery"), cancellationToken));
        }

        return new PortalSnapshotDto(
            users,
            currentUserId.Value,
            await marketplaceService.GetGrainLotsAsync(cancellationToken),
            await marketplaceService.GetEquipmentLotsAsync(cancellationToken),
            await marketplaceService.GetAuctionSummariesAsync(cancellationToken),
            await marketplaceService.GetCartAsync(currentUserId.Value, cancellationToken),
            await marketplaceService.GetOrdersAsync(currentUserId.Value, cancellationToken),
            forumTopics,
            forumReplies,
            await notificationService.ListAsync(currentUserId.Value, cancellationToken),
            await dbContext.SellerApplications
                .OrderByDescending(x => x.SubmittedAtUtc)
                .Select(x => new SellerApplicationDto(x.Id, x.UserId, x.Inn, x.Ogrn, x.CompanyName, x.DocPhotoUrl, x.Status.ToString(), x.SubmittedAtUtc.ToString("O")))
                .ToListAsync(cancellationToken),
            await subscriptionService.GetAsync(currentUserId.Value, cancellationToken),
            news,
            await dbContext.PriceRecords
                .OrderBy(x => x.Culture)
                .Select(x => new PriceRecordDto(x.Id, x.Culture, x.Region, x.DayPrice, x.WeekChange))
                .ToListAsync(cancellationToken),
            await dbContext.AnalyticsPoints
                .OrderBy(x => x.Month)
                .Select(x => new AnalyticsPointDto(x.Month, x.Ndvi, x.Ssi, x.PriceForecast, x.Demand, x.Supply))
                .ToListAsync(cancellationToken),
            await logisticsService.CalculateAsync(new DeliveryQuoteRequestDto(212, 110, "partner_delivery"), cancellationToken));
    }

    private static string? ResolveNewsImageUrl(string section, string title)
    {
        return null;
    }
}
