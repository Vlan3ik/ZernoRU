using Zerno.Domain.Common;

namespace Zerno.Domain.Marketplace;

public sealed class Order : EntityBase
{
    public Guid UserId { get; set; }
    public List<OrderItem> Items { get; set; } = [];
    public PaymentMethod PaymentMethod { get; set; }
    public DeliveryMode DeliveryMode { get; set; }
    public decimal DeliveryPrice { get; set; }
    public decimal Total { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Created;
}
