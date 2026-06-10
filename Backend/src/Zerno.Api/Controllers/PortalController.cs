using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Portal;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/portal")]
public sealed class PortalController(IPortalSnapshotService snapshotService) : ControllerBase
{
    [HttpGet("snapshot")]
    public Task<PortalSnapshotDto> Snapshot(CancellationToken cancellationToken)
        => snapshotService.GetSnapshotAsync(cancellationToken);
}
