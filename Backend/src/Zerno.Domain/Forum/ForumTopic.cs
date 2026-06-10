using Zerno.Domain.Common;

namespace Zerno.Domain.Forum;

public sealed class ForumTopic : EntityBase
{
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public ForumSection Section { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public string? MediaUrl { get; set; }
    public string? VerifiedAnswer { get; set; }
}
