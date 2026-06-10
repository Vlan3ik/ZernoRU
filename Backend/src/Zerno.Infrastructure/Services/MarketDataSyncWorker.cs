using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Zerno.Application.Abstractions;

namespace Zerno.Infrastructure.Services;

public sealed class MarketDataSyncWorker(IServiceScopeFactory scopeFactory, ILogger<MarketDataSyncWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await SyncOnceAsync(stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(30));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await SyncOnceAsync(stoppingToken);
        }
    }

    private async Task SyncOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var syncService = scope.ServiceProvider.GetRequiredService<IMarketDataSyncService>();
            await syncService.SyncAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Market data sync run failed");
        }
    }
}
