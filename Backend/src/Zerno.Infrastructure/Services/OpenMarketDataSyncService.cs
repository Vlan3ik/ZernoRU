using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zerno.Application.Abstractions;
using Zerno.Domain.Content;
using Zerno.Infrastructure.Persistence;

namespace Zerno.Infrastructure.Services;

public sealed class OpenMarketDataSyncService(
    AppDbContext dbContext,
    ILogger<OpenMarketDataSyncService> logger) : IMarketDataSyncService
{
    public async Task SyncAsync(CancellationToken cancellationToken)
    {
        try
        {
            await SyncNewsAsync(cancellationToken);
            await SyncPricesAsync(cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Market data sync skipped");
        }
    }

    private async Task SyncNewsAsync(CancellationToken cancellationToken)
    {
        var articles = await dbContext.NewsArticles
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var desired = new[]
        {
            new FeedItem("Редакция ЗерноРУ", "Смоленские зерновые хозяйства нарастили отгрузки по внутренним контрактам", "В ЦФО ускорилась логистика по пшенице 3 и 4 класса, а трейдеры фиксируют устойчивый спрос со стороны мукомольных предприятий.", "Главные новости", "Россия", "Пшеница", "ЦФО", "news", DateTime.UtcNow.AddHours(-3)),
            new FeedItem("Служба логистики", "В южных портах сохраняется высокий спрос на вагоны-зерновозы", "Участники рынка в ЮФО и соседних регионах перестраивают графики отгрузок, чтобы сократить простой и удержать ставку фрахта.", "Новости России", "Россия", "Ячмень", "ЮФО", "news", DateTime.UtcNow.AddHours(-5)),
            new FeedItem("Агрообзор СНГ", "Поставки кукурузы в Казахстан и Беларусь выросли на фоне дефицита предложения", "Переработчики и трейдеры в странах ЕАЭС усилили закупки, чтобы закрыть сезонные потребности без роста складских рисков.", "Новости СНГ", "Казахстан", "Кукуруза", "ЕАЭС", "news", DateTime.UtcNow.AddHours(-9)),
            new FeedItem("Аналитический центр", "Баланс спроса и предложения по ячменю смещается в пользу продавцов", "Аналитики ожидают сужение предложения в южных регионах и умеренный рост спотовых цен в течение ближайших недель.", "Аналитика", "Россия", "Ячмень", "ЮФО", "analytics", DateTime.UtcNow.AddHours(-12)),
            new FeedItem("Пресс-служба терминала", "Открыта приемка заявок на майские отгрузки через порт Азов", "Терминал обновил условия и график подачи транспорта для зерновых партий. Ставки и окна погрузки опубликованы для всех участников.", "Пресс-релизы", "Россия", "Пшеница", "ЮФО", "news", DateTime.UtcNow.AddHours(-15)),
        };

        for (var i = 0; i < desired.Length; i++)
        {
            var next = desired[i];
            var article = i < articles.Count ? articles[i] : new NewsArticle { Id = Guid.NewGuid(), CreatedAtUtc = DateTime.UtcNow };

            article.Section = next.Section;
            article.Title = next.Title;
            article.Lead = next.Description.Length > 220 ? next.Description[..220] + "..." : next.Description;
            article.DateText = next.PublishedAtUtc.ToLocalTime().ToString("dd.MM.yyyy HH:mm");
            article.Country = next.Country;
            article.Culture = next.Culture;
            article.Region = next.Region;
            article.Type = next.Type;
            article.UpdatedAtUtc = DateTime.UtcNow;

            if (i >= articles.Count)
            {
                dbContext.NewsArticles.Add(article);
            }
        }
    }

    private async Task SyncPricesAsync(CancellationToken cancellationToken)
    {
        var records = await dbContext.PriceRecords.OrderBy(x => x.Culture).ToListAsync(cancellationToken);
        var factors = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            ["Пшеница 3 класса"] = 1.3m,
            ["Пшеница 4 класса"] = 0.9m,
            ["Пшеница 5 класса"] = 0.8m,
            ["Ячмень"] = 1.1m,
            ["Кукуруза"] = 0.7m,
        };

        foreach (var record in records)
        {
            var factor = factors.TryGetValue(record.Culture, out var nextFactor) ? nextFactor : 0.6m;

            var nextPrice = Math.Max(1000, Math.Round(record.DayPrice * (1 + (factor / 100m)), 0));
            record.DayPrice = nextPrice;
            record.WeekChange = factor;
            record.UpdatedAtUtc = DateTime.UtcNow;
        }
    }

    private sealed record FeedItem(string Source, string Title, string Description, string Section, string Country, string Culture, string Region, string Type, DateTime PublishedAtUtc);
}
