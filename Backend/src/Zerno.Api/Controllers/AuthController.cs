using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Auth;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public Task<AuthResponseDto> Register([FromBody] RegisterRequestDto request, CancellationToken cancellationToken)
        => authService.RegisterAsync(request, cancellationToken);

    [HttpPost("login")]
    public Task<AuthResponseDto> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
        => authService.LoginAsync(request, cancellationToken);
}
