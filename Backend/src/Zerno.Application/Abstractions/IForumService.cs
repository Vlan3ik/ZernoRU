using Zerno.Application.Contracts.Forum;

namespace Zerno.Application.Abstractions;

public interface IForumService
{
    Task<IReadOnlyList<ForumTopicDto>> GetTopicsAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<ForumReplyDto>> GetRepliesAsync(Guid topicId, CancellationToken cancellationToken);
    Task<Guid> CreateTopicAsync(CreateForumTopicRequestDto request, CancellationToken cancellationToken);
    Task<Guid> CreateReplyAsync(CreateForumReplyRequestDto request, CancellationToken cancellationToken);
}
