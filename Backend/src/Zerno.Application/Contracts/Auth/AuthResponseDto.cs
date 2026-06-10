namespace Zerno.Application.Contracts.Auth;

public sealed record AuthResponseDto(
    Guid UserId,
    string Email,
    string DisplayName,
    string Role,
    string Token);
