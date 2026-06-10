namespace Zerno.Domain.Analytics;

public sealed class AnalyticsPoint
{
    public Guid Id { get; set; }
    public string Month { get; set; } = string.Empty;
    public decimal Ndvi { get; set; }
    public decimal Ssi { get; set; }
    public decimal PriceForecast { get; set; }
    public decimal Demand { get; set; }
    public decimal Supply { get; set; }
}
