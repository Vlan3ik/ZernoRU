using Zerno.Domain.Common;

namespace Zerno.Domain.Content;

public sealed class NewsArticle : EntityBase
{
    public string Section { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Lead { get; set; } = string.Empty;
    public string DateText { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Culture { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}
