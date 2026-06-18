using Zerno.Domain.Common;

namespace Zerno.Domain.Forum;

public enum ForumExpertApplicationStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Withdrawn = 4
}

public sealed class ForumExpertApplication : EntityBase
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public ForumSection Section { get; set; }
    public Guid? TopicId { get; set; }
    public string Specialization { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string ExperienceSummary { get; set; } = string.Empty;
    public string Proof { get; set; } = string.Empty;
    public string Contact { get; set; } = string.Empty;
    public ForumExpertApplicationStatus Status { get; set; } = ForumExpertApplicationStatus.Pending;
    public DateTime? ReviewedAtUtc { get; set; }
    public string? ReviewerName { get; set; }
}
