using Microsoft.AspNetCore.Mvc;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Forum;

namespace Zerno.Api.Controllers;

[ApiController]
[Route("api/forum")]
public sealed class ForumController(IForumService forumService) : ControllerBase
{
    [HttpGet("topics")]
    public Task<IReadOnlyList<ForumTopicDto>> Topics(CancellationToken cancellationToken)
        => forumService.GetTopicsAsync(cancellationToken);

    [HttpGet("topics/{topicId:guid}/replies")]
    public Task<IReadOnlyList<ForumReplyDto>> Replies(Guid topicId, CancellationToken cancellationToken)
        => forumService.GetRepliesAsync(topicId, cancellationToken);

    [HttpPost("topics")]
    public Task<Guid> CreateTopic([FromBody] CreateForumTopicRequestDto request, CancellationToken cancellationToken)
        => forumService.CreateTopicAsync(request, cancellationToken);

    [HttpPost("replies")]
    public Task<Guid> CreateReply([FromBody] CreateForumReplyRequestDto request, CancellationToken cancellationToken)
        => forumService.CreateReplyAsync(request, cancellationToken);
}
