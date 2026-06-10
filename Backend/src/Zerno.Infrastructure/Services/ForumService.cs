using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Application.Contracts.Forum;
using Zerno.Domain.Forum;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Infrastructure.Services;

public sealed class ForumService(AppDbContext dbContext) : IForumService
{
    public async Task<IReadOnlyList<ForumTopicDto>> GetTopicsAsync(CancellationToken cancellationToken) =>
        await dbContext.ForumTopics
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new ForumTopicDto(x.Id, x.AuthorId, x.AuthorName, x.Section.ToString(), x.Title, x.Content, x.Tags, x.MediaUrl, x.VerifiedAnswer, x.CreatedAtUtc.ToString("O")))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<ForumReplyDto>> GetRepliesAsync(Guid topicId, CancellationToken cancellationToken) =>
        await dbContext.ForumReplies
            .Where(x => x.TopicId == topicId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new ForumReplyDto(x.Id, x.TopicId, x.AuthorName, x.Rating, x.Content, x.CreatedAtUtc.ToString("O")))
            .ToListAsync(cancellationToken);

    public async Task<Guid> CreateTopicAsync(CreateForumTopicRequestDto request, CancellationToken cancellationToken)
    {
        var topic = new ForumTopic
        {
            Id = Guid.NewGuid(),
            AuthorId = request.AuthorId,
            AuthorName = request.AuthorName,
            Section = Enum.Parse<ForumSection>(NormalizeSection(request.Section), true),
            Title = request.Title,
            Content = request.Content,
            Tags = request.Tags.ToList(),
            MediaUrl = request.MediaUrl,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.ForumTopics.Add(topic);
        await dbContext.SaveChangesAsync(cancellationToken);
        return topic.Id;
    }

    public async Task<Guid> CreateReplyAsync(CreateForumReplyRequestDto request, CancellationToken cancellationToken)
    {
        var reply = new ForumReply
        {
            Id = Guid.NewGuid(),
            TopicId = request.TopicId,
            AuthorName = request.AuthorName,
            Rating = request.Rating,
            Content = request.Content,
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.ForumReplies.Add(reply);
        await dbContext.SaveChangesAsync(cancellationToken);
        return reply.Id;
    }

    private static string NormalizeSection(string value) =>
        value.Trim().ToLowerInvariant() switch
        {
            "агрономия" => nameof(ForumSection.Agrology),
            "agrology" => nameof(ForumSection.Agrology),
            "торговля" => nameof(ForumSection.Trade),
            "trade" => nameof(ForumSection.Trade),
            "техника" => nameof(ForumSection.Equipment),
            "equipment" => nameof(ForumSection.Equipment),
            _ => nameof(ForumSection.Trade)
        };
}
