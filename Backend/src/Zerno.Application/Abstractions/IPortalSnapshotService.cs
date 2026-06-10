using Zerno.Application.Contracts.Portal;

namespace Zerno.Application.Abstractions;

public interface IPortalSnapshotService
{
    Task<PortalSnapshotDto> GetSnapshotAsync(CancellationToken cancellationToken);
}
