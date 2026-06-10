using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Portal;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/profile")]
public sealed class ProfileController(IProfileService profileService, ICurrentUserContext currentUserContext) : ControllerBase
{
    [HttpGet("me")]
    public async Task<ActionResult<PortalUserDto>> GetMe(CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        return Ok(await profileService.GetAsync(userId, cancellationToken));
    }

    [HttpPut("me")]
    public async Task<ActionResult<PortalUserDto>> UpdateMe([FromBody] UpdateProfileRequestDto request, CancellationToken cancellationToken)
    {
        if (currentUserContext.UserId is not { } userId)
        {
            return Unauthorized();
        }

        return Ok(await profileService.UpdateAsync(userId, request, cancellationToken));
    }
}
