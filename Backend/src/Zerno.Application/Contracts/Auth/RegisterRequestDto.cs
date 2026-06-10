namespace Zerno.Application.Contracts.Auth;

public sealed record RegisterRequestDto(
    string Email,
    string Password,
    string DisplayName,
    string Region,
    string FarmType,
    string? Inn,
    string? Ogrn);
