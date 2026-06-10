using Zerno.Domain.Common;
using Zerno.Domain.Users;

namespace Zerno.Infrastructure.Persistence;

public sealed class SellerApplication : EntityBase
{
    public Guid UserId { get; set; }
    public string Inn { get; set; } = string.Empty;
    public string Ogrn { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string DocPhotoUrl { get; set; } = string.Empty;
    public SellerVerificationStatus Status { get; set; } = SellerVerificationStatus.Pending;
    public DateTime SubmittedAtUtc { get; set; }
}
