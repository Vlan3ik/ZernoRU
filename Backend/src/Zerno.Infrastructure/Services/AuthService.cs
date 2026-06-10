using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Auth;
using Zerno.Domain.Users;
using Zerno.Infrastructure.Persistence;
using Zerno.Infrastructure.Security;

namespace Zerno.Infrastructure.Services;

public sealed class AuthService(AppDbContext dbContext, JwtTokenService tokenService) : IAuthService
{
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await dbContext.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            throw new InvalidOperationException("Пользователь уже существует.");
        }

        var user = new UserAccount
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            DisplayName = request.DisplayName,
            Region = request.Region,
            FarmType = request.FarmType,
            Inn = request.Inn,
            Ogrn = request.Ogrn,
            Role = UserRole.Buyer,
            IsVerifiedSeller = false,
            SellerVerificationStatus = SellerVerificationStatus.Approved,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken)
            ?? throw new InvalidOperationException("Пользователь не найден.");

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new InvalidOperationException("Неверный пароль.");
        }

        return BuildResponse(user);
    }

    private AuthResponseDto BuildResponse(UserAccount user)
        => new(user.Id, user.Email, user.DisplayName, user.Role.ToString(), tokenService.CreateToken(user));
}
