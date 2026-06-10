namespace Zerno.Domain.Marketplace;

public sealed class GrainLot : MarketplaceLot
{
    public GrainType GrainType { get; set; }
    public string Grade { get; set; } = string.Empty;
    public decimal VolumeTons { get; set; }
    public decimal PricePerTon { get; set; }
    public int QualityScore { get; set; }
    public bool HasOwnTransport { get; set; }
    public bool AuctionEnabled { get; set; }
    public string MercuryCertificate { get; set; } = string.Empty;
    public string DeclarationOfConformity { get; set; } = string.Empty;
    public string StorageContract { get; set; } = string.Empty;
}
