using Zerno.Domain.Common;

namespace Zerno.Domain.Content;

public sealed class PortalSeedState : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public int Version { get; set; }
    public DateTime AppliedAtUtc { get; set; }
}
