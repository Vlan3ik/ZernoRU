using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Zerno.Application.Abstractions;
using Zerno.Domain.Analytics;
using Zerno.Domain.Content;
using Zerno.Domain.Forum;
using Zerno.Domain.Marketplace;
using Zerno.Domain.Notifications;
using Zerno.Domain.Subscriptions;
using Zerno.Domain.Users;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Infrastructure.Services;

public sealed class PortalSeeder(AppDbContext dbContext, IMediaStorageService mediaStorage)
{
    private const string SeedName = "portal-core";
    private const int SeedVersion = 6;

    private static readonly MediaAssetSeed[] MediaAssets =
    [
        new("assets/grain-1.svg", CreateSvgDataUrl("Зерно", "Лот с зерновой партией", "#8b6d3b", "#3f2f18"), "image/svg+xml"),
        new("assets/grain-2.svg", CreateSvgDataUrl("Зерно", "Вторая зерновая карточка", "#9a7a46", "#4b371d"), "image/svg+xml"),
        new("assets/equipment-1.svg", CreateSvgDataUrl("Техника", "Комбайн и спецтехника", "#54707c", "#24343c"), "image/svg+xml"),
        new("assets/equipment-2.svg", CreateSvgDataUrl("Техника", "Поставки и сервис", "#5d6675", "#2a2f3c"), "image/svg+xml"),
        new("assets/equipment-3.svg", CreateSvgDataUrl("Техника", "Складская логистика", "#6e5d4b", "#33261c"), "image/svg+xml"),
        new("assets/media-warehouse.svg", CreateSvgDataUrl("Склад", "Инфраструктура хранения", "#546a5c", "#243029"), "image/svg+xml"),
        new("assets/doc-1.svg", CreateSvgDataUrl("Документы", "Верификация поставщика", "#575f6b", "#1e2630"), "image/svg+xml"),
        new("assets/news-1.svg", CreateSvgDataUrl("Новости", "Главные новости рынка", "#9b4f3f", "#4b221a"), "image/svg+xml"),
        new("assets/news-2.svg", CreateSvgDataUrl("Новости", "Южные порты и вагоны", "#6a4f2d", "#312111"), "image/svg+xml"),
        new("assets/news-3.svg", CreateSvgDataUrl("Новости", "Рынки СНГ и экспорт", "#4f6b7d", "#20323c"), "image/svg+xml"),
        new("assets/news-4.svg", CreateSvgDataUrl("Аналитика", "Рыночные сигналы дня", "#5a5f8e", "#23233c"), "image/svg+xml"),
        new("assets/news-5.svg", CreateSvgDataUrl("Пресс-релиз", "Официальное сообщение", "#7b5b87", "#321d38"), "image/svg+xml"),
        new("assets/service-1.svg", CreateSvgDataUrl("Сервис", "Агросопровождение", "#54725e", "#203027"), "image/svg+xml"),
        new("assets/service-2.svg", CreateSvgDataUrl("Сервис", "Аналитика поставок", "#63704a", "#242c18"), "image/svg+xml"),
        new("assets/service-3.svg", CreateSvgDataUrl("Сервис", "Логистика", "#7a5d33", "#312415"), "image/svg+xml"),
        new("assets/service-4.svg", CreateSvgDataUrl("Сервис", "Форум и контакты", "#52626f", "#1b2630"), "image/svg+xml"),
        new("assets/service-5.svg", CreateSvgDataUrl("Сервис", "Подписка ZernoPlus", "#6c5d87", "#241d31"), "image/svg+xml")
    ];

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await mediaStorage.SeedAsync(MediaAssets, cancellationToken);
        await dbContext.Database.MigrateAsync(cancellationToken);
        await SyncUserReferencesAsync(cancellationToken);
        await SyncMediaReferencesAsync(cancellationToken);

        var seedState = await dbContext.PortalSeedStates
            .FirstOrDefaultAsync(x => x.Name == SeedName, cancellationToken);

        if (seedState is not null && seedState.Version >= SeedVersion)
        {
            return;
        }

        if (seedState is not null)
        {
            dbContext.Entry(seedState).State = EntityState.Detached;
        }

        await ClearSeedDataAsync(cancellationToken);
        await SeedReferenceCatalogAsync(cancellationToken);

        var now = DateTime.UtcNow;
        var buyer = new UserAccount
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Email = "participant1@zerno.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            DisplayName = "ООО СмолАгроЗакуп",
            Region = "Смоленская область",
            FarmType = "Закупщик зерна",
            Role = UserRole.Buyer,
            SellerVerificationStatus = SellerVerificationStatus.Approved,
            IsVerifiedSeller = false,
            PreferredLanguage = "ru",
            TwoFactorEnabled = false,
            EmailNotificationsEnabled = true,
            CreatedAtUtc = now
        };

        var seller1 = new UserAccount
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Email = "participant2@zerno.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            DisplayName = "КФХ Вяземские Поля",
            Region = "Смоленская область",
            FarmType = "Производитель зерновых",
            Inn = "6732012345",
            Ogrn = "1216700001122",
            Role = UserRole.Seller,
            SellerVerificationStatus = SellerVerificationStatus.Approved,
            IsVerifiedSeller = true,
            PreferredLanguage = "ru",
            TwoFactorEnabled = true,
            EmailNotificationsEnabled = true,
            CreatedAtUtc = now
        };

        var seller2 = new UserAccount
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Email = "participant3@zerno.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            DisplayName = "ИП АгроТехСнаб",
            Region = "Смоленская область",
            FarmType = "Поставщик техники",
            Inn = "6732098765",
            Ogrn = "319673200013211",
            Role = UserRole.Seller,
            SellerVerificationStatus = SellerVerificationStatus.Pending,
            IsVerifiedSeller = false,
            PreferredLanguage = "ru",
            TwoFactorEnabled = false,
            EmailNotificationsEnabled = true,
            CreatedAtUtc = now
        };

        var admin = new UserAccount
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Email = "admin@zerno.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
            DisplayName = "Администратор",
            Region = "Смоленск",
            FarmType = "Администрирование",
            Role = UserRole.Admin,
            SellerVerificationStatus = SellerVerificationStatus.Approved,
            IsVerifiedSeller = false,
            PreferredLanguage = "ru",
            TwoFactorEnabled = true,
            EmailNotificationsEnabled = true,
            CreatedAtUtc = now
        };

        dbContext.Users.AddRange(buyer, seller1, seller2, admin);

        var grain1 = new GrainLot
        {
            Id = Guid.Parse("55555555-5555-5555-5555-555555555551"),
            SellerId = seller1.Id,
            SellerName = seller1.DisplayName,
            Title = "Пшеница 3 класса урожай 2025",
            GrainType = GrainType.Wheat,
            Grade = "3 класс",
            VolumeTons = 180,
            PricePerTon = 16800,
            Region = "Смоленская область, Вяземский район",
            QualityScore = 92,
            Description = "Натура 770 г/л, влажность 12.5%, протеин 14.1%.",
            HasOwnTransport = true,
            AuctionEnabled = false,
            MercuryCertificate = "МЕРК-2025-1129",
            DeclarationOfConformity = "ЕАЭС N RU Д-RU.РА07.В.22591/25",
            StorageContract = "Договор хранения N 45/25",
            Category = LotCategory.Grain,
            Price = 3024000,
            CoverImageUrl = "/api/media/assets/grain-1.jpg",
            CreatedAtUtc = now
        };

        var grain2 = new GrainLot
        {
            Id = Guid.Parse("55555555-5555-5555-5555-555555555552"),
            SellerId = seller1.Id,
            SellerName = seller1.DisplayName,
            Title = "Ячмень фуражный",
            GrainType = GrainType.Barley,
            Grade = "Фуражный",
            VolumeTons = 90,
            PricePerTon = 13200,
            Region = "Смоленская область, Гагарин",
            QualityScore = 86,
            Description = "Подходит для комбикормов, хранение на элеваторе до 6 мес.",
            HasOwnTransport = false,
            AuctionEnabled = true,
            MercuryCertificate = "МЕРК-2025-2044",
            DeclarationOfConformity = "ЕАЭС N RU Д-RU.РА07.В.99812/25",
            StorageContract = "Договор хранения N 18/25",
            Category = LotCategory.Grain,
            Price = 1188000,
            CoverImageUrl = "/api/media/assets/grain-2.jpg",
            CreatedAtUtc = now
        };

        var grain2Auction = new AuctionLot
        {
            Id = Guid.Parse("aaaa1111-aaaa-1111-aaaa-111111111111"),
            LotId = grain2.Id,
            StartingPrice = grain2.PricePerTon,
            MinimumStep = 100,
            CurrentHighestBid = 13779,
            LeadingUserId = buyer.Id,
            LeadingUserName = buyer.DisplayName,
            WinningBidId = null,
            WinningUserId = null,
            WinningUserName = null,
            StartsAtUtc = now.AddHours(-1),
            EndsAtUtc = now.AddMinutes(18),
            Status = AuctionStatus.Active,
            CreatedAtUtc = now
        };

        grain2Auction.Bids =
        [
            new AuctionBid
            {
                Id = Guid.Parse("aaaa1111-aaaa-1111-aaaa-111111111112"),
                AuctionLotId = grain2Auction.Id,
                UserId = seller2.Id,
                UserName = seller2.DisplayName,
                Amount = 13400,
                IsWinning = false,
                CreatedAtUtc = now.AddMinutes(-14)
            },
            new AuctionBid
            {
                Id = Guid.Parse("aaaa1111-aaaa-1111-aaaa-111111111113"),
                AuctionLotId = grain2Auction.Id,
                UserId = buyer.Id,
                UserName = buyer.DisplayName,
                Amount = 13779,
                IsWinning = true,
                CreatedAtUtc = now.AddMinutes(-4)
            }
        ];

        var equipment1 = new EquipmentLot
        {
            Id = Guid.Parse("66666666-6666-6666-6666-666666666661"),
            SellerId = seller2.Id,
            SellerName = seller2.DisplayName,
            Title = "Трактор МТЗ 1221.3",
            Brand = "МТЗ",
            Year = 2022,
            Condition = EquipmentCondition.Used,
            Region = "Смоленск",
            Description = "Наработка 1100 м/ч, ТО по регламенту, ПСМ в наличии.",
            Category = LotCategory.Equipment,
            Price = 2950000,
            CoverImageUrl = "/api/media/assets/equipment-1.jpg",
            CreatedAtUtc = now
        };

        dbContext.GrainLots.AddRange(grain1, grain2);
        dbContext.EquipmentLots.Add(equipment1);
        dbContext.AuctionLots.Add(grain2Auction);

        dbContext.CartItems.Add(new CartItem
        {
            Id = Guid.Parse("77777777-7777-7777-7777-777777777771"),
            UserId = buyer.Id,
            LotId = grain1.Id,
            Category = LotCategory.Grain,
            LotTitle = grain1.Title,
            SellerName = grain1.SellerName,
            UnitPrice = grain1.PricePerTon,
            Quantity = 50,
            CreatedAtUtc = now
        });

        dbContext.Orders.Add(new Order
        {
            Id = Guid.Parse("88888888-8888-8888-8888-888888888881"),
            UserId = buyer.Id,
            Items =
            [
                new OrderItem
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-777777777772"),
                    OrderId = Guid.Parse("88888888-8888-8888-8888-888888888881"),
                    LotId = grain2.Id,
                    Category = LotCategory.Grain,
                    LotTitle = grain2.Title,
                    SellerName = grain2.SellerName,
                    UnitPrice = grain2.PricePerTon,
                    Quantity = 20,
                    CreatedAtUtc = now
                }
            ],
            PaymentMethod = PaymentMethod.Invoice,
            DeliveryMode = DeliveryMode.SellerDelivery,
            DeliveryPrice = 28000,
            Total = grain2.PricePerTon * 20 + 28000,
            Status = OrderStatus.Processing,
            CreatedAtUtc = now
        });

        var topic1 = new ForumTopic
        {
            Id = Guid.Parse("99999999-9999-9999-9999-999999999991"),
            AuthorId = buyer.Id,
            AuthorName = buyer.DisplayName,
            Section = ForumSection.Agrology,
            Title = "Севооборот под пшеницу после рапса: есть риски?",
            Content = "Подскажите, как лучше скорректировать азотное питание в Смоленском районе?",
            Tags = ["#смоленск", "#пшеница", "#севооборот"],
            VerifiedAnswer = "Проверить запас минерального азота по слоям 0-30 и 30-60 см.",
            CreatedAtUtc = now
        };
        dbContext.ForumTopics.Add(topic1);
        dbContext.ForumReplies.Add(new ForumReply
        {
            Id = Guid.Parse("99999999-9999-9999-9999-999999999992"),
            TopicId = topic1.Id,
            AuthorName = "Эксперт СГАА",
            Rating = 4.9m,
            Content = "Добавьте листовую диагностику на фазе кущения и внесите серу.",
            CreatedAtUtc = now
        });

        dbContext.Notifications.Add(new NotificationItem
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"),
            UserId = seller1.Id,
            Message = "Ваш лот \"Пшеница 3 класса\" получил 8 просмотров за сутки.",
            Viewed = false,
            CreatedAtUtc = now
        });

        dbContext.Subscriptions.AddRange(
            new SubscriptionState { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"), UserId = buyer.Id, IsActive = true, Plan = SubscriptionPlan.Basic, ExpiresAtUtc = DateTime.UtcNow.AddMonths(1), CreatedAtUtc = now },
            new SubscriptionState { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2"), UserId = seller1.Id, IsActive = false, CreatedAtUtc = now },
            new SubscriptionState { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3"), UserId = seller2.Id, IsActive = false, CreatedAtUtc = now }
        );

        dbContext.SellerApplications.Add(new SellerApplication
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-ccccccccccc1"),
            UserId = seller1.Id,
            Inn = seller1.Inn!,
            Ogrn = seller1.Ogrn!,
            CompanyName = seller1.DisplayName,
            DocPhotoUrl = "/api/media/assets/doc-1.svg",
            Status = SellerVerificationStatus.Approved,
            SubmittedAtUtc = now
        });

        dbContext.NewsArticles.AddRange(
            new NewsArticle { Id = Guid.NewGuid(), Section = "Главные новости", Title = "Смоленские зерновые хозяйства выходят на новые объёмы", Lead = "Обзор рынка зерна региона за неделю.", DateText = "03.06.2026", Country = "Россия", Culture = "Пшеница", Region = "Смоленская область", Type = "main", CreatedAtUtc = now },
            new NewsArticle { Id = Guid.NewGuid(), Section = "Аналитика", Title = "Пшеница 3 класса: сезонные ожидания", Lead = "Прогноз изменения цен с учетом спроса и предложения.", DateText = "02.06.2026", Country = "Россия", Culture = "Пшеница", Region = "Центральный ФО", Type = "analytics", CreatedAtUtc = now },
            new NewsArticle { Id = Guid.NewGuid(), Section = "Аналитика", Title = "Кукуруза: давление предложения на юге", Lead = "Разбор влияния ближайших отгрузок на цену кукурузы.", DateText = "04.06.2026", Country = "Россия", Culture = "Кукуруза", Region = "Южный ФО", Type = "analytics", CreatedAtUtc = now.AddHours(-2) },
            new NewsArticle { Id = Guid.NewGuid(), Section = "Аналитика", Title = "Ячмень: спрос комбикормовых предприятий", Lead = "Региональный обзор активности покупателей и складских остатков.", DateText = "05.06.2026", Country = "Россия", Culture = "Ячмень", Region = "Сибирский ФО", Type = "analytics", CreatedAtUtc = now.AddHours(-3) },
            new NewsArticle { Id = Guid.NewGuid(), Section = "Пресс-релизы", Title = "Аналитический модуль обновил региональные индексы", Lead = "Портал обновил расчет динамики по основным культурам и регионам.", DateText = "06.06.2026", Country = "Россия", Culture = "Пшеница", Region = "Россия", Type = "press", CreatedAtUtc = now.AddHours(-4) }
        );

        var priceRegions = new[]
        {
            "Смоленская область",
            "Центральный ФО",
            "Южный ФО",
            "Приволжский ФО",
            "Сибирский ФО",
            "Краснодарский край",
            "Ростовская область"
        };
        var priceCultures = new[]
        {
            (Name: "Пшеница 3 класса", Base: 16800m, Trend: 2.1m),
            (Name: "Пшеница 4 класса", Base: 15850m, Trend: 1.2m),
            (Name: "Пшеница 5 класса", Base: 14900m, Trend: -0.4m),
            (Name: "Кукуруза фуражная", Base: 15120m, Trend: -1.3m),
            (Name: "Ячмень фуражный", Base: 13950m, Trend: 1.6m)
        };
        var priceRecords = new List<PriceRecord>();
        for (var cultureIndex = 0; cultureIndex < priceCultures.Length; cultureIndex++)
        {
            for (var regionIndex = 0; regionIndex < priceRegions.Length; regionIndex++)
            {
                var item = priceCultures[cultureIndex];
                var regionalDelta = (regionIndex - 2) * 110 + cultureIndex * 45;
                var trendDelta = ((regionIndex + cultureIndex) % 5 - 2) * 0.35m;
                priceRecords.Add(new PriceRecord
                {
                    Id = Guid.NewGuid(),
                    Culture = item.Name,
                    Region = priceRegions[regionIndex],
                    DayPrice = item.Base + regionalDelta,
                    WeekChange = Math.Round(item.Trend + trendDelta, 1),
                    CreatedAtUtc = now.AddHours(-(regionIndex + cultureIndex * 2))
                });
            }
        }
        dbContext.PriceRecords.AddRange(priceRecords);

        dbContext.AnalyticsPoints.AddRange(
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Янв", Ndvi = 0.38m, Ssi = 0.64m, PriceForecast = 15100, Demand = 82, Supply = 76 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Фев", Ndvi = 0.42m, Ssi = 0.58m, PriceForecast = 15450, Demand = 85, Supply = 77 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Мар", Ndvi = 0.51m, Ssi = 0.49m, PriceForecast = 15800, Demand = 88, Supply = 79 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Апр", Ndvi = 0.56m, Ssi = 0.44m, PriceForecast = 16100, Demand = 90, Supply = 80 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Май", Ndvi = 0.63m, Ssi = 0.40m, PriceForecast = 16500, Demand = 94, Supply = 82 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Июн", Ndvi = 0.69m, Ssi = 0.36m, PriceForecast = 16900, Demand = 96, Supply = 83 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Июл", Ndvi = 0.74m, Ssi = 0.32m, PriceForecast = 17240, Demand = 97, Supply = 84 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Авг", Ndvi = 0.78m, Ssi = 0.29m, PriceForecast = 17620, Demand = 99, Supply = 86 },
            new AnalyticsPoint { Id = Guid.NewGuid(), Month = "Сен", Ndvi = 0.71m, Ssi = 0.31m, PriceForecast = 17310, Demand = 95, Supply = 88 }
        );

        await SeedVolumeAsync(now, buyer, seller1, seller2, cancellationToken);

        dbContext.PortalSeedStates.Add(new PortalSeedState
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Name = SeedName,
            Version = SeedVersion,
            AppliedAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task SyncMediaReferencesAsync(CancellationToken cancellationToken)
    {
        var grain1 = Guid.Parse("55555555-5555-5555-5555-555555555551");
        var grain2 = Guid.Parse("55555555-5555-5555-5555-555555555552");
        var equipment1 = Guid.Parse("66666666-6666-6666-6666-666666666661");

        await dbContext.GrainLots.Where(x => x.Id == grain1)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.CoverImageUrl, "/api/media/assets/grain-1.jpg"), cancellationToken);
        await dbContext.GrainLots.Where(x => x.Id == grain2)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.CoverImageUrl, "/api/media/assets/grain-2.jpg"), cancellationToken);
        await dbContext.EquipmentLots.Where(x => x.Id == equipment1)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.CoverImageUrl, "/api/media/assets/equipment-1.jpg"), cancellationToken);
    }

    private async Task SyncUserReferencesAsync(CancellationToken cancellationToken)
    {
        await dbContext.Users.Where(x => x.Id == Guid.Parse("11111111-1111-1111-1111-111111111111"))
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Email, "participant1@zerno.local"), cancellationToken);
        await dbContext.Users.Where(x => x.Id == Guid.Parse("22222222-2222-2222-2222-222222222222"))
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Email, "participant2@zerno.local"), cancellationToken);
        await dbContext.Users.Where(x => x.Id == Guid.Parse("33333333-3333-3333-3333-333333333333"))
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.Email, "participant3@zerno.local"), cancellationToken);
    }

    private Task ClearSeedDataAsync(CancellationToken cancellationToken)
        => dbContext.Database.ExecuteSqlRawAsync("""
TRUNCATE TABLE
  "CartItems",
  "OrderItems",
  "Orders",
  "AuctionBids",
  "AuctionLots",
  "ForumReplies",
  "ForumTopics",
  "Notifications",
  "Subscriptions",
  "SellerApplications",
  "PriceRecords",
  "NewsArticles",
  "AnalyticsPoints",
  "ReferenceCatalogItems",
  "MarketplaceLot",
  "Users",
  "PortalSeedStates"
RESTART IDENTITY CASCADE;
""", cancellationToken);

    private async Task SeedReferenceCatalogAsync(CancellationToken cancellationToken)
    {
        if (await dbContext.ReferenceCatalogItems.AnyAsync(cancellationToken))
        {
            return;
        }

        var items = new[]
        {
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111111"), Category = "countries", Slug = "russia", Title = "Россия", Region = "Россия", Summary = "Экспортный и внутренний рынок зерновых.", Details = "Ключевой рынок с сильной региональной логистикой, портовой инфраструктурой и крупными внутренними переработчиками.", Contacts = "Справка каталога", Status = "active", Highlights = ["Экспорт: Черноморский бассейн", "Пшеница 3 класса: 16 800 ₽/т", "Сильный спрос в ЦФО"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111112"), Category = "countries", Slug = "kazakhstan", Title = "Казахстан", Region = "ЕАЭС", Summary = "Поставки зерна и транзит.", Details = "Высокая роль в транзитных цепочках и межгосударственной торговле.", Contacts = "Справка каталога", Status = "active", Highlights = ["Транзит: высокий", "Ключевая культура: пшеница", "Сезонные ограничения по ж/д"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111113"), Category = "cultures", Slug = "wheat", Title = "Пшеница", Region = "Россия", Summary = "Главная культура рынка.", Details = "Лоты продовольственной и фуражной пшеницы, ценовые индексы и экспортная аналитика.", Contacts = "market@zerno.local", Status = "active", Highlights = ["3, 4 и 5 классы", "Активные торги", "Погрузка в порты"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111114"), Category = "cultures", Slug = "barley", Title = "Ячмень", Region = "Россия", Summary = "Фуражная и экспортная культура.", Details = "Используется в кормовой промышленности и на экспортных направлениях.", Contacts = "market@zerno.local", Status = "active", Highlights = ["Фуражные партии", "Умеренная сезонность", "Спрос со стороны комбикормов"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111115"), Category = "organizations", Slug = "kfh-vyazemskie-poly", Title = "КФХ Вяземские Поля", Region = "Смоленская область", Summary = "Проверенный производитель зерна.", Details = "Реальные поставки пшеницы и ячменя, документы и активные лоты на площадке.", Contacts = "+7 (900) 123-45-67 · trade@vyapol.ru", Status = "active", Highlights = ["Рейтинг 4,8/5", "Активных лотов: 12", "Сделок за квартал: 34"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111116"), Category = "organizations", Slug = "agrotehsnab", Title = "ИП АгроТехСнаб", Region = "Смоленская область", Summary = "Поставщик техники и сервиса.", Details = "Продажа и обслуживание сельхозтехники, доступен лизинг и трейд-ин.", Contacts = "+7 (920) 555-12-88 · sale@agrotehsnab.ru", Status = "active", Highlights = ["Рейтинг 4,7/5", "Активных лотов: 9", "Сервисная сеть"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111117"), Category = "routes", Slug = "smolensk-novorossiysk", Title = "Смоленск - Новороссийск", Region = "ЦФО - ЮФО", Summary = "Базовый экспортный маршрут.", Details = "Комбинированная перевозка с ж/д плечом и портовой перевалкой.", Contacts = "Logistics desk", Status = "active", Highlights = ["2-4 суток", "Окно порта 12-24 ч", "Сезонный коэффициент: средний"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111118"), Category = "rail-tariffs", Slug = "grain-wagons", Title = "Тарифы зерновозов", Region = "Россия", Summary = "Ж/д тарифы для зерновых партий.", Details = "Тарифы по направлениям, ограничения и сезонные коэффициенты.", Contacts = "rzd@zerno.local", Status = "active", Highlights = ["Базовый тариф от 2 480 ₽/т", "Пиковые окна: сентябрь-ноябрь", "Предварительное бронирование"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111119"), Category = "duties", Slug = "export-duty-wheat", Title = "Экспортная пошлина на пшеницу", Region = "Россия", Summary = "Актуальные правила по вывозу.", Details = "Справка по действующим пошлинам и коэффициентам по ключевым культурам.", Contacts = "legal@zerno.local", Status = "active", Highlights = ["Динамический расчёт", "Учет базовой цены", "Проверка перед сделкой"] },
            new ReferenceCatalogItem { Id = Guid.Parse("e1111111-1111-1111-1111-111111111120"), Category = "exchange", Slug = "mosbirzha-wheat", Title = "Биржевой ориентир пшеницы", Region = "Россия", Summary = "Биржевой ориентир по пшенице для внутреннего рынка и экспорта.", Details = "Обменные и биржевые индикаторы для сравнения с внутренними ценами и портовыми котировками.", Contacts = "market@zerno.local", Status = "active", Highlights = ["Ориентир для экспорта", "Еженедельная динамика", "Сравнение с FOB"] }
        };

        dbContext.ReferenceCatalogItems.AddRange(items);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private Task SeedVolumeAsync(DateTime now, UserAccount buyer, UserAccount seller1, UserAccount seller2, CancellationToken cancellationToken)
    {
        var extraBuyers = Enumerable.Range(1, 8)
            .Select(index => new UserAccount
            {
                Id = Guid.Parse($"11111111-1111-1111-1111-{index + 1:000000000000}"),
                Email = $"buyer{index + 1}@zerno.local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
                DisplayName = $"ООО Закупка {index + 1}",
                Region = index % 2 == 0 ? "ЦФО" : "ЮФО",
                FarmType = "Закупщик зерна",
                Role = UserRole.Buyer,
                SellerVerificationStatus = SellerVerificationStatus.Approved,
                PreferredLanguage = "ru",
                EmailNotificationsEnabled = true,
                CreatedAtUtc = now.AddDays(-index)
            })
            .ToList();

        dbContext.Users.AddRange(extraBuyers);

        var extraLots = Enumerable.Range(1, 12)
            .Select(index => new GrainLot
            {
                Id = Guid.Parse($"55555555-5555-5555-5555-555555555{600 + index:000}"),
                SellerId = seller1.Id,
                SellerName = seller1.DisplayName,
                Title = $"Пшеница 3 класса партия {index}",
                GrainType = index % 2 == 0 ? GrainType.Wheat : GrainType.Barley,
                Grade = index % 2 == 0 ? "3 класс" : "Фуражный",
                VolumeTons = 60 + index * 12,
                PricePerTon = 15900 + index * 140,
                Region = index % 3 == 0 ? "Смоленская область" : "ЦФО",
                QualityScore = 82 + (index % 8),
                Description = "Демо партия с документами, лабораторным протоколом и логистической доступностью.",
                HasOwnTransport = index % 2 == 0,
                AuctionEnabled = index % 3 == 0,
                MercuryCertificate = $"МЕРК-2026-{1200 + index}",
                DeclarationOfConformity = $"ЕАЭС N RU Д-RU.РА07.В.{22000 + index}/26",
                StorageContract = $"Договор хранения N {60 + index}/26",
                Category = LotCategory.Grain,
                Price = (15900 + index * 140) * (60 + index * 12),
                CoverImageUrl = index % 3 == 0 ? "/api/media/assets/news-1.jpg" : "/api/media/assets/grain-1.jpg",
                CreatedAtUtc = now.AddHours(-index * 3)
            })
            .ToList();

        var extraEquipment = Enumerable.Range(1, 8)
            .Select(index => new EquipmentLot
            {
                Id = Guid.Parse($"66666666-6666-6666-6666-6666666667{index:00}"),
                SellerId = seller2.Id,
                SellerName = seller2.DisplayName,
                Title = index % 2 == 0 ? $"Комбайн ACROS {590 + index}" : $"Трактор МТЗ 1221.{index}",
                Brand = index % 2 == 0 ? "Ростсельмаш" : "МТЗ",
                Year = 2020 + index % 5,
                Condition = index % 2 == 0 ? EquipmentCondition.New : EquipmentCondition.Used,
                Region = index % 3 == 0 ? "ЮФО" : "Смоленская область",
                Description = "Демо техника с реалистичным описанием, фото и условиями поставки.",
                Category = LotCategory.Equipment,
                Price = 1750000 + index * 420000,
                CoverImageUrl = index % 2 == 0 ? "/api/media/assets/equipment-2.jpg" : "/api/media/assets/equipment-1.jpg",
                CreatedAtUtc = now.AddHours(-index * 5)
            })
            .ToList();

        dbContext.GrainLots.AddRange(extraLots);
        dbContext.EquipmentLots.AddRange(extraEquipment);

        var forumTopics = Enumerable.Range(1, 10)
            .Select(index => new ForumTopic
            {
                Id = Guid.Parse($"99999999-9999-9999-9999-9999999998{index:00}"),
                AuthorId = index % 2 == 0 ? seller1.Id : buyer.Id,
                AuthorName = index % 2 == 0 ? seller1.DisplayName : buyer.DisplayName,
                Section = index % 3 == 0 ? ForumSection.Trade : index % 3 == 1 ? ForumSection.Agrology : ForumSection.Equipment,
                Title = $"Демо тема рынка #{index}",
                Content = "Обсуждение цен, качества зерна, логистики и сезонных рисков на реальном наборе данных.",
                Tags = ["#рынок", "#демо", "#логистика"],
                CreatedAtUtc = now.AddDays(-index)
            })
            .ToList();

        dbContext.ForumTopics.AddRange(forumTopics);
        dbContext.ForumReplies.AddRange(
            forumTopics.Select((topic, index) => new ForumReply
            {
                Id = Guid.Parse($"99999999-9999-9999-9999-9999999997{index:00}"),
                TopicId = topic.Id,
                AuthorName = $"Эксперт {index + 1}",
                Rating = 4.1m + (index % 8) * 0.1m,
                Content = "Рекомендация: проверять качество партии, плечо доставки и реальную ликвидность по региону.",
                CreatedAtUtc = now.AddDays(-index).AddHours(2)
            }));

        dbContext.Notifications.AddRange(
            extraBuyers.Take(5).Select((user, index) => new NotificationItem
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Message = $"Для {user.DisplayName} готово новое рыночное уведомление по ценам и логистике.",
                Viewed = index % 2 == 0,
                CreatedAtUtc = now.AddHours(-index)
            }));

        return Task.CompletedTask;
    }

    private static string CreateSvgDataUrl(string title, string subtitle, string accent, string shadow)
    {
        static string Escape(string value)
            => System.Security.SecurityElement.Escape(value) ?? string.Empty;

        var svg = $"""
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="{Escape(title)}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{accent}" />
      <stop offset="100%" stop-color="{shadow}" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04" />
    </linearGradient>
  </defs>
  <rect width="1200" height="800" rx="48" fill="url(#bg)" />
  <circle cx="990" cy="135" r="190" fill="#ffffff" fill-opacity="0.08" />
  <circle cx="180" cy="690" r="240" fill="#ffffff" fill-opacity="0.07" />
  <path d="M0 590C160 520 250 495 410 510C564 524 650 590 788 615C917 638 1040 610 1200 548V800H0V590Z" fill="#ffffff" fill-opacity="0.08" />
  <rect x="80" y="80" width="184" height="8" rx="4" fill="url(#shine)" />
  <text x="80" y="180" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="68" font-weight="700">{Escape(title)}</text>
  <text x="80" y="252" fill="#f5f5f5" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="400" opacity="0.9">{Escape(subtitle)}</text>
  <text x="80" y="690" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="24" letter-spacing="4" text-transform="uppercase" opacity="0.78">Zerno.com</text>
</svg>
""";

        return "data:image/svg+xml;charset=utf-8," + Uri.EscapeDataString(svg);
    }
}
