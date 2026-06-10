using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Zerno.Application.Abstractions;
using Zerno.Infrastructure.Persistence;
using Zerno.Infrastructure.Security;
using Zerno.Infrastructure.Services;

namespace Zerno.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserContext, CurrentUserContext>();
        services.AddScoped<JwtTokenService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IMediaStorageService, MinioMediaStorageService>();
        services.AddScoped<IPortalSnapshotService, PortalSnapshotService>();
        services.AddScoped<IMarketplaceService, MarketplaceService>();
        services.AddScoped<IForumService, ForumService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<ISubscriptionService, SubscriptionService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ILogisticsService, LogisticsService>();
        services.AddScoped<IMarketDataSyncService, OpenMarketDataSyncService>();
        services.AddHostedService<MarketDataSyncWorker>();

        services.AddScoped<PortalSeeder>();
        return services;
    }
}
