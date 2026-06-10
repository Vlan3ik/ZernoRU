using Zerno.Application.Contracts.Portal;

namespace Zerno.Application.Abstractions;

public interface IProfileService
{
    Task<PortalUserDto> GetAsync(Guid userId, CancellationToken cancellationToken);
    Task<PortalUserDto> UpdateAsync(Guid userId, UpdateProfileRequestDto request, CancellationToken cancellationToken);
}
