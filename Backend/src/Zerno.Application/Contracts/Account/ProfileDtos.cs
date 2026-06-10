namespace Zerno.Application.Contracts.Portal;

public sealed record UpdateProfileRequestDto(
    string DisplayName,
    string Region,
    string FarmType,
    string? Inn,
    string? Ogrn,
    string PreferredLanguage,
    bool TwoFactorEnabled,
    bool EmailNotificationsEnabled);
