namespace Zerno.Application.Contracts.Forum;

public sealed record ForumTopicDto(
    Guid Id,
    Guid AuthorId,
    string AuthorName,
    string Section,
    string Title,
    string Content,
    IReadOnlyList<string> Tags,
    string? MediaUrl,
    string? VerifiedAnswer,
    string CreatedAt);

public sealed record ForumReplyDto(
    Guid Id,
    Guid TopicId,
    string AuthorName,
    decimal Rating,
    string Content,
    string CreatedAt);

public sealed record CreateForumTopicRequestDto(
    Guid AuthorId,
    string AuthorName,
    string Section,
    string Title,
    string Content,
    IReadOnlyList<string> Tags,
    string? MediaUrl);

public sealed record CreateForumReplyRequestDto(
    Guid TopicId,
    string AuthorName,
    decimal Rating,
    string Content);
