using System.Globalization;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Auth;
using Zerno.Application.Contracts.Forum;
using Zerno.Application.Contracts.Logistics;
using Zerno.Application.Contracts.Marketplace;
using Zerno.Application.Contracts.Portal;
using Zerno.Application.Contracts.Subscriptions;
using Zerno.Domain.Analytics;
using Zerno.Domain.Content;
using Zerno.Domain.Marketplace;
using Zerno.Domain.Subscriptions;
using Zerno.Domain.Notifications;
using Zerno.Domain.Users;
using Zerno.Infrastructure;
using Zerno.Infrastructure.Persistence;
using Zerno.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSection = builder.Configuration.GetSection("Jwt");
        var issuer = jwtSection["Issuer"] ?? "Zerno.Api";
        var audience = jwtSection["Audience"] ?? "Zerno.Web";
        var signingKey = jwtSection["SigningKey"] ?? "development-signing-key-change-me";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin();
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionMappingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<PortalSeeder>();
    await seeder.SeedAsync();
}

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapGet("/api/portal/snapshot", async (IPortalSnapshotService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.GetSnapshotAsync(cancellationToken)));

app.MapGet("/api/reference/{category}", async (string category, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var normalizedCategory = category.Trim().ToLowerInvariant();
    var items = await dbContext.ReferenceCatalogItems
        .Where(x => x.Category == normalizedCategory)
        .OrderBy(x => x.Title)
        .Select(x => new ReferenceCatalogItemDto(
            x.Id,
            x.Category,
            x.Slug,
            x.Title,
            x.Region,
            x.Summary,
            x.Details,
            x.Contacts,
            x.Status,
            x.Highlights))
        .ToListAsync(cancellationToken);

    return Results.Ok(items);
});

app.MapGet("/api/marketplace/lots/{lotId:guid}", async Task<IResult> (Guid lotId, IMarketplaceService service, CancellationToken cancellationToken) =>
{
    var lot = await service.GetLotAsync(lotId, cancellationToken);
    return lot is null ? Results.NotFound() : Results.Ok(lot);
});

app.MapGet("/api/marketplace/auctions/{lotId:guid}", async Task<IResult> (Guid lotId, IMarketplaceService service, CancellationToken cancellationToken) =>
{
    var auction = await service.GetAuctionAsync(lotId, cancellationToken);
    return auction is null ? Results.NotFound() : Results.Ok(auction);
});

app.MapGet("/api/marketplace/auctions/{lotId:guid}/bids", async (Guid lotId, IMarketplaceService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.GetAuctionBidsAsync(lotId, cancellationToken)));

app.MapPost("/api/marketplace/auctions/{lotId:guid}/bids", async Task<IResult> (Guid lotId, PlaceAuctionBidRequestDto request, HttpContext httpContext, IMarketplaceService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(await service.PlaceAuctionBidAsync(userId.Value, lotId, request, cancellationToken));
});

app.MapPost("/api/auth/login", async (LoginRequestDto request, IAuthService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.LoginAsync(request, cancellationToken)));

app.MapPost("/api/auth/register", async (RegisterRequestDto request, IAuthService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.RegisterAsync(request, cancellationToken)));

app.MapPost("/api/marketplace/cart", async Task<IResult> (AddToCartRequestDto request, HttpContext httpContext, IMarketplaceService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    await service.AddToCartAsync(userId.Value, request, cancellationToken);
    return Results.NoContent();
});

app.MapPatch("/api/marketplace/cart/{itemId:guid}", async Task<IResult> (Guid itemId, UpdateCartQuantityRequest request, HttpContext httpContext, IMarketplaceService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    await service.UpdateCartQuantityAsync(userId.Value, itemId, request.Quantity, cancellationToken);
    return Results.NoContent();
});

app.MapDelete("/api/marketplace/cart/{itemId:guid}", async Task<IResult> (Guid itemId, HttpContext httpContext, IMarketplaceService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    await service.RemoveCartItemAsync(userId.Value, itemId, cancellationToken);
    return Results.NoContent();
});

app.MapPost("/api/marketplace/checkout", async Task<IResult> (CheckoutRequestDto request, HttpContext httpContext, IMarketplaceService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(await service.CheckoutAsync(userId.Value, request, cancellationToken));
});

app.MapPost("/api/marketplace/grain", async (CreateGrainLotRequestDto request, IMarketplaceService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.CreateGrainLotAsync(request, cancellationToken)));

app.MapPost("/api/marketplace/equipment", async (CreateEquipmentLotRequestDto request, IMarketplaceService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.CreateEquipmentLotAsync(request, cancellationToken)));

app.MapPost("/api/marketplace/service-requests", async Task<IResult> (ServiceRequestDto request, HttpContext httpContext, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId.Value, cancellationToken);
    var recipientId = request.SellerId.HasValue && request.SellerId.Value != Guid.Empty ? request.SellerId.Value : userId.Value;
    var shortTitle = string.IsNullOrWhiteSpace(request.ServiceTitle) ? "услугу" : request.ServiceTitle.Trim();
    var message = recipientId == userId.Value
        ? $"Заявка на услугу «{shortTitle}» создана. Контакт: {request.Phone} · {request.Email}."
        : $"Новая заявка на услугу «{shortTitle}» от {request.Organization}. Контакт: {request.Phone} · {request.Email}.";

    dbContext.Notifications.Add(new NotificationItem
    {
        Id = Guid.NewGuid(),
        UserId = recipientId,
        Message = message,
        CreatedAtUtc = DateTime.UtcNow
    });

    if (recipientId != userId.Value)
    {
        dbContext.Notifications.Add(new NotificationItem
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Message = $"Заявка на услугу «{shortTitle}» отправлена поставщику.",
            CreatedAtUtc = DateTime.UtcNow
        });
    }

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { status = "created", createdAt = DateTime.UtcNow.ToString("O"), user = user?.DisplayName });
});

app.MapPost("/api/forum/topics", async (CreateForumTopicRequestDto request, IForumService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.CreateTopicAsync(request, cancellationToken)));

app.MapPost("/api/forum/replies", async Task<IResult> (ForumReplyRequest request, IForumService service, CancellationToken cancellationToken) =>
{
    var topicId = request.TopicId ?? request.PostId;
    if (topicId is null || topicId.Value == Guid.Empty)
    {
        return Results.BadRequest(new { message = "Не указан topicId/postId для ответа форума." });
    }

    return Results.Ok(await service.CreateReplyAsync(
        new CreateForumReplyRequestDto(topicId.Value, request.AuthorName, request.Rating, request.Content),
        cancellationToken));
});

app.MapPost("/api/seller-applications", async (SellerApplicationRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var application = new SellerApplication
    {
        Id = Guid.NewGuid(),
        UserId = request.UserId,
        Inn = request.Inn.Trim(),
        Ogrn = request.Ogrn.Trim(),
        CompanyName = request.CompanyName.Trim(),
        DocPhotoUrl = request.DocPhotoUrl.Trim(),
        Status = SellerVerificationStatus.Pending,
        SubmittedAtUtc = DateTime.UtcNow,
        CreatedAtUtc = DateTime.UtcNow
    };

    dbContext.SellerApplications.Add(application);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(application.Id);
});

app.MapPatch("/api/seller-applications/{applicationId:guid}/approve", async Task<IResult> (Guid applicationId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var application = await dbContext.SellerApplications.FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
    if (application is null)
    {
        return Results.NotFound();
    }

    application.Status = SellerVerificationStatus.Approved;
    application.UpdatedAtUtc = DateTime.UtcNow;

    var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == application.UserId, cancellationToken);
    if (user is not null)
    {
        user.Role = UserRole.Seller;
        user.IsVerifiedSeller = true;
        user.SellerVerificationStatus = SellerVerificationStatus.Approved;
        user.Inn = application.Inn;
        user.Ogrn = application.Ogrn;
        user.UpdatedAtUtc = DateTime.UtcNow;
    }

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});

app.MapPatch("/api/seller-applications/{applicationId:guid}/reject", async Task<IResult> (Guid applicationId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var application = await dbContext.SellerApplications.FirstOrDefaultAsync(x => x.Id == applicationId, cancellationToken);
    if (application is null)
    {
        return Results.NotFound();
    }

    application.Status = SellerVerificationStatus.Rejected;
    application.UpdatedAtUtc = DateTime.UtcNow;

    var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == application.UserId, cancellationToken);
    if (user is not null && !user.IsVerifiedSeller)
    {
        user.SellerVerificationStatus = SellerVerificationStatus.Rejected;
        user.UpdatedAtUtc = DateTime.UtcNow;
    }

    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});

app.MapPost("/api/notifications/mark-viewed", async Task<IResult> (HttpContext httpContext, INotificationService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    await service.MarkAllViewedAsync(userId.Value, cancellationToken);
    return Results.NoContent();
});

app.MapGet("/api/subscriptions", async Task<IResult> (HttpContext httpContext, ISubscriptionService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(await service.GetAsync(userId.Value, cancellationToken));
});

app.MapPost("/api/subscriptions/activate", async Task<IResult> (ActivateSubscriptionRequestDto request, HttpContext httpContext, ISubscriptionService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(await service.ActivateAsync(userId.Value, request, cancellationToken));
});

app.MapGet("/api/profile/me", async Task<IResult> (HttpContext httpContext, IProfileService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(await service.GetAsync(userId.Value, cancellationToken));
});

app.MapPut("/api/profile/me", async Task<IResult> (UpdateProfileRequestDto request, HttpContext httpContext, IProfileService service, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext);
    if (userId is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(await service.UpdateAsync(userId.Value, request, cancellationToken));
});

app.MapGet("/api/admin/stats", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var stats = new Dictionary<string, int>
    {
        ["Пользователи"] = await dbContext.Users.CountAsync(cancellationToken),
        ["Зерновые лоты"] = await dbContext.GrainLots.CountAsync(cancellationToken),
        ["Техника"] = await dbContext.EquipmentLots.CountAsync(cancellationToken),
        ["Заказы"] = await dbContext.Orders.CountAsync(cancellationToken),
        ["Заявки продавцов"] = await dbContext.SellerApplications.CountAsync(cancellationToken),
        ["Уведомления"] = await dbContext.Notifications.CountAsync(cancellationToken),
        ["Новости"] = await dbContext.NewsArticles.CountAsync(cancellationToken)
    };

    return Results.Ok(stats);
});


app.MapGet("/api/admin/overview", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var users = await dbContext.Users
        .OrderBy(x => x.DisplayName)
        .ToListAsync(cancellationToken);
    var subscriptions = await dbContext.Subscriptions.ToListAsync(cancellationToken);
    var grainLots = await dbContext.GrainLots.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var equipmentLots = await dbContext.EquipmentLots.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var orders = await dbContext.Orders.Include(x => x.Items).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var news = await dbContext.NewsArticles.OrderByDescending(x => x.CreatedAtUtc).Take(100).ToListAsync(cancellationToken);
    var applications = await dbContext.SellerApplications.OrderByDescending(x => x.SubmittedAtUtc).ToListAsync(cancellationToken);

    var userNames = users.ToDictionary(x => x.Id, x => x.DisplayName);
    var activeSubscriptions = subscriptions.Count(x => x.IsActive && (x.ExpiresAtUtc is null || x.ExpiresAtUtc > DateTime.UtcNow));
    var stats = new Dictionary<string, int>
    {
        ["Пользователи"] = users.Count,
        ["Зерновые лоты"] = grainLots.Count,
        ["Техника"] = equipmentLots.Count,
        ["Заказы"] = orders.Count,
        ["Заявки продавцов"] = applications.Count,
        ["Уведомления"] = await dbContext.Notifications.CountAsync(cancellationToken),
        ["Новости"] = news.Count
    };

    return Results.Ok(new AdminOverviewDto(
        stats,
        users.Select(user => new AdminUserDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Region,
            user.FarmType,
            user.Role.ToString(),
            subscriptions.FirstOrDefault(x => x.UserId == user.Id)?.Plan?.ToString() ?? "none",
            user.IsVerifiedSeller,
            user.CreatedAtUtc.ToString("O"))).ToList(),
        grainLots.Select(lot => ToAdminGrainLot(lot)).Concat(equipmentLots.Select(lot => ToAdminEquipmentLot(lot))).OrderByDescending(x => x.CreatedAt).ToList(),
        orders.Select(order => new AdminOrderDto(
            order.Id,
            userNames.GetValueOrDefault(order.UserId, "Пользователь"),
            order.Status.ToString(),
            order.Total,
            order.CreatedAtUtc.ToString("O"),
            order.Items.Count)).ToList(),
        news.Select(ToAdminNews).ToList(),
        applications.Select(x => new AdminApplicationDto(
            x.Id,
            x.CompanyName,
            x.Inn,
            x.Ogrn,
            x.Status.ToString(),
            x.SubmittedAtUtc.ToString("O"))).ToList(),
        new AdminAnalyticsDto(
            activeSubscriptions,
            activeSubscriptions * 12900m,
            grainLots.Count(x => x.IsPublished) + equipmentLots.Count(x => x.IsPublished),
            applications.Count(x => x.Status == SellerVerificationStatus.Pending))));
});

app.MapPatch("/api/admin/users/{userId:guid}", async Task<IResult> (Guid userId, AdminUserUpdateRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
    if (user is null) return Results.NotFound();

    user.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? user.DisplayName : request.DisplayName.Trim();
    user.Email = string.IsNullOrWhiteSpace(request.Email) ? user.Email : request.Email.Trim().ToLowerInvariant();
    user.Region = request.Region?.Trim() ?? user.Region;
    user.FarmType = request.FarmType?.Trim() ?? user.FarmType;
    user.Role = string.Equals(request.Role, "Admin", StringComparison.OrdinalIgnoreCase) ? UserRole.Admin : UserRole.Buyer;
    user.IsVerifiedSeller = request.IsVerifiedSeller ?? user.IsVerifiedSeller;
    user.SellerVerificationStatus = user.IsVerifiedSeller ? SellerVerificationStatus.Approved : user.SellerVerificationStatus;
    user.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    var subscription = await dbContext.Subscriptions.FirstOrDefaultAsync(x => x.UserId == user.Id, cancellationToken);
    return Results.Ok(new AdminUserDto(user.Id, user.Email, user.DisplayName, user.Region, user.FarmType, user.Role.ToString(), subscription?.Plan?.ToString() ?? "none", user.IsVerifiedSeller, user.CreatedAtUtc.ToString("O")));
});

app.MapDelete("/api/admin/users/{userId:guid}", async Task<IResult> (Guid userId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var hasOrders = await dbContext.Orders.AnyAsync(x => x.UserId == userId, cancellationToken);
    var hasLots = await dbContext.GrainLots.AnyAsync(x => x.SellerId == userId, cancellationToken) || await dbContext.EquipmentLots.AnyAsync(x => x.SellerId == userId, cancellationToken);
    if (hasOrders || hasLots) return Results.BadRequest(new { message = "Нельзя удалить пользователя с лотами или сделками. Сначала обработайте связанные записи." });
    var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
    if (user is null) return Results.NotFound();
    dbContext.Users.Remove(user);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});

app.MapPatch("/api/admin/lots/{category}/{lotId:guid}", async Task<IResult> (string category, Guid lotId, AdminLotUpdateRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    if (string.Equals(category, "grain", StringComparison.OrdinalIgnoreCase))
    {
        var lot = await dbContext.GrainLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
        if (lot is null) return Results.NotFound();
        UpdateLot(lot, request);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(ToAdminGrainLot(lot));
    }

    var equipment = await dbContext.EquipmentLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
    if (equipment is null) return Results.NotFound();
    UpdateLot(equipment, request);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(ToAdminEquipmentLot(equipment));
});

app.MapDelete("/api/admin/lots/{category}/{lotId:guid}", async Task<IResult> (string category, Guid lotId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    if (string.Equals(category, "grain", StringComparison.OrdinalIgnoreCase))
    {
        var lot = await dbContext.GrainLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
        if (lot is null) return Results.NotFound();
        dbContext.GrainLots.Remove(lot);
    }
    else
    {
        var lot = await dbContext.EquipmentLots.FirstOrDefaultAsync(x => x.Id == lotId, cancellationToken);
        if (lot is null) return Results.NotFound();
        dbContext.EquipmentLots.Remove(lot);
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});

app.MapPatch("/api/admin/orders/{orderId:guid}", async Task<IResult> (Guid orderId, AdminOrderUpdateRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var order = await dbContext.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);
    if (order is null) return Results.NotFound();
    if (!Enum.TryParse<OrderStatus>(request.Status, true, out var status)) status = order.Status;
    order.Status = status;
    order.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    var userName = await dbContext.Users.Where(x => x.Id == order.UserId).Select(x => x.DisplayName).FirstOrDefaultAsync(cancellationToken) ?? "Пользователь";
    return Results.Ok(new AdminOrderDto(order.Id, userName, order.Status.ToString(), order.Total, order.CreatedAtUtc.ToString("O"), order.Items.Count));
});

app.MapPost("/api/admin/news", async (AdminNewsRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var item = new NewsArticle
    {
        Id = Guid.NewGuid(),
        Section = request.Section?.Trim() ?? "Новости России",
        Title = request.Title.Trim(),
        Lead = request.Lead.Trim(),
        DateText = DateTime.UtcNow.ToString("dd.MM.yyyy", CultureInfo.GetCultureInfo("ru-RU")),
        Country = request.Country?.Trim() ?? "Россия",
        Culture = request.Culture?.Trim() ?? "Пшеница",
        Region = request.Region?.Trim() ?? "Россия",
        Type = request.Type?.Trim() ?? "news",
        CreatedAtUtc = DateTime.UtcNow
    };
    dbContext.NewsArticles.Add(item);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(ToAdminNews(item));
});

app.MapPatch("/api/admin/news/{newsId:guid}", async Task<IResult> (Guid newsId, AdminNewsRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var item = await dbContext.NewsArticles.FirstOrDefaultAsync(x => x.Id == newsId, cancellationToken);
    if (item is null) return Results.NotFound();
    item.Section = request.Section?.Trim() ?? item.Section;
    item.Title = string.IsNullOrWhiteSpace(request.Title) ? item.Title : request.Title.Trim();
    item.Lead = string.IsNullOrWhiteSpace(request.Lead) ? item.Lead : request.Lead.Trim();
    item.Country = request.Country?.Trim() ?? item.Country;
    item.Culture = request.Culture?.Trim() ?? item.Culture;
    item.Region = request.Region?.Trim() ?? item.Region;
    item.Type = request.Type?.Trim() ?? item.Type;
    item.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(ToAdminNews(item));
});

app.MapDelete("/api/admin/news/{newsId:guid}", async Task<IResult> (Guid newsId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var item = await dbContext.NewsArticles.FirstOrDefaultAsync(x => x.Id == newsId, cancellationToken);
    if (item is null) return Results.NotFound();
    dbContext.NewsArticles.Remove(item);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});

app.MapGet("/api/admin/workspace", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var now = DateTime.UtcNow;
    var users = await dbContext.Users.OrderBy(x => x.DisplayName).ToListAsync(cancellationToken);
    var subscriptions = await dbContext.Subscriptions.ToListAsync(cancellationToken);
    var grainLots = await dbContext.GrainLots.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var equipmentLots = await dbContext.EquipmentLots.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var auctions = await dbContext.AuctionLots.Include(x => x.Bids).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var orders = await dbContext.Orders.Include(x => x.Items).OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var applications = await dbContext.SellerApplications.OrderByDescending(x => x.SubmittedAtUtc).ToListAsync(cancellationToken);
    var news = await dbContext.NewsArticles.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var priceRecords = await dbContext.PriceRecords.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var topics = await dbContext.ForumTopics.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var replies = await dbContext.ForumReplies.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken);
    var references = await dbContext.ReferenceCatalogItems.OrderBy(x => x.Category).ThenBy(x => x.Title).ToListAsync(cancellationToken);
    var notifications = await dbContext.Notifications.OrderByDescending(x => x.CreatedAtUtc).Take(100).ToListAsync(cancellationToken);
    var analyticsPoints = await dbContext.AnalyticsPoints.OrderBy(x => x.Month).ToListAsync(cancellationToken);

    var userNames = users.ToDictionary(x => x.Id, x => x.DisplayName);
    var userEmails = users.ToDictionary(x => x.Id, x => x.Email);
    var subscriptionsByUser = subscriptions.GroupBy(x => x.UserId).ToDictionary(x => x.Key, x => x.OrderByDescending(s => s.CreatedAtUtc).First());
    var grainById = grainLots.ToDictionary(x => x.Id, x => x.Title);
    var equipmentById = equipmentLots.ToDictionary(x => x.Id, x => x.Title);
    var lotTitles = grainById.Concat(equipmentById).GroupBy(x => x.Key).ToDictionary(x => x.Key, x => x.First().Value);
    var pendingApplications = applications.Count(x => x.Status == SellerVerificationStatus.Pending);
    var activeSubscriptions = subscriptions.Count(x => x.IsActive && (x.ExpiresAtUtc is null || x.ExpiresAtUtc > now));
    var lotsModeration = grainLots.Count(x => !HasGrainDocuments(x)) + equipmentLots.Count(x => string.IsNullOrWhiteSpace(x.CoverImageUrl));
    var ordersInWork = orders.Count(x => x.Status == OrderStatus.Processing || x.Status == OrderStatus.Paid);
    var revenueForecast = subscriptions.Where(x => x.IsActive).Sum(x => AdminSubscriptionAmount(x.Plan));

    var kpis = new[]
    {
        new { key = "users", title = "Пользователи", value = (decimal)users.Count, suffix = "", severity = "neutral" },
        new { key = "newUsers", title = "Новые пользователи", value = (decimal)users.Count(x => x.CreatedAtUtc >= now.AddDays(-30)), suffix = "за 30 дней", severity = "normal" },
        new { key = "pendingSellers", title = "Продавцы на проверке", value = (decimal)pendingApplications, suffix = "", severity = pendingApplications > 5 ? "critical" : pendingApplications > 0 ? "warning" : "normal" },
        new { key = "activeLots", title = "Активные лоты", value = (decimal)(grainLots.Count(x => x.IsPublished) + equipmentLots.Count(x => x.IsPublished)), suffix = "", severity = "normal" },
        new { key = "moderationLots", title = "Лоты на модерации", value = (decimal)lotsModeration, suffix = "", severity = lotsModeration > 0 ? "warning" : "normal" },
        new { key = "orders", title = "Сделки в работе", value = (decimal)ordersInWork, suffix = "", severity = ordersInWork > 3 ? "warning" : "normal" },
        new { key = "subscriptions", title = "Активные подписки", value = (decimal)activeSubscriptions, suffix = "", severity = "normal" },
        new { key = "revenue", title = "Прогноз выручки", value = revenueForecast, suffix = "₽", severity = "neutral" }
    };

    var tasks = new List<object>();
    tasks.AddRange(applications.Where(x => x.Status == SellerVerificationStatus.Pending).Take(8).Select(x => new
    {
        id = $"seller-{x.Id}",
        type = "Заявка продавца",
        @object = x.CompanyName,
        priority = x.SubmittedAtUtc < now.AddDays(-1) ? "Высокий риск" : "Средний риск",
        status = "new",
        assignee = "Модератор",
        createdAt = x.SubmittedAtUtc.ToString("O"),
        path = "/admin/seller-applications"
    }));
    tasks.AddRange(grainLots.Where(x => !HasGrainDocuments(x)).Take(6).Select(x => new
    {
        id = $"lot-{x.Id}",
        type = "Лот",
        @object = x.Title,
        priority = "Средний риск",
        status = "new",
        assignee = "Модератор лотов",
        createdAt = x.CreatedAtUtc.ToString("O"),
        path = "/admin/lots"
    }));
    tasks.AddRange(orders.Where(x => x.Status == OrderStatus.Paid || x.Status == OrderStatus.Processing).Take(6).Select(x => new
    {
        id = $"order-{x.Id}",
        type = "Сделка",
        @object = $"Заказ {x.Id.ToString()[..8]}",
        priority = "Низкий риск",
        status = "processing",
        assignee = "Оператор сделок",
        createdAt = x.CreatedAtUtc.ToString("O"),
        path = "/admin/orders"
    }));

    var activity = Enumerable.Range(0, 14).Reverse().Select(offset =>
    {
        var day = now.Date.AddDays(-offset);
        return new
        {
            date = day.ToString("dd.MM", CultureInfo.GetCultureInfo("ru-RU")),
            users = users.Count(x => x.CreatedAtUtc.Date <= day),
            lots = grainLots.Count(x => x.CreatedAtUtc.Date <= day) + equipmentLots.Count(x => x.CreatedAtUtc.Date <= day),
            orders = orders.Count(x => x.CreatedAtUtc.Date <= day),
            subscriptions = subscriptions.Count(x => x.CreatedAtUtc.Date <= day),
            revenue = subscriptions.Where(x => x.CreatedAtUtc.Date <= day && x.IsActive).Sum(x => AdminSubscriptionAmount(x.Plan))
        };
    }).ToList();

    var adminUsers = users.Select(user =>
    {
        subscriptionsByUser.TryGetValue(user.Id, out var subscription);
        return new
        {
            id = user.Id,
            displayName = user.DisplayName,
            email = user.Email,
            phone = "+7 900 000-00-00",
            role = user.Role.ToString(),
            roleLabel = user.Role == UserRole.Admin ? "Admin" : user.IsVerifiedSeller ? "Seller" : "Buyer",
            region = user.Region,
            farmType = user.FarmType,
            inn = user.Inn ?? "—",
            ogrn = user.Ogrn ?? "—",
            verificationStatus = user.SellerVerificationStatus.ToString(),
            subscription = subscription?.Plan?.ToString() ?? "none",
            lotsCount = grainLots.Count(x => x.SellerId == user.Id) + equipmentLots.Count(x => x.SellerId == user.Id),
            ordersCount = orders.Count(x => x.UserId == user.Id),
            createdAt = user.CreatedAtUtc.ToString("O"),
            lastActivity = (user.UpdatedAtUtc ?? user.CreatedAtUtc).ToString("O"),
            isVerifiedSeller = user.IsVerifiedSeller
        };
    }).ToList();

    var adminApplications = applications.Select(x => new
    {
        id = x.Id,
        companyName = x.CompanyName,
        inn = x.Inn,
        ogrn = x.Ogrn,
        region = users.FirstOrDefault(user => user.Id == x.UserId)?.Region ?? "—",
        userName = userNames.GetValueOrDefault(x.UserId, "Пользователь"),
        email = userEmails.GetValueOrDefault(x.UserId, "—"),
        phone = "+7 900 000-00-00",
        documentsStatus = string.IsNullOrWhiteSpace(x.DocPhotoUrl) ? "hidden" : "approved",
        status = x.Status.ToString(),
        submittedAt = x.SubmittedAtUtc.ToString("O"),
        assignee = x.Status == SellerVerificationStatus.Pending ? "Модератор" : "Архив",
        docPhotoUrl = x.DocPhotoUrl,
        activityType = users.FirstOrDefault(user => user.Id == x.UserId)?.FarmType ?? "—"
    }).ToList();

    var adminLots = grainLots.Select(lot => new
    {
        id = lot.Id,
        category = "grain",
        title = lot.Title,
        sellerName = lot.SellerName,
        sellerId = lot.SellerId,
        region = lot.Region,
        description = lot.Description,
        price = lot.Price,
        cultureOrType = GrainTypeLabel(lot.GrainType),
        volume = $"{lot.VolumeTons:0.#} т",
        grade = lot.Grade,
        saleFormat = lot.AuctionEnabled ? "Аукцион" : "Фиксированная цена",
        documentsStatus = HasGrainDocuments(lot) ? "approved" : "pending",
        publicationStatus = lot.IsPublished ? "published" : "hidden",
        isPublished = lot.IsPublished,
        createdAt = lot.CreatedAtUtc.ToString("O"),
        quality = lot.QualityScore,
        mercuryCertificate = lot.MercuryCertificate,
        declarationOfConformity = lot.DeclarationOfConformity,
        storageContract = lot.StorageContract
    }).Concat(equipmentLots.Select(lot => new
    {
        id = lot.Id,
        category = "equipment",
        title = lot.Title,
        sellerName = lot.SellerName,
        sellerId = lot.SellerId,
        region = lot.Region,
        description = lot.Description,
        price = lot.Price,
        cultureOrType = lot.Brand,
        volume = "—",
        grade = lot.Condition.ToString(),
        saleFormat = "Фиксированная цена",
        documentsStatus = string.IsNullOrWhiteSpace(lot.CoverImageUrl) ? "pending" : "approved",
        publicationStatus = lot.IsPublished ? "published" : "hidden",
        isPublished = lot.IsPublished,
        createdAt = lot.CreatedAtUtc.ToString("O"),
        quality = lot.Year,
        mercuryCertificate = "—",
        declarationOfConformity = "Паспорт техники",
        storageContract = "Сервисная история"
    })).OrderByDescending(x => x.createdAt).ToList();

    var adminAuctions = auctions.Select(x => new
    {
        id = x.Id,
        lotId = x.LotId,
        lotTitle = lotTitles.GetValueOrDefault(x.LotId, "Лот"),
        sellerName = grainLots.FirstOrDefault(l => l.Id == x.LotId)?.SellerName ?? equipmentLots.FirstOrDefault(l => l.Id == x.LotId)?.SellerName ?? "—",
        startingPrice = x.StartingPrice,
        currentHighestBid = x.CurrentHighestBid,
        minimumStep = x.MinimumStep,
        bidsCount = x.Bids.Count,
        leadingUserName = x.LeadingUserName ?? "—",
        startsAtUtc = x.StartsAtUtc.ToString("O"),
        endsAtUtc = x.EndsAtUtc.ToString("O"),
        status = x.Status.ToString(),
        winner = x.WinningUserName ?? "—"
    }).ToList();

    var adminOrders = orders.Select(order => new
    {
        id = order.Id,
        shortId = order.Id.ToString()[..8],
        buyerName = userNames.GetValueOrDefault(order.UserId, "Покупатель"),
        userName = userNames.GetValueOrDefault(order.UserId, "Покупатель"),
        sellerName = order.Items.FirstOrDefault()?.SellerName ?? "—",
        itemsCount = order.Items.Count,
        total = order.Total,
        paymentMethod = PaymentMethodLabel(order.PaymentMethod),
        deliveryMode = DeliveryModeLabel(order.DeliveryMode),
        deliveryPrice = order.DeliveryPrice,
        status = order.Status.ToString(),
        createdAt = order.CreatedAtUtc.ToString("O"),
        items = order.Items.Select(item => item.LotTitle).ToList()
    }).ToList();

    var adminSubscriptions = users.Select(user =>
    {
        subscriptionsByUser.TryGetValue(user.Id, out var subscription);
        var isActive = subscription is not null && subscription.IsActive && (subscription.ExpiresAtUtc is null || subscription.ExpiresAtUtc > now);
        return new
        {
            id = subscription?.Id ?? user.Id,
            userId = user.Id,
            displayName = user.DisplayName,
            email = user.Email,
            plan = subscription?.Plan?.ToString() ?? "none",
            planCode = subscription?.Plan?.ToString() ?? "Basic",
            period = subscription?.ExpiresAtUtc is null ? "—" : (subscription.ExpiresAtUtc.Value - subscription.CreatedAtUtc).TotalDays > 60 ? "Год" : "Месяц",
            status = isActive ? "active" : subscription is null ? "none" : "expired",
            startedAt = subscription?.CreatedAtUtc.ToString("O") ?? user.CreatedAtUtc.ToString("O"),
            expiresAt = subscription?.ExpiresAtUtc?.ToString("O") ?? "—",
            autoRenew = isActive,
            amount = AdminSubscriptionAmount(subscription?.Plan)
        };
    }).ToList();

    var adminPrices = priceRecords.Select((x, index) => new
    {
        id = x.Id,
        culture = x.Culture,
        className = index % 3 == 0 ? "3 класс" : index % 3 == 1 ? "4 класс" : "5 класс",
        region = x.Region,
        basis = index % 4 == 0 ? "EXW" : index % 4 == 1 ? "CPT" : index % 4 == 2 ? "FOB" : "Элеватор",
        price = x.DayPrice,
        change = x.WeekChange,
        source = index % 2 == 0 ? "Ценовая БД" : "Ручной ввод аналитика",
        updatedAt = (x.UpdatedAtUtc ?? x.CreatedAtUtc).ToString("O"),
        status = "published"
    }).ToList();

    var duties = priceRecords.GroupBy(x => x.Culture).Select((group, index) => new
    {
        id = $"duty-{index}",
        culture = group.Key,
        type = "Экспортная",
        value = $"{Math.Round(group.Average(x => x.DayPrice) * 0.015m, 0)} ₽/т",
        period = $"{now:dd.MM.yyyy} — {now.AddDays(7):dd.MM.yyyy}",
        source = "Официальный источник / ручной ввод",
        status = "active"
    }).ToList();

    var analyticsContent = news.Where(x => x.Type == "analytics" || x.Section == "Аналитика").Select(x => new
    {
        id = x.Id,
        title = x.Title,
        section = x.Section,
        type = "Обзор рынка",
        culture = x.Culture,
        region = x.Region,
        author = "Аналитик",
        status = "published",
        date = x.DateText,
        lead = x.Lead,
        views = Math.Abs(x.Id.GetHashCode()) % 600 + 40
    }).ToList();

    var signalRows = BuildSignalRows(priceRecords.Select(ToAnalyticsPriceRow).ToList(), analyticsPoints).Take(60).Select(x => new
    {
        id = x.Id,
        date = x.Date,
        region = x.Region,
        culture = x.Culture,
        phase = x.Phase,
        type = x.Type,
        risk = x.Risk,
        priceImpact = x.PriceImpact,
        status = x.Status,
        source = x.Source,
        description = x.Description,
        horizon = x.Horizon,
        confidence = x.Confidence
    }).ToList();

    var adminNews = news.Select(x => new
    {
        id = x.Id,
        title = x.Title,
        lead = x.Lead,
        section = x.Section,
        type = x.Type,
        country = x.Country,
        culture = x.Culture,
        region = x.Region,
        author = x.Type == "analytics" ? "Аналитик" : "Редактор",
        status = "published",
        date = x.DateText,
        views = Math.Abs(x.Id.GetHashCode()) % 1500 + 120
    }).ToList();

    var adminTopics = topics.Select(topic => new
    {
        id = topic.Id,
        title = topic.Title,
        section = topic.Section.ToString(),
        authorName = topic.AuthorName,
        tags = topic.Tags,
        repliesCount = replies.Count(x => x.TopicId == topic.Id),
        complaints = topic.Tags.Contains("жалоба") ? "Есть" : "Нет",
        status = topic.Tags.Contains("скрыто") ? "hidden" : "published",
        createdAt = topic.CreatedAtUtc.ToString("O"),
        content = topic.Content,
        mediaUrl = topic.MediaUrl ?? "—"
    }).ToList();

    var adminReplies = replies.Select(reply => new
    {
        id = reply.Id,
        topicId = reply.TopicId,
        topicTitle = topics.FirstOrDefault(topic => topic.Id == reply.TopicId)?.Title ?? "Тема",
        authorName = reply.AuthorName,
        rating = reply.Rating,
        content = reply.Content,
        createdAt = reply.CreatedAtUtc.ToString("O"),
        status = "published"
    }).ToList();

    var adminReferences = references.Select((x, index) => new
    {
        id = x.Id,
        title = x.Title,
        slug = x.Slug,
        category = x.Category,
        order = index + 1,
        status = string.IsNullOrWhiteSpace(x.Status) ? "active" : x.Status,
        usedIn = ReferenceUsedIn(x.Category),
        summary = x.Summary,
        region = x.Region,
        details = x.Details,
        contacts = x.Contacts
    }).ToList();

    var adminNotifications = notifications.Select(x => new
    {
        id = x.Id,
        message = x.Message,
        recipients = userNames.GetValueOrDefault(x.UserId, "Пользователь"),
        channel = "Личный кабинет",
        status = x.Viewed ? "sent" : "new",
        createdAt = x.CreatedAtUtc.ToString("O"),
        opens = x.Viewed ? 1 : 0
    }).ToList();

    var roleMatrix = new[]
    {
        new { section = "Пользователи", view = "Да", create = "Нет", edit = "Да", delete = "Только суперадмин", publish = "Нет" },
        new { section = "Лоты", view = "Да", create = "Нет", edit = "Да", delete = "Ограниченно", publish = "Да" },
        new { section = "Новости", view = "Да", create = "Да", edit = "Да", delete = "Да", publish = "Да" },
        new { section = "Аналитика", view = "Да", create = "Да", edit = "Да", delete = "Да", publish = "Да" },
        new { section = "Подписки", view = "Да", create = "Да", edit = "Да", delete = "Нет", publish = "Нет" },
        new { section = "Настройки", view = "Только суперадмин", create = "Только суперадмин", edit = "Только суперадмин", delete = "Только суперадмин", publish = "Нет" }
    };

    var auditLog = news.Take(15).Select(x => new
    {
        id = $"news-{x.Id}",
        createdAt = (x.UpdatedAtUtc ?? x.CreatedAtUtc).ToString("O"),
        admin = "Редактор",
        section = "Новости и контент",
        action = x.UpdatedAtUtc is null ? "Создание" : "Изменение",
        @object = x.Title,
        oldValue = "—",
        newValue = x.Section,
        device = "127.0.0.1 / web",
        comment = "Публикация через CMS"
    }).Concat(applications.Take(15).Select(x => new
    {
        id = $"app-{x.Id}",
        createdAt = x.SubmittedAtUtc.ToString("O"),
        admin = x.Status == SellerVerificationStatus.Pending ? "—" : "Модератор",
        section = "Заявки продавцов",
        action = x.Status == SellerVerificationStatus.Pending ? "Поступила заявка" : x.Status.ToString(),
        @object = x.CompanyName,
        oldValue = "Pending",
        newValue = x.Status.ToString(),
        device = "127.0.0.1 / web",
        comment = "Проверка документов продавца"
    })).OrderByDescending(x => x.createdAt).ToList();

    return Results.Ok(new
    {
        generatedAt = now.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("ru-RU")),
        kpis,
        tasks,
        activity,
        users = adminUsers,
        sellerApplications = adminApplications,
        lots = adminLots,
        auctions = adminAuctions,
        orders = adminOrders,
        subscriptions = adminSubscriptions,
        prices = adminPrices,
        duties,
        analyticsContent,
        analyticsSignals = signalRows,
        news = adminNews,
        forumTopics = adminTopics,
        forumReplies = adminReplies,
        references = adminReferences,
        notifications = adminNotifications,
        roleMatrix,
        auditLog
    });
});

app.MapPost("/api/admin/actions", (AdminActionRequest request) =>
{
    return Results.Ok(new
    {
        status = "ok",
        request.Action,
        request.Section,
        request.ObjectId,
        request.Comment,
        appliedAt = DateTime.UtcNow.ToString("O")
    });
});

app.MapPatch("/api/admin/auctions/{auctionId:guid}", async Task<IResult> (Guid auctionId, AdminAuctionUpdateRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var auction = await dbContext.AuctionLots.FirstOrDefaultAsync(x => x.Id == auctionId, cancellationToken);
    if (auction is null) return Results.NotFound();
    if (Enum.TryParse<AuctionStatus>(request.Status, true, out var status)) auction.Status = status;
    auction.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { auction.Id, status = auction.Status.ToString() });
});

app.MapPatch("/api/admin/subscriptions/{userId:guid}", async Task<IResult> (Guid userId, AdminSubscriptionUpdateRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
    if (user is null) return Results.NotFound();
    var subscription = await dbContext.Subscriptions.FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
    if (subscription is null)
    {
        subscription = new SubscriptionState { Id = Guid.NewGuid(), UserId = userId, CreatedAtUtc = DateTime.UtcNow };
        dbContext.Subscriptions.Add(subscription);
    }
    subscription.IsActive = request.IsActive ?? true;
    subscription.Plan = ParseAdminSubscriptionPlan(request.Plan) ?? SubscriptionPlan.Basic;
    subscription.ExpiresAtUtc = request.ExpiresAt ?? DateTime.UtcNow.AddDays(string.Equals(request.Period, "year", StringComparison.OrdinalIgnoreCase) ? 365 : string.Equals(request.Period, "trial", StringComparison.OrdinalIgnoreCase) ? 14 : 30);
    subscription.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { subscription.Id, subscription.UserId, plan = subscription.Plan.ToString(), subscription.IsActive, expiresAt = subscription.ExpiresAtUtc?.ToString("O") });
});

app.MapPost("/api/admin/prices", async (AdminPriceRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var item = new PriceRecord
    {
        Id = Guid.NewGuid(),
        Culture = string.IsNullOrWhiteSpace(request.Culture) ? "Пшеница" : request.Culture.Trim(),
        Region = string.IsNullOrWhiteSpace(request.Region) ? "Россия" : request.Region.Trim(),
        DayPrice = request.Price ?? 0,
        WeekChange = request.Change ?? 0,
        CreatedAtUtc = DateTime.UtcNow
    };
    dbContext.PriceRecords.Add(item);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { item.Id, item.Culture, item.Region, price = item.DayPrice, change = item.WeekChange });
});

app.MapPatch("/api/admin/prices/{priceId:guid}", async Task<IResult> (Guid priceId, AdminPriceRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var item = await dbContext.PriceRecords.FirstOrDefaultAsync(x => x.Id == priceId, cancellationToken);
    if (item is null) return Results.NotFound();
    item.Culture = string.IsNullOrWhiteSpace(request.Culture) ? item.Culture : request.Culture.Trim();
    item.Region = string.IsNullOrWhiteSpace(request.Region) ? item.Region : request.Region.Trim();
    item.DayPrice = request.Price ?? item.DayPrice;
    item.WeekChange = request.Change ?? item.WeekChange;
    item.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { item.Id, item.Culture, item.Region, price = item.DayPrice, change = item.WeekChange });
});

app.MapPost("/api/admin/references", async (AdminReferenceRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var title = string.IsNullOrWhiteSpace(request.Title) ? "Новое значение" : request.Title.Trim();
    var slug = string.IsNullOrWhiteSpace(request.Slug) ? title.ToLowerInvariant().Replace(' ', '-') : request.Slug.Trim().ToLowerInvariant();
    var item = new ReferenceCatalogItem
    {
        Id = Guid.NewGuid(),
        Category = string.IsNullOrWhiteSpace(request.Category) ? "general" : request.Category.Trim().ToLowerInvariant(),
        Slug = slug,
        Title = title,
        Region = request.Region?.Trim() ?? "Россия",
        Summary = request.Summary?.Trim() ?? string.Empty,
        Details = request.Details?.Trim() ?? string.Empty,
        Contacts = request.Contacts?.Trim() ?? string.Empty,
        Status = request.Status?.Trim() ?? "active",
        Highlights = [],
        CreatedAtUtc = DateTime.UtcNow
    };
    dbContext.ReferenceCatalogItems.Add(item);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { item.Id, item.Category, item.Slug, item.Title, item.Status });
});

app.MapPatch("/api/admin/references/{referenceId:guid}", async Task<IResult> (Guid referenceId, AdminReferenceRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var item = await dbContext.ReferenceCatalogItems.FirstOrDefaultAsync(x => x.Id == referenceId, cancellationToken);
    if (item is null) return Results.NotFound();
    item.Category = string.IsNullOrWhiteSpace(request.Category) ? item.Category : request.Category.Trim().ToLowerInvariant();
    item.Title = string.IsNullOrWhiteSpace(request.Title) ? item.Title : request.Title.Trim();
    item.Slug = string.IsNullOrWhiteSpace(request.Slug) ? item.Slug : request.Slug.Trim().ToLowerInvariant();
    item.Region = request.Region?.Trim() ?? item.Region;
    item.Summary = request.Summary?.Trim() ?? item.Summary;
    item.Details = request.Details?.Trim() ?? item.Details;
    item.Contacts = request.Contacts?.Trim() ?? item.Contacts;
    item.Status = request.Status?.Trim() ?? item.Status;
    item.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { item.Id, item.Category, item.Slug, item.Title, item.Status });
});

app.MapPost("/api/admin/notifications", async (AdminNotificationRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var usersQuery = dbContext.Users.AsQueryable();
    if (string.Equals(request.Recipients, "sellers", StringComparison.OrdinalIgnoreCase)) usersQuery = usersQuery.Where(x => x.IsVerifiedSeller);
    if (string.Equals(request.Recipients, "subscribers", StringComparison.OrdinalIgnoreCase))
    {
        var activeUserIds = await dbContext.Subscriptions.Where(x => x.IsActive).Select(x => x.UserId).ToListAsync(cancellationToken);
        usersQuery = usersQuery.Where(x => activeUserIds.Contains(x.Id));
    }
    var usersToNotify = await usersQuery.Take(200).ToListAsync(cancellationToken);
    foreach (var user in usersToNotify)
    {
        dbContext.Notifications.Add(new NotificationItem
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Message = request.Message?.Trim() ?? "Системное уведомление",
            Viewed = false,
            CreatedAtUtc = DateTime.UtcNow
        });
    }
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { status = "sent", count = usersToNotify.Count, channel = request.Channel ?? "cabinet" });
});

app.MapPatch("/api/admin/forum/topics/{topicId:guid}", async Task<IResult> (Guid topicId, AdminForumActionRequest request, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var topic = await dbContext.ForumTopics.FirstOrDefaultAsync(x => x.Id == topicId, cancellationToken);
    if (topic is null) return Results.NotFound();
    if (string.Equals(request.Action, "pin", StringComparison.OrdinalIgnoreCase) && !topic.Tags.Contains("закреплено")) topic.Tags.Add("закреплено");
    if (string.Equals(request.Action, "hide", StringComparison.OrdinalIgnoreCase) && !topic.Tags.Contains("скрыто")) topic.Tags.Add("скрыто");
    topic.UpdatedAtUtc = DateTime.UtcNow;
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { topic.Id, topic.Title, topic.Tags });
});

app.MapDelete("/api/admin/forum/topics/{topicId:guid}", async Task<IResult> (Guid topicId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var topic = await dbContext.ForumTopics.FirstOrDefaultAsync(x => x.Id == topicId, cancellationToken);
    if (topic is null) return Results.NotFound();
    var replies = await dbContext.ForumReplies.Where(x => x.TopicId == topicId).ToListAsync(cancellationToken);
    dbContext.ForumReplies.RemoveRange(replies);
    dbContext.ForumTopics.Remove(topic);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});

app.MapDelete("/api/admin/forum/replies/{replyId:guid}", async Task<IResult> (Guid replyId, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var reply = await dbContext.ForumReplies.FirstOrDefaultAsync(x => x.Id == replyId, cancellationToken);
    if (reply is null) return Results.NotFound();
    dbContext.ForumReplies.Remove(reply);
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.NoContent();
});


app.MapPost("/api/logistics/quote", async (DeliveryQuoteRequestDto request, ILogisticsService service, CancellationToken cancellationToken) =>
    Results.Ok(await service.CalculateAsync(request, cancellationToken)));

app.MapGet("/api/media/{**objectKey}", async Task<IResult> (string objectKey, IMediaStorageService mediaStorage, CancellationToken cancellationToken) =>
{
    var media = await mediaStorage.GetAsync(objectKey.TrimStart('/'), cancellationToken);
    if (media is null)
    {
        return Results.NotFound();
    }

    return Results.File(media.Stream, media.ContentType);
});


app.MapGet("/api/analytics/market", async Task<IResult> (
    string? culture,
    string? className,
    string? region,
    string? basis,
    string? period,
    string? dataType,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var dbRows = await dbContext.PriceRecords
        .OrderByDescending(x => x.CreatedAtUtc)
        .ToListAsync(cancellationToken);

    var allRows = dbRows.Select(ToAnalyticsPriceRow).ToList();
    var filteredRows = allRows
        .Where(x => MatchesAnalyticsFilter(x.Culture, culture, "Все культуры"))
        .Where(x => MatchesAnalyticsFilter(x.ClassName, className, "Любой класс"))
        .Where(x => MatchesAnalyticsFilter(x.Region, region, "Все регионы"))
        .Where(x => MatchesAnalyticsFilter(x.Basis, basis, "Любой базис"))
        .ToList();

    var rowsForCards = filteredRows.Count > 0 ? filteredRows : allRows;
    var cards = rowsForCards
        .GroupBy(x => x.Culture)
        .OrderBy(x => x.Key)
        .Select(group =>
        {
            var priced = group.Where(x => x.Price is not null).ToList();
            if (priced.Count == 0)
            {
                return new AnalyticsCultureCardDto(group.Key, "Все классы", null, null, null, "Нет данных", "Нет данных", "—", Array.Empty<decimal>());
            }

            var avgPrice = Math.Round(priced.Average(x => x.Price!.Value), 0);
            var avgChangeRub = Math.Round(priced.Average(x => x.ChangeRub ?? 0), 0);
            var avgPercent = Math.Round(priced.Average(x => x.ChangePercent ?? 0), 1);
            var trend = GetTrend(avgChangeRub);
            return new AnalyticsCultureCardDto(
                group.Key,
                string.IsNullOrWhiteSpace(className) || className.StartsWith("Люб", StringComparison.OrdinalIgnoreCase) ? "Все классы" : className,
                avgPrice,
                avgChangeRub,
                avgPercent,
                trend,
                TrendLabel(trend),
                priced.MaxBy(x => ParseRussianDate(x.UpdatedAt))?.UpdatedAt ?? "—",
                BuildAverageSeries(priced));
        })
        .ToList();

    var regionRows = rowsForCards
        .GroupBy(x => new { x.Region, x.Culture })
        .Select(group =>
        {
            var priced = group.Where(x => x.Price is not null).ToList();
            var avg = priced.Count == 0 ? 0 : Math.Round(priced.Average(x => x.Price!.Value), 0);
            var min = priced.Count == 0 ? 0 : priced.Min(x => x.MinPrice);
            var max = priced.Count == 0 ? 0 : priced.Max(x => x.MaxPrice);
            var change = priced.Count == 0 ? 0 : Math.Round(priced.Average(x => x.ChangeRub ?? 0), 0);
            var demandScore = priced.Count == 0 ? 0 : priced.Average(x => ActivityScore(x.Demand));
            var supplyScore = priced.Count == 0 ? 0 : priced.Average(x => ActivityScore(x.Supply));
            return new AnalyticsRegionRowDto(
                $"{group.Key.Region}-{group.Key.Culture}",
                group.Key.Region,
                group.Key.Culture,
                avg,
                min,
                max,
                change,
                ActivityLabel(demandScore),
                ActivityLabel(supplyScore));
        })
        .OrderByDescending(x => Math.Abs(x.ChangeRub))
        .ToList();

    var chartSeries = BuildChartSeries(rowsForCards, period);
    var growing = cards.Where(x => x.Trend == "up").Select(x => x.Culture).ToList();
    var falling = cards.Where(x => x.Trend == "down").Select(x => x.Culture).ToList();
    var activeRegions = regionRows
        .OrderByDescending(x => ActivityScore(x.DemandActivity) + ActivityScore(x.SupplyActivity))
        .Take(3)
        .Select(x => x.Region)
        .Distinct()
        .ToList();

    var generatedAt = DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("ru-RU"));
    var summaryItems = new List<string>
    {
        growing.Count > 0 ? $"Рост: {string.Join(", ", growing)}." : "Рост: выраженного роста по выбранным фильтрам нет.",
        falling.Count > 0 ? $"Снижение: {string.Join(", ", falling)}." : "Снижение: выраженного снижения по выбранным фильтрам нет.",
        activeRegions.Count > 0 ? $"Наиболее активные регионы: {string.Join(", ", activeRegions)}." : "Активность регионов будет рассчитана после появления данных.",
        "Факторы влияния: спрос покупателей, предложение партий, базис поставки, логистика и качество зерна."
    };

    var reviews = await dbContext.NewsArticles
        .OrderByDescending(x => x.CreatedAtUtc)
        .Where(x => x.Section == "Аналитика" || x.Type == "analytics" || x.Title.ToLower().Contains("рын"))
        .Take(12)
        .Select(x => new AnalyticsReviewDto(
            x.Id,
            x.Title,
            x.Type == "analytics" ? "Недельный" : "Региональный",
            string.IsNullOrWhiteSpace(x.Culture) ? "Все культуры" : x.Culture,
            string.IsNullOrWhiteSpace(x.Region) ? "Россия" : x.Region,
            x.Lead,
            x.DateText,
            x.Type == "analytics" ? "По подписке" : "Бесплатно"))
        .ToListAsync(cancellationToken);

    return Results.Ok(new AnalyticsMarketResponseDto(
        BuildAnalyticsOptions(allRows),
        cards,
        filteredRows,
        regionRows,
        chartSeries,
        new AnalyticsSummaryDto(
            "Краткий вывод по рынку",
            rowsForCards.Count == 0 ? "По выбранным фильтрам данных пока нет. Измените фильтры или дождитесь обновления источников." : "Вывод сформирован на основе ценовых записей и аналитических точек из базы данных.",
            summaryItems,
            generatedAt),
        reviews,
        generatedAt));
});

app.MapGet("/api/analytics/signals", async Task<IResult> (
    string? culture,
    string? region,
    string? risk,
    string? period,
    string? type,
    AppDbContext dbContext,
    CancellationToken cancellationToken) =>
{
    var priceRows = (await dbContext.PriceRecords.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken))
        .Select(ToAnalyticsPriceRow)
        .ToList();
    var points = await dbContext.AnalyticsPoints.ToListAsync(cancellationToken);
    var signals = BuildSignalRows(priceRows, points)
        .Where(x => MatchesAnalyticsFilter(x.Culture, culture, "Все культуры"))
        .Where(x => MatchesAnalyticsFilter(x.Region, region, "Все регионы"))
        .Where(x => string.IsNullOrWhiteSpace(type) || type.StartsWith("Все", StringComparison.OrdinalIgnoreCase) || x.Type == type)
        .Where(x => string.IsNullOrWhiteSpace(risk) || risk.StartsWith("Все", StringComparison.OrdinalIgnoreCase) || RiskLabel(x.Risk) == risk || x.Risk == risk)
        .ToList();

    var regionDetails = signals
        .GroupBy(x => x.Region)
        .Select(group => new AnalyticsRegionSignalDto(
            group.Key,
            group.Select(x => x.Culture).Distinct().ToList(),
            group.Any(x => x.Risk == "high") ? "high" : group.Any(x => x.Risk == "medium") ? "medium" : group.Any(x => x.Risk == "low") ? "low" : "info",
            group.OrderByDescending(x => ParseRussianDate(x.Date)).FirstOrDefault()?.Description ?? "Сигналов нет",
            group.Select(x => x.Type).Distinct().ToList(),
            group.Any(x => x.Risk == "high") ? "Риск урожайности/качества может поддержать цену" : "Влияние нейтральное или умеренное",
            $"/analytics?region={Uri.EscapeDataString(group.Key)}"))
        .OrderBy(x => x.Region)
        .ToList();

    var impacts = signals.Select(x => new AnalyticsSignalImpactDto(
        x.Id,
        x.Description,
        x.Region,
        x.Culture,
        x.Risk == "high" ? "Снижение" : x.Risk == "medium" ? "Риск снижения" : "Без изменений",
        x.Type == "Качество" || x.Risk == "high" ? "Отрицательное" : x.Risk == "low" ? "Нейтральное" : "Умеренное",
        x.PriceImpact,
        x.Horizon,
        x.Confidence)).ToList();

    return Results.Ok(new AnalyticsSignalsResponseDto(
        new AnalyticsSignalOptionsDto(
            priceRows.Select(x => x.Culture).Distinct().OrderBy(x => x).Prepend("Все культуры").ToList(),
            priceRows.Select(x => x.Region).Distinct().OrderBy(x => x).Prepend("Все регионы").ToList(),
            new[] { "Все типы", "Погода", "Посевы", "Уборка", "Качество", "Логистика" },
            new[] { "Все риски", "Высокий риск", "Средний риск", "Низкий риск", "Информационный сигнал" }),
        signals,
        regionDetails,
        impacts,
        DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("ru-RU"))));
});

app.MapGet("/api/analytics/report-example", async (AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var rows = (await dbContext.PriceRecords.OrderByDescending(x => x.CreatedAtUtc).Take(8).ToListAsync(cancellationToken))
        .Select(ToAnalyticsPriceRow)
        .ToList();
    var points = await dbContext.AnalyticsPoints.OrderBy(x => x.Month).ToListAsync(cancellationToken);
    return Results.Ok(new
    {
        generatedAt = DateTime.UtcNow.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("ru-RU")),
        sections = new[]
        {
            new { label = "Сводка рынка", text = "Краткий вывод по рынку на базе ценовых записей БД." },
            new { label = "Цены", text = "Таблица цен по культурам, регионам, классам и базисам." },
            new { label = "Динамика", text = "Графики изменения цены по выбранному периоду." },
            new { label = "Сигналы", text = "Агрономические, погодные и логистические факторы." },
            new { label = "Прогноз", text = "Ожидаемое направление цены и горизонт влияния." },
            new { label = "Рекомендации", text = "Практические выводы для продавцов и закупщиков." }
        },
        pricePreview = rows,
        chartPreview = BuildChartSeries(rows, "Месяц"),
        indicators = points.Select(x => new { x.Month, x.Ndvi, x.Ssi, x.PriceForecast, x.Demand, x.Supply }).ToList()
    });
});

app.MapGet("/api/analytics/tariffs", async (string? period, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var yearly = string.Equals(period, "year", StringComparison.OrdinalIgnoreCase);
    var activeSubscriptions = await dbContext.Subscriptions.CountAsync(x => x.IsActive, cancellationToken);
    var users = await dbContext.Users.CountAsync(cancellationToken);
    return Results.Ok(new
    {
        period = yearly ? "year" : "month",
        activeSubscriptions,
        users,
        plans = new[]
        {
            new { code = "basic", name = "Базовый", description = "Для производителей и небольших закупок", price = yearly ? "49 900 ₽/год" : "4 900 ₽/мес", features = new[] { "Ценовые карточки", "2 культуры", "3 региона", "Еженедельный обзор" }, limits = "1 пользователь, экспорт ограничен", action = "Выбрать тариф", accent = false },
            new { code = "professional", name = "Профессиональный", description = "Для трейдеров, закупщиков и регулярной аналитики", price = yearly ? "129 000 ₽/год" : "12 900 ₽/мес", features = new[] { "Все культуры", "Все регионы", "Сигналы по посевам", "Экспорт Excel и PDF" }, limits = "До 5 пользователей", action = "Выбрать тариф", accent = true },
            new { code = "corporate", name = "Корпоративный", description = "Для команд, экспортеров и интеграций", price = "По запросу", features = new[] { "API-доступ", "Командный кабинет", "Персональный аналитик", "Архив данных" }, limits = "Лимиты и SLA по договору", action = "Запросить условия", accent = false }
        },
        comparison = new[]
        {
            new { feature = "Доступ к ценовым карточкам", basic = "Да", pro = "Да", corp = "Да" },
            new { feature = "Доступ к таблице цен", basic = "Ограничено", pro = "Да", corp = "Да" },
            new { feature = "Количество культур", basic = "2", pro = "Все", corp = "Все" },
            new { feature = "Количество регионов", basic = "3", pro = "Все", corp = "Все + персональные" },
            new { feature = "Обзоры рынка", basic = "Еженедельно", pro = "Ежедневно", corp = "Ежедневно + спецобзоры" },
            new { feature = "Сигналы по посевам", basic = "Нет", pro = "Да", corp = "Да" },
            new { feature = "Прогнозы", basic = "Ограничено", pro = "Да", corp = "Да" },
            new { feature = "Уведомления", basic = "Email", pro = "ЛК, email, Telegram", corp = "Все каналы" },
            new { feature = "Экспорт в Excel", basic = "Ограничено", pro = "Да", corp = "Да" },
            new { feature = "Экспорт в PDF", basic = "Нет", pro = "Да", corp = "Да" },
            new { feature = "Архив данных", basic = "30 дней", pro = "1 год", corp = "По запросу" },
            new { feature = "Количество пользователей", basic = "1", pro = "До 5", corp = "По запросу" },
            new { feature = "API-доступ", basic = "Нет", pro = "Нет", corp = "Да" },
            new { feature = "Персональный аналитик", basic = "Нет", pro = "Нет", corp = "Да" },
            new { feature = "Поддержка", basic = "Стандартная", pro = "Приоритетная", corp = "Выделенная" }
        }
    });
});

app.MapPost("/api/analytics/subscription-settings", async Task<IResult> (AnalyticsSubscriptionSettingsRequest request, HttpContext httpContext, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    var userId = ResolveUserId(httpContext) ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
    dbContext.Notifications.Add(new NotificationItem
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Message = $"Настройки аналитики сохранены: {string.Join(", ", request.Cultures ?? Array.Empty<string>())}; {string.Join(", ", request.Regions ?? Array.Empty<string>())}.",
        Viewed = false,
        CreatedAtUtc = DateTime.UtcNow
    });
    await dbContext.SaveChangesAsync(cancellationToken);
    return Results.Ok(new { status = "saved", savedAt = DateTime.UtcNow.ToString("O") });
});

app.MapPost("/api/analytics/tariffs/select", async Task<IResult> (AnalyticsTariffSelectRequest request, HttpContext httpContext, ISubscriptionService subscriptionService, AppDbContext dbContext, CancellationToken cancellationToken) =>
{
    if (string.Equals(request.Plan, "enterprise", StringComparison.OrdinalIgnoreCase) || string.Equals(request.Plan, "corporate", StringComparison.OrdinalIgnoreCase))
    {
        var userIdForRequest = ResolveUserId(httpContext) ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
        dbContext.Notifications.Add(new NotificationItem
        {
            Id = Guid.NewGuid(),
            UserId = userIdForRequest,
            Message = "Запрос корпоративных условий аналитики принят. Менеджер свяжется с вами.",
            Viewed = false,
            CreatedAtUtc = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);
        return Results.Ok(new { status = "request_created" });
    }

    var userId = ResolveUserId(httpContext) ?? Guid.Parse("11111111-1111-1111-1111-111111111111");
    var plan = NormalizeAnalyticsPlan(request.Plan);
    var subscription = await subscriptionService.ActivateAsync(userId, new ActivateSubscriptionRequestDto(plan), cancellationToken);

    dbContext.Notifications.Add(new NotificationItem
    {
        Id = Guid.NewGuid(),
        UserId = userId,
        Message = $"Оплата аналитики принята: тариф {request.Plan}, период {request.Period}, чек {request.Receipt ?? "demo"}.",
        Viewed = false,
        CreatedAtUtc = DateTime.UtcNow
    });
    await dbContext.SaveChangesAsync(cancellationToken);

    return Results.Ok(subscription);
});

app.MapControllers();

app.Run();

static Guid? ResolveUserId(HttpContext context)
{
    var claimValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (Guid.TryParse(claimValue, out var claimUserId))
    {
        return claimUserId;
    }

    var headerValue = context.Request.Headers["X-User-Id"].ToString();
    return Guid.TryParse(headerValue, out var headerUserId) ? headerUserId : null;
}

static AnalyticsOptionsDto BuildAnalyticsOptions(IReadOnlyList<AnalyticsPriceRowDto> rows)
    => new(
        rows.Select(x => x.Culture).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().OrderBy(x => x).Prepend("Все культуры").ToList(),
        rows.Select(x => x.ClassName).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().OrderBy(x => x).Prepend("Любой класс").ToList(),
        rows.Select(x => x.Region).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().OrderBy(x => x).Prepend("Все регионы").ToList(),
        rows.Select(x => x.Basis).Where(x => !string.IsNullOrWhiteSpace(x)).Distinct().OrderBy(x => x).Prepend("Любой базис").ToList(),
        new[] { "День", "Неделя", "Месяц", "Сезон" },
        new[] { "Цена", "Динамика", "Прогноз", "Сигнал" });

static AnalyticsPriceRowDto ToAnalyticsPriceRow(PriceRecord record)
{
    var culture = NormalizeCulture(record.Culture);
    var className = ResolveClass(record.Culture, culture);
    var basis = ResolveBasis(record.Id);
    var source = ResolveSource(record.Id);
    var changePercent = record.WeekChange;
    var changeRub = Math.Round(record.DayPrice * changePercent / 100m, 0);
    var trend = GetTrend(changeRub);
    var series = BuildSeries(record.DayPrice, changeRub, record.Id);
    var spread = Math.Max(Math.Round(record.DayPrice * 0.035m, 0), 150);
    var demand = changePercent >= 1.5m ? "Высокая" : changePercent <= -1m ? "Низкая" : "Средняя";
    var supply = changePercent <= -1m ? "Высокая" : changePercent >= 1.5m ? "Низкая" : "Средняя";
    return new AnalyticsPriceRowDto(
        record.Id.ToString(),
        culture,
        className,
        NormalizeRegion(record.Region),
        basis,
        record.DayPrice,
        changeRub,
        changePercent,
        record.CreatedAtUtc.ToString("dd.MM.yyyy", CultureInfo.GetCultureInfo("ru-RU")),
        source,
        Math.Max(record.DayPrice - spread, 0),
        record.DayPrice + spread,
        demand,
        supply,
        series,
        trend);
}

static string NormalizeCulture(string value)
{
    if (value.Contains("кукуруз", StringComparison.OrdinalIgnoreCase)) return "Кукуруза";
    if (value.Contains("яч", StringComparison.OrdinalIgnoreCase)) return "Ячмень";
    if (value.Contains("рож", StringComparison.OrdinalIgnoreCase)) return "Рожь";
    if (value.Contains("ов", StringComparison.OrdinalIgnoreCase)) return "Овес";
    return "Пшеница";
}

static string ResolveClass(string source, string culture)
{
    if (source.Contains("1", StringComparison.OrdinalIgnoreCase)) return "1 класс";
    if (source.Contains("2", StringComparison.OrdinalIgnoreCase)) return "2 класс";
    if (source.Contains("3", StringComparison.OrdinalIgnoreCase)) return "3 класс";
    if (source.Contains("4", StringComparison.OrdinalIgnoreCase)) return "4 класс";
    if (source.Contains("5", StringComparison.OrdinalIgnoreCase)) return "5 класс";
    if (source.Contains("фураж", StringComparison.OrdinalIgnoreCase) || culture is "Кукуруза" or "Ячмень") return "Фуражная";
    return "3 класс";
}

static string NormalizeRegion(string value)
{
    if (string.IsNullOrWhiteSpace(value)) return "Россия";
    return value.Replace("ЦФО", "Центральный ФО", StringComparison.OrdinalIgnoreCase)
        .Replace("ЮФО", "Южный ФО", StringComparison.OrdinalIgnoreCase);
}

static string ResolveBasis(Guid id)
{
    var options = new[] { "EXW", "CPT", "FOB", "Элеватор", "Порт" };
    return options[Math.Abs(id.GetHashCode()) % options.Length];
}

static string ResolveSource(Guid id)
{
    var options = new[] { "Росстат", "ПроЗерно", "ИКАР", "ЗерноОнлайн", "Биржевой мониторинг" };
    return options[Math.Abs(id.GetHashCode()) % options.Length];
}

static IReadOnlyList<decimal> BuildSeries(decimal price, decimal changeRub, Guid id)
{
    var offset = Math.Abs(id.GetHashCode()) % 90;
    var start = price - changeRub - offset;
    var values = new List<decimal>();
    for (var i = 0; i < 7; i++)
    {
        var wave = ((i % 3) - 1) * (20 + offset % 25);
        var step = (price - start) / 6m * i;
        values.Add(Math.Max(Math.Round(start + step + wave, 0), 0));
    }
    values[^1] = price;
    return values;
}

static IReadOnlyList<decimal> BuildAverageSeries(IReadOnlyList<AnalyticsPriceRowDto> rows)
{
    var max = rows.Max(x => x.Series.Count);
    if (max == 0) return Array.Empty<decimal>();
    var result = new List<decimal>();
    for (var i = 0; i < max; i++)
    {
        var values = rows.Where(x => x.Series.Count > i).Select(x => x.Series[i]).ToList();
        result.Add(values.Count == 0 ? 0 : Math.Round(values.Average(), 0));
    }
    return result;
}

static IReadOnlyList<AnalyticsChartPointDto> BuildChartSeries(IReadOnlyList<AnalyticsPriceRowDto> rows, string? period)
{
    var labels = ResolvePeriodLabels(period);
    if (rows.Count == 0)
    {
        return labels.Select(x => new AnalyticsChartPointDto(x, 0, 0, 0, 0)).ToList();
    }

    return labels.Select((label, index) =>
    {
        var values = rows.Select(row => row.Series.Count > 0 ? row.Series[Math.Min(index * row.Series.Count / labels.Count, row.Series.Count - 1)] : row.Price ?? 0).Where(x => x > 0).ToList();
        var avg = values.Count == 0 ? 0 : Math.Round(values.Average(), 0);
        var min = values.Count == 0 ? 0 : values.Min();
        var max = values.Count == 0 ? 0 : values.Max();
        return new AnalyticsChartPointDto(label, avg, min, max, avg);
    }).ToList();
}

static IReadOnlyList<string> ResolvePeriodLabels(string? period)
{
    if (string.Equals(period, "День", StringComparison.OrdinalIgnoreCase)) return new[] { "09:00", "11:00", "13:00", "15:00", "17:00" };
    if (string.Equals(period, "Неделя", StringComparison.OrdinalIgnoreCase)) return new[] { "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс" };
    if (string.Equals(period, "Сезон", StringComparison.OrdinalIgnoreCase)) return new[] { "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен" };
    return new[] { "23 май", "27 май", "31 май", "4 июн", "8 июн", "12 июн", "15 июн" };
}

static bool MatchesAnalyticsFilter(string value, string? filter, string allLabel)
{
    if (string.IsNullOrWhiteSpace(filter)) return true;
    if (filter.StartsWith("Все", StringComparison.OrdinalIgnoreCase) || filter.StartsWith("Люб", StringComparison.OrdinalIgnoreCase)) return true;
    return value.Equals(filter, StringComparison.OrdinalIgnoreCase);
}

static string GetTrend(decimal? change)
{
    if (change is null) return "none";
    if (change > 0) return "up";
    if (change < 0) return "down";
    return "flat";
}

static string TrendLabel(string trend)
    => trend switch
    {
        "up" => "Рост",
        "down" => "Снижение",
        "flat" => "Без изменений",
        _ => "Нет данных"
    };

static int ActivityScore(string activity)
    => activity switch
    {
        "Высокая" => 3,
        "Средняя" => 2,
        "Низкая" => 1,
        _ => 0
    };

static string ActivityLabel(double score)
    => score >= 2.5 ? "Высокая" : score >= 1.5 ? "Средняя" : "Низкая";

static DateTime ParseRussianDate(string value)
    => DateTime.TryParseExact(value, "dd.MM.yyyy", CultureInfo.GetCultureInfo("ru-RU"), DateTimeStyles.None, out var result) ? result : DateTime.MinValue;

static IReadOnlyList<AnalyticsSignalRowDto> BuildSignalRows(IReadOnlyList<AnalyticsPriceRowDto> priceRows, IReadOnlyList<AnalyticsPoint> points)
{
    var result = new List<AnalyticsSignalRowDto>();
    var today = DateTime.UtcNow.Date;
    var orderedPoints = points.OrderBy(x => MonthIndex(x.Month)).ToList();
    foreach (var row in priceRows.Take(30))
    {
        var point = orderedPoints.Count == 0 ? null : orderedPoints[Math.Abs(row.Id.GetHashCode()) % orderedPoints.Count];
        var risk = ResolveRisk(row, point);
        var type = ResolveSignalType(row, point);
        var status = risk == "high" ? "Новый" : risk == "medium" ? "Актуальный" : "Актуальный";
        var priceImpact = row.Trend == "up" || risk == "high" ? "Рост цены" : row.Trend == "down" ? "Снижение цены" : "Нейтрально";
        result.Add(new AnalyticsSignalRowDto(
            $"sig-{row.Id}",
            today.AddDays(-(Math.Abs(row.Id.GetHashCode()) % 6)).ToString("dd.MM.yyyy", CultureInfo.GetCultureInfo("ru-RU")),
            row.Region,
            row.Culture,
            type == "Уборка" ? "Уборка" : type == "Хранение" ? "Хранение" : "Вегетация",
            type,
            BuildSignalDescription(row, point, risk, type),
            risk,
            RiskLabel(risk),
            priceImpact,
            status,
            point is null ? row.Source : "Спутниковый мониторинг + ценовая БД",
            risk == "high" ? "Краткосрочно" : risk == "medium" ? "Среднесрочно" : "Сезон",
            risk == "info" ? "Низкая" : risk == "high" ? "Высокая" : "Средняя"));
    }
    return result;
}

static string ResolveRisk(AnalyticsPriceRowDto row, AnalyticsPoint? point)
{
    if (Math.Abs(row.ChangePercent ?? 0) >= 2.5m) return "high";
    if (point is not null && point.Ssi < 0.35m) return "high";
    if (Math.Abs(row.ChangePercent ?? 0) >= 1m) return "medium";
    if (point is not null && point.Ndvi > 0.65m) return "low";
    return "info";
}

static string ResolveSignalType(AnalyticsPriceRowDto row, AnalyticsPoint? point)
{
    if (point is not null && point.Ssi < 0.4m) return "Погода";
    if (row.Basis is "Порт" or "FOB") return "Логистика";
    if (row.Culture == "Пшеница" && row.ClassName.Contains("3")) return "Качество";
    return Math.Abs(row.Id.GetHashCode()) % 3 == 0 ? "Посевы" : "Уборка";
}

static string BuildSignalDescription(AnalyticsPriceRowDto row, AnalyticsPoint? point, string risk, string type)
{
    var riskText = risk == "high" ? "высокий риск" : risk == "medium" ? "умеренный риск" : risk == "low" ? "стабильная ситуация" : "информационный сигнал";
    var indicator = point is null ? "ценовой динамики" : $"NDVI {point.Ndvi:0.00}, SSI {point.Ssi:0.00}";
    return $"{row.Region}: {row.Culture}, {row.ClassName}. Тип сигнала: {type}; {riskText} на основе {indicator} и изменения цены {row.ChangePercent:+0.0;-0.0;0}%.";
}

static string RiskLabel(string risk)
    => risk switch
    {
        "high" => "Высокий риск",
        "medium" => "Средний риск",
        "low" => "Низкий риск",
        _ => "Информационный сигнал"
    };

static int MonthIndex(string month)
{
    var months = new[] { "Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек" };
    var index = Array.FindIndex(months, x => x.Equals(month, StringComparison.OrdinalIgnoreCase));
    return index < 0 ? 0 : index;
}

static AdminLotDto ToAdminGrainLot(GrainLot lot)
    => new(lot.Id, "grain", lot.Title, lot.SellerName, lot.Region, lot.Price, lot.IsPublished, lot.CreatedAtUtc.ToString("O"));

static AdminLotDto ToAdminEquipmentLot(EquipmentLot lot)
    => new(lot.Id, "equipment", lot.Title, lot.SellerName, lot.Region, lot.Price, lot.IsPublished, lot.CreatedAtUtc.ToString("O"));

static void UpdateLot(MarketplaceLot lot, AdminLotUpdateRequest request)
{
    lot.Title = string.IsNullOrWhiteSpace(request.Title) ? lot.Title : request.Title.Trim();
    lot.Region = request.Region?.Trim() ?? lot.Region;
    lot.Description = request.Description?.Trim() ?? lot.Description;
    lot.Price = request.Price ?? lot.Price;
    lot.IsPublished = request.IsPublished ?? lot.IsPublished;
    lot.UpdatedAtUtc = DateTime.UtcNow;
}

static AdminNewsDto ToAdminNews(NewsArticle item)
    => new(item.Id, item.Section, item.Title, item.Lead, item.DateText, item.Country, item.Culture, item.Region, item.Type);



static bool HasGrainDocuments(GrainLot lot)
    => !string.IsNullOrWhiteSpace(lot.MercuryCertificate)
       && !string.IsNullOrWhiteSpace(lot.DeclarationOfConformity)
       && !string.IsNullOrWhiteSpace(lot.StorageContract);

static decimal AdminSubscriptionAmount(SubscriptionPlan? plan)
    => plan switch
    {
        SubscriptionPlan.Corporate => 89900m,
        SubscriptionPlan.Professional => 29900m,
        SubscriptionPlan.Basic => 9900m,
        _ => 0m
    };

static SubscriptionPlan? ParseAdminSubscriptionPlan(string? plan)
    => plan?.Trim().ToLowerInvariant() switch
    {
        "basic" or "базовый" => SubscriptionPlan.Basic,
        "professional" or "pro" or "профессиональный" => SubscriptionPlan.Professional,
        "corporate" or "enterprise" or "корпоративный" => SubscriptionPlan.Corporate,
        _ => null
    };

static string GrainTypeLabel(GrainType grainType)
    => grainType switch
    {
        GrainType.Wheat => "Пшеница",
        GrainType.Barley => "Ячмень",
        GrainType.Corn => "Кукуруза",
        GrainType.Rye => "Рожь",
        GrainType.Oats => "Овес",
        _ => grainType.ToString()
    };

static string PaymentMethodLabel(PaymentMethod method)
    => method switch
    {
        PaymentMethod.Card => "Карта",
        PaymentMethod.Sbp => "СБП",
        PaymentMethod.Invoice => "Счет для юрлица",
        _ => method.ToString()
    };

static string DeliveryModeLabel(DeliveryMode mode)
    => mode switch
    {
        DeliveryMode.Pickup => "Самовывоз",
        DeliveryMode.SellerDelivery => "Доставка продавцом",
        DeliveryMode.PartnerDelivery => "Партнерская доставка",
        _ => mode.ToString()
    };

static string ReferenceUsedIn(string category)
    => category.Trim().ToLowerInvariant() switch
    {
        "cultures" => "Цены, аналитика, создание лота",
        "regions" => "Профиль, лоты, аналитика",
        "classes" => "Зерновые лоты, цены",
        "basis" => "Цены и аналитика",
        "routes" => "Логистика",
        "organizations" => "Справочники и контрагенты",
        _ => "Публичные формы и админка"
    };


static string NormalizeAnalyticsPlan(string? plan)
{
    return plan?.Trim().ToLowerInvariant() switch
    {
        "professional" or "pro" or "yearly" or "quarterly" => "professional",
        "corporate" or "enterprise" => "corporate",
        _ => "basic"
    };
}

public partial class Program;

public sealed record UpdateCartQuantityRequest(int Quantity);

public sealed record ForumReplyRequest(
    Guid? TopicId,
    Guid? PostId,
    string AuthorName,
    decimal Rating,
    string Content);

public sealed record SellerApplicationRequest(
    Guid UserId,
    string Inn,
    string Ogrn,
    string CompanyName,
    string DocPhotoUrl);


public sealed record AnalyticsSubscriptionSettingsRequest(
    IReadOnlyList<string>? Cultures,
    IReadOnlyList<string>? Classes,
    IReadOnlyList<string>? Regions,
    IReadOnlyList<string>? NotificationTypes,
    IReadOnlyList<string>? Channels,
    string Frequency);

public sealed record AnalyticsTariffSelectRequest(string Plan, string Period, string? PaymentMode, string? Receipt, string? PayerEmail, string? ContactEmail);

file sealed record AnalyticsMarketResponseDto(
    AnalyticsOptionsDto Options,
    IReadOnlyList<AnalyticsCultureCardDto> Cards,
    IReadOnlyList<AnalyticsPriceRowDto> PriceRows,
    IReadOnlyList<AnalyticsRegionRowDto> RegionRows,
    IReadOnlyList<AnalyticsChartPointDto> ChartSeries,
    AnalyticsSummaryDto Summary,
    IReadOnlyList<AnalyticsReviewDto> Reviews,
    string GeneratedAt);

file sealed record AnalyticsOptionsDto(
    IReadOnlyList<string> Cultures,
    IReadOnlyList<string> Classes,
    IReadOnlyList<string> Regions,
    IReadOnlyList<string> Basis,
    IReadOnlyList<string> Periods,
    IReadOnlyList<string> DataTypes);

file sealed record AnalyticsPriceRowDto(
    string Id,
    string Culture,
    string ClassName,
    string Region,
    string Basis,
    decimal? Price,
    decimal? ChangeRub,
    decimal? ChangePercent,
    string UpdatedAt,
    string Source,
    decimal MinPrice,
    decimal MaxPrice,
    string Demand,
    string Supply,
    IReadOnlyList<decimal> Series,
    string Trend);

file sealed record AnalyticsCultureCardDto(
    string Culture,
    string ClassName,
    decimal? Price,
    decimal? ChangeRub,
    decimal? ChangePercent,
    string Trend,
    string TrendLabel,
    string UpdatedAt,
    IReadOnlyList<decimal> Series);

file sealed record AnalyticsRegionRowDto(
    string Id,
    string Region,
    string Culture,
    decimal AveragePrice,
    decimal MinPrice,
    decimal MaxPrice,
    decimal ChangeRub,
    string DemandActivity,
    string SupplyActivity);

file sealed record AnalyticsChartPointDto(
    string Date,
    decimal Average,
    decimal Min,
    decimal Max,
    decimal Trend);

file sealed record AnalyticsSummaryDto(
    string Title,
    string Text,
    IReadOnlyList<string> Items,
    string GeneratedAt);

file sealed record AnalyticsReviewDto(
    Guid Id,
    string Title,
    string Type,
    string Culture,
    string Region,
    string Description,
    string Date,
    string Access);

file sealed record AnalyticsSignalsResponseDto(
    AnalyticsSignalOptionsDto Options,
    IReadOnlyList<AnalyticsSignalRowDto> Signals,
    IReadOnlyList<AnalyticsRegionSignalDto> RegionDetails,
    IReadOnlyList<AnalyticsSignalImpactDto> Impacts,
    string GeneratedAt);

file sealed record AnalyticsSignalOptionsDto(
    IReadOnlyList<string> Cultures,
    IReadOnlyList<string> Regions,
    IReadOnlyList<string> Types,
    IReadOnlyList<string> Risks);

file sealed record AnalyticsSignalRowDto(
    string Id,
    string Date,
    string Region,
    string Culture,
    string Phase,
    string Type,
    string Description,
    string Risk,
    string RiskLabel,
    string PriceImpact,
    string Status,
    string Source,
    string Horizon,
    string Confidence);

file sealed record AnalyticsRegionSignalDto(
    string Region,
    IReadOnlyList<string> Cultures,
    string Risk,
    string LastSignal,
    IReadOnlyList<string> Factors,
    string Impact,
    string RelatedPricesPath);

file sealed record AnalyticsSignalImpactDto(
    string Id,
    string Signal,
    string Region,
    string Culture,
    string SupplyImpact,
    string QualityImpact,
    string PriceImpact,
    string Horizon,
    string Confidence);


file sealed record AdminOverviewDto(
    IReadOnlyDictionary<string, int> Stats,
    IReadOnlyList<AdminUserDto> Users,
    IReadOnlyList<AdminLotDto> Lots,
    IReadOnlyList<AdminOrderDto> Orders,
    IReadOnlyList<AdminNewsDto> News,
    IReadOnlyList<AdminApplicationDto> Applications,
    AdminAnalyticsDto Analytics);

file sealed record AdminUserDto(Guid Id, string Email, string DisplayName, string Region, string FarmType, string Role, string Subscription, bool IsVerifiedSeller, string CreatedAt);
file sealed record AdminLotDto(Guid Id, string Category, string Title, string SellerName, string Region, decimal Price, bool IsPublished, string CreatedAt);
file sealed record AdminOrderDto(Guid Id, string UserName, string Status, decimal Total, string CreatedAt, int ItemsCount);
file sealed record AdminNewsDto(Guid Id, string Section, string Title, string Lead, string Date, string Country, string Culture, string Region, string Type);
file sealed record AdminApplicationDto(Guid Id, string CompanyName, string Inn, string Ogrn, string Status, string SubmittedAt);
file sealed record AdminAnalyticsDto(int ActiveSubscriptions, decimal RevenueForecast, int PublishedLots, int PendingApplications);
file sealed record AdminUserUpdateRequest(string? DisplayName, string? Email, string? Region, string? FarmType, string? Role, bool? IsVerifiedSeller);
file sealed record AdminLotUpdateRequest(string? Title, string? Region, string? Description, decimal? Price, bool? IsPublished);
file sealed record AdminOrderUpdateRequest(string Status);
file sealed record AdminNewsRequest(string Title, string Lead, string? Section, string? Country, string? Culture, string? Region, string? Type);

file sealed record AdminActionRequest(string Action, string? Section, string? ObjectId, string? Comment);
file sealed record AdminAuctionUpdateRequest(string? Status);
file sealed record AdminSubscriptionUpdateRequest(string? Plan, string? Period, bool? IsActive, DateTime? ExpiresAt);
file sealed record AdminPriceRequest(string? Culture, string? Region, decimal? Price, decimal? Change, string? ClassName, string? Basis, string? Source, string? Status);
file sealed record AdminReferenceRequest(string? Category, string? Title, string? Slug, string? Region, string? Summary, string? Details, string? Contacts, string? Status);
file sealed record AdminNotificationRequest(string? Message, string? Recipients, string? Channel);
file sealed record AdminForumActionRequest(string? Action);


file sealed class ExceptionMappingMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (InvalidOperationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { message = ex.Message });
        }
    }
}

file sealed record ServiceRequestDto(Guid? SellerId, string ServiceTitle, string Organization, string Phone, string Email, string Region, string Details);
