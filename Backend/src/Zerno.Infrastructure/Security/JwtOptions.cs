namespace Zerno.Infrastructure.Security;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "Zerno.Api";
    public string Audience { get; set; } = "Zerno.Web";
    public string SigningKey { get; set; } = "development-signing-key-change-me";
    public int ExpirationMinutes { get; set; } = 120;
}
