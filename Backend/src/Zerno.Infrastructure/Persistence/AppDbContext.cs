using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Zerno.Domain.Analytics;
using Zerno.Domain.Content;
using Zerno.Domain.Forum;
using Zerno.Domain.Marketplace;
using Zerno.Domain.Notifications;
using Zerno.Domain.Subscriptions;
using Zerno.Domain.Users;

namespace Zerno.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<GrainLot> GrainLots => Set<GrainLot>();
    public DbSet<EquipmentLot> EquipmentLots => Set<EquipmentLot>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<ForumTopic> ForumTopics => Set<ForumTopic>();
    public DbSet<ForumReply> ForumReplies => Set<ForumReply>();
    public DbSet<NotificationItem> Notifications => Set<NotificationItem>();
    public DbSet<SubscriptionState> Subscriptions => Set<SubscriptionState>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<PriceRecord> PriceRecords => Set<PriceRecord>();
    public DbSet<SellerApplication> SellerApplications => Set<SellerApplication>();
    public DbSet<AnalyticsPoint> AnalyticsPoints => Set<AnalyticsPoint>();
    public DbSet<PortalSeedState> PortalSeedStates => Set<PortalSeedState>();
    public DbSet<ReferenceCatalogItem> ReferenceCatalogItems => Set<ReferenceCatalogItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Role).HasConversion<string>();
            entity.Property(x => x.SellerVerificationStatus).HasConversion<string>();
        });

        modelBuilder.Entity<MarketplaceLot>(entity =>
        {
            entity.HasDiscriminator<string>("LotType")
                .HasValue<GrainLot>("grain")
                .HasValue<EquipmentLot>("equipment");
            entity.Property(x => x.Category).HasConversion<string>();
        });

        modelBuilder.Entity<GrainLot>(entity =>
        {
            entity.Property(x => x.GrainType).HasConversion<string>();
            entity.Property(x => x.PricePerTon).HasPrecision(18, 2);
            entity.Property(x => x.VolumeTons).HasPrecision(18, 2);
        });

        modelBuilder.Entity<EquipmentLot>(entity =>
        {
            entity.Property(x => x.Condition).HasConversion<string>();
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.Property(x => x.UnitPrice).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.Property(x => x.PaymentMethod).HasConversion<string>();
            entity.Property(x => x.DeliveryMode).HasConversion<string>();
            entity.Property(x => x.Total).HasPrecision(18, 2);
            entity.Property(x => x.DeliveryPrice).HasPrecision(18, 2);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(x => x.Category).HasConversion<string>();
            entity.Property(x => x.UnitPrice).HasPrecision(18, 2);
            entity.HasOne<Order>().WithMany(x => x.Items).HasForeignKey(x => x.OrderId);
        });

        modelBuilder.Entity<ForumTopic>(entity =>
        {
            entity.Property(x => x.Section).HasConversion<string>();
            entity.Property(x => x.Tags).HasConversion(
                value => string.Join("||", value),
                value => string.IsNullOrWhiteSpace(value) ? new List<string>() : value.Split("||", StringSplitOptions.RemoveEmptyEntries).ToList());
            entity.Property(x => x.Tags).Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (left, right) => left != null && right != null && left.SequenceEqual(right),
                value => value.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode(StringComparison.Ordinal))),
                value => value.ToList()));
        });

        modelBuilder.Entity<ForumReply>(entity =>
        {
            entity.Property(x => x.Rating).HasPrecision(4, 2);
        });

        modelBuilder.Entity<SubscriptionState>(entity =>
        {
            entity.Property(x => x.Plan).HasConversion<string>();
        });

        modelBuilder.Entity<PriceRecord>(entity =>
        {
            entity.Property(x => x.DayPrice).HasPrecision(18, 2);
            entity.Property(x => x.WeekChange).HasPrecision(18, 2);
        });

        modelBuilder.Entity<SellerApplication>(entity =>
        {
            entity.Property(x => x.Status).HasConversion<string>();
        });

        modelBuilder.Entity<AnalyticsPoint>(entity =>
        {
            entity.Property(x => x.Ndvi).HasPrecision(10, 4);
            entity.Property(x => x.Ssi).HasPrecision(10, 4);
            entity.Property(x => x.PriceForecast).HasPrecision(18, 2);
            entity.Property(x => x.Demand).HasPrecision(10, 2);
            entity.Property(x => x.Supply).HasPrecision(10, 2);
        });

        modelBuilder.Entity<PortalSeedState>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<ReferenceCatalogItem>(entity =>
        {
            entity.HasIndex(x => new { x.Category, x.Slug }).IsUnique();
            entity.Property(x => x.Highlights).HasConversion(
                value => string.Join("||", value),
                value => string.IsNullOrWhiteSpace(value) ? new List<string>() : value.Split("||", StringSplitOptions.RemoveEmptyEntries).ToList());
            entity.Property(x => x.Highlights).Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (left, right) => left != null && right != null && left.SequenceEqual(right),
                value => value.Aggregate(0, (hash, item) => HashCode.Combine(hash, item.GetHashCode(StringComparison.Ordinal))),
                value => value.ToList()));
        });
    }
}
