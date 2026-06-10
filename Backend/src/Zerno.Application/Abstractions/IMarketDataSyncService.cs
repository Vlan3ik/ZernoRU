namespace Zerno.Application.Abstractions;

public interface IMarketDataSyncService
{
    Task SyncAsync(CancellationToken cancellationToken);
}
