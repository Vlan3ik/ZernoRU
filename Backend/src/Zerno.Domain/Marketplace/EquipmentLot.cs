namespace Zerno.Domain.Marketplace;

public sealed class EquipmentLot : MarketplaceLot
{
    public string Brand { get; set; } = string.Empty;
    public int Year { get; set; }
    public EquipmentCondition Condition { get; set; }
}
