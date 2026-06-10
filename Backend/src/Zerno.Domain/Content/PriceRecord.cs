using Zerno.Domain.Common;

namespace Zerno.Domain.Content;

public sealed class PriceRecord : EntityBase
{
    public string Culture { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public decimal DayPrice { get; set; }
    public decimal WeekChange { get; set; }
}
