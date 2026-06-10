using Zerno.Domain.Common;

namespace Zerno.Domain.Content;

public sealed class ReferenceCatalogItem : EntityBase
{
    public string Category { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string Contacts { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public List<string> Highlights { get; set; } = [];
}
