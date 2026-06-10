namespace Zerno.Application.Contracts.Portal;

public sealed record ReferenceCatalogItemDto(
    Guid Id,
    string Category,
    string Slug,
    string Title,
    string Region,
    string Summary,
    string Details,
    string Contacts,
    string Status,
    IReadOnlyList<string> Highlights);
