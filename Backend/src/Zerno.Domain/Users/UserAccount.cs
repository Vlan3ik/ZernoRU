using Zerno.Domain.Common;

namespace Zerno.Domain.Users;

public sealed class UserAccount : EntityBase
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string FarmType { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public string? Inn { get; set; }
    public string? Ogrn { get; set; }
    public bool IsVerifiedSeller { get; set; }
    public SellerVerificationStatus SellerVerificationStatus { get; set; } = SellerVerificationStatus.Pending;
    public string PreferredLanguage { get; set; } = "ru";
    public bool TwoFactorEnabled { get; set; }
    public bool EmailNotificationsEnabled { get; set; } = true;
}
