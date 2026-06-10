using Zerno.Domain.Common;

namespace Zerno.Domain.Forum;

public sealed class ForumReply : EntityBase
{
    public Guid TopicId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public string Content { get; set; } = string.Empty;
}
