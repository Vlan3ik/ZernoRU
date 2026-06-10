using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Zerno.Application.Contracts.Auth;
using Zerno.Application.Contracts.Logistics;
using Zerno.Domain.Users;
using Zerno.Infrastructure.Persistence;
using Zerno.Infrastructure.Security;
using Zerno.Infrastructure.Services;

namespace Zerno.IntegrationTests;

public sealed class AuthAndLogisticsTests
{
    [Fact]
    public async Task RegisterAndLogin_roundtrip_returns_token_and_persisted_user()
    {
        var dbContext = CreateContext(nameof(RegisterAndLogin_roundtrip_returns_token_and_persisted_user));
        var authService = new AuthService(dbContext, new JwtTokenService(Options.Create(new JwtOptions())));

        var registered = await authService.RegisterAsync(
            new RegisterRequestDto(
                "new-seller@zerno.local",
                "Password123!",
                "ООО Новый Поставщик",
                "Смоленская область",
                "Поставщик зерна",
                "6732000000",
                "1234567890123"),
            CancellationToken.None);

        registered.Token.Should().NotBeNullOrWhiteSpace();
        registered.Role.Should().Be("Buyer");

        var login = await authService.LoginAsync(new LoginRequestDto("new-seller@zerno.local", "Password123!"), CancellationToken.None);
        login.UserId.Should().Be(registered.UserId);
        login.Token.Should().NotBeNullOrWhiteSpace();

        (await dbContext.Users.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Logistics_quote_is_positive_and_mode_sensitive()
    {
        var service = new LogisticsService();
        var partner = await service.CalculateAsync(new DeliveryQuoteRequestDto(150, 80, "partner_delivery"), CancellationToken.None);
        var pickup = await service.CalculateAsync(new DeliveryQuoteRequestDto(150, 80, "pickup"), CancellationToken.None);

        partner.Price.Should().BeGreaterThan(0);
        partner.EtaDays.Should().BeGreaterThan(0);
        partner.Price.Should().BeGreaterThan(pickup.Price);
    }

    private static AppDbContext CreateContext(string name)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(name)
            .Options;

        return new AppDbContext(options);
    }
}
