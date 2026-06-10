using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Portal;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Infrastructure.Services;

public sealed class ProfileService(AppDbContext dbContext) : IProfileService
{
    public async Task<PortalUserDto> GetAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstAsync(x => x.Id == userId, cancellationToken);
        return Map(user);
    }

    public async Task<PortalUserDto> UpdateAsync(Guid userId, UpdateProfileRequestDto request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstAsync(x => x.Id == userId, cancellationToken);
        user.DisplayName = request.DisplayName.Trim();
        user.Region = request.Region.Trim();
        user.FarmType = request.FarmType.Trim();
        user.Inn = string.IsNullOrWhiteSpace(request.Inn) ? null : request.Inn.Trim();
        user.Ogrn = string.IsNullOrWhiteSpace(request.Ogrn) ? null : request.Ogrn.Trim();
        user.PreferredLanguage = string.IsNullOrWhiteSpace(request.PreferredLanguage) ? "ru" : request.PreferredLanguage.Trim().ToLowerInvariant();
        user.TwoFactorEnabled = request.TwoFactorEnabled;
        user.EmailNotificationsEnabled = request.EmailNotificationsEnabled;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Map(user);
    }

    private static PortalUserDto Map(Zerno.Domain.Users.UserAccount user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role.ToString(),
            user.Region,
            user.FarmType,
            user.Inn,
            user.Ogrn,
            user.IsVerifiedSeller,
            user.SellerVerificationStatus.ToString(),
            user.PreferredLanguage,
            user.TwoFactorEnabled,
            user.EmailNotificationsEnabled);
}
