import { BookOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Card, Col, DatePicker, Empty, Input, Row, Select, Space, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { NewsArticle } from '../types/domain';

type SortMode = 'new' | 'importance';

const sectionOptions = [
  { value: 'main', label: 'Главные новости' },
  { value: 'russia', label: 'Новости России' },
  { value: 'cis', label: 'Новости СНГ' },
  { value: 'analytics', label: 'Аналитика' },
  { value: 'press', label: 'Пресс-релизы' },
] as const;

function normalizeSection(value?: string | null) {
  if (!value) return undefined;
  const found = sectionOptions.find((item) => item.value === value || item.label === value);
  return found?.label ?? value;
}

function denormalizeSection(value?: string) {
  if (!value) return undefined;
  const found = sectionOptions.find((item) => item.label === value);
  return found?.value ?? value;
}

function parseRuDate(value: string) {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return Number.NaN;
  const [, day, month, year, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
}

function formatReadTime(lead: string) {
  const words = lead.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(2, Math.round(words / 35))} мин`;
}

const newsFallbackImages = [
  '/images/thematic/image_01.jpg',
  '/images/thematic/image_05.jpg',
  '/images/thematic/image_09.jpg',
  '/images/thematic/image_13.jpg',
  '/images/stock/green-field.jpg',
  '/images/stock/sunflower-tractor.jpg',
];

function fallbackNewsImage(article: NewsArticle, index = 0) {
  if (article.section === 'Пресс-релизы') return '/images/stock/green-field.jpg';
  if (article.section === 'Аналитика') return '/images/thematic/image_13.jpg';
  const seed = article.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), index);
  return newsFallbackImages[Math.abs(seed) % newsFallbackImages.length];
}

function resolveNewsImage(article: NewsArticle, index = 0) {
  const imageUrl = article.imageUrl?.trim();
  if (!imageUrl || imageUrl.startsWith('/api/media/assets/')) {
    return fallbackNewsImage(article, index);
  }

  return imageUrl;
}

function shareNews(title: string, url: string) {
  if (navigator.share) {
    void navigator.share({ title, url }).catch(() => undefined);
    return;
  }

  void navigator.clipboard.writeText(url)
    .then(() => {
      void message.success('Ссылка скопирована');
    })
    .catch(() => {
      void message.info(url);
    });
}

function rankSection(section: string) {
  return sectionOptions.findIndex((item) => item.label === section);
}

function formatMoney(value: number) {
  return value.toLocaleString('ru-RU');
}

function useNewsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = {
    section: normalizeSection(searchParams.get('section')),
    country: searchParams.get('country') ?? undefined,
    culture: searchParams.get('culture') ?? undefined,
    region: searchParams.get('region') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    sort: (searchParams.get('sort') as SortMode | null) ?? 'new',
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
  };

  const setParams = (next: Partial<typeof params>) => {
    const updated = new URLSearchParams();
    const merged = { ...params, ...next };

    if (merged.section) updated.set('section', denormalizeSection(merged.section) ?? merged.section);
    if (merged.country) updated.set('country', merged.country);
    if (merged.culture) updated.set('culture', merged.culture);
    if (merged.region) updated.set('region', merged.region);
    if (merged.type) updated.set('type', merged.type);
    if (merged.q) updated.set('q', merged.q);
    if (merged.sort) updated.set('sort', merged.sort);
    if (merged.dateFrom) updated.set('dateFrom', merged.dateFrom);
    if (merged.dateTo) updated.set('dateTo', merged.dateTo);

    setSearchParams(updated, { replace: true });
  };

  const clearParams = () => setSearchParams({}, { replace: true });

  return { params, setParams, clearParams };
}

function filterNews(news: NewsArticle[], params: ReturnType<typeof useNewsFilters>['params']) {
  const from = params.dateFrom ? dayjs(params.dateFrom).startOf('day').valueOf() : undefined;
  const to = params.dateTo ? dayjs(params.dateTo).endOf('day').valueOf() : undefined;
  const query = params.q?.trim().toLowerCase() ?? '';

  const filtered = news.filter((item) => {
    if (params.section && item.section !== params.section) return false;
    if (params.country && item.country !== params.country) return false;
    if (params.culture && item.culture !== params.culture) return false;
    if (params.region && item.region !== params.region) return false;
    if (params.type && item.type !== params.type) return false;
    if (query && !`${item.title} ${item.lead} ${item.section} ${item.culture} ${item.country} ${item.region}`.toLowerCase().includes(query)) {
      return false;
    }

    const publishedAt = parseRuDate(item.date);
    if (from !== undefined && !Number.isNaN(from) && publishedAt < from) return false;
    if (to !== undefined && !Number.isNaN(to) && publishedAt > to) return false;
    return true;
  });

  if (params.sort === 'importance') {
    return [...filtered].sort((a, b) => rankSection(a.section) - rankSection(b.section) || parseRuDate(b.date) - parseRuDate(a.date));
  }

  return [...filtered].sort((a, b) => parseRuDate(b.date) - parseRuDate(a.date));
}

function buildSidebarLinks() {
  return [
    { label: 'Цены', path: '/prices' },
    { label: 'Логистика', path: '/logistics' },
    { label: 'Маркетплейс', path: '/marketplace' },
    { label: 'Форум', path: '/forum' },
  ];
}

export function NewsPage() {
  const navigate = useNavigate();
  const news = useAppStore((state) => state.news);
  const prices = useAppStore((state) => state.prices);
  const references = useAppStore((state) => state.referenceCatalogs);
  const { params, setParams, clearParams } = useNewsFilters();

  const filtered = useMemo(() => filterNews(news, params), [news, params]);
  const visibleNews = filtered.length ? filtered : news;
  const sidebarLinks = useMemo(() => buildSidebarLinks(), []);
  const railItems = references['rail-tariffs']?.slice(0, 2) ?? [];

  const counts = useMemo(() => {
    const todayKey = dayjs().format('DD.MM.YYYY');
    const today = news.filter((item) => item.date.startsWith(todayKey)).length;
    const sectionCount = new Set(news.map((item) => item.section)).size;
    const cultures = new Set(news.map((item) => item.culture)).size;
    return { today, sectionCount, cultures, total: news.length };
  }, [news]);

  return (
    <div className="news-page">
      <Card className="section-card news-hero">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={14}>
            <Space direction="vertical" size={16} className="news-hero__copy">
              <Tag color="green" style={{ width: 'fit-content' }}>
                Новости рынка
              </Tag>
              <Typography.Title level={1} className="news-hero__title">
                Актуальная лента зернового рынка, логистики и аналитики
              </Typography.Title>
              <Typography.Paragraph className="lead-text news-hero__lead">
                Свежие материалы по экспорту, внутреннему рынку, перевозкам и отраслевым комментариям собраны в одной редакционной ленте.
              </Typography.Paragraph>
              <Space wrap>
                <Button type="primary" size="large" onClick={clearParams}>
                  Обновить ленту
                </Button>
                <Button size="large" onClick={() => navigate('/marketplace')}>
                  Открыть площадку
                </Button>
              </Space>
            </Space>
          </Col>

          <Col xs={24} xl={10}>
            <div className="news-hero__stats">
              {[
                { label: 'Материалов', value: counts.total },
                { label: 'Сегодня', value: counts.today },
                { label: 'Тем', value: counts.sectionCount },
                { label: 'Культур', value: counts.cultures },
                { label: 'Ценовых рядов', value: prices.length },
                { label: 'Референсов', value: Object.values(references).flat().length },
              ].map((item) => (
                <Card key={item.label} className="news-stat-card">
                  <Typography.Text className="news-stat-card__label">{item.label}</Typography.Text>
                  <Typography.Title level={3} className="news-stat-card__value">
                    {item.value}
                  </Typography.Title>
                  <Typography.Text type="secondary">snapshot</Typography.Text>
                </Card>
              ))}
            </div>
          </Col>
        </Row>
      </Card>

      <Card className="section-card">
        <Row gutter={[12, 12]} align="bottom">
          <Col xs={24} xl={10}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Поиск</Typography.Text>
              <Input
                allowClear
                placeholder="Поиск по заголовкам, культурам, регионам и типам"
                value={params.q}
                onChange={(event) => setParams({ q: event.target.value || undefined })}
                size="large"
              />
            </Space>
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Рубрика</Typography.Text>
              <Select
                allowClear
                placeholder="Все рубрики"
                value={params.section}
                onChange={(value) => setParams({ section: value })}
                options={sectionOptions.map((item) => ({ value: item.label, label: item.label }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Регион</Typography.Text>
              <Select
                allowClear
                placeholder="Все регионы"
                value={params.region}
                onChange={(value) => setParams({ region: value })}
                options={[...new Set(news.map((item) => item.region))].map((value) => ({ value, label: value }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Культура</Typography.Text>
              <Select
                allowClear
                placeholder="Все культуры"
                value={params.culture}
                onChange={(value) => setParams({ culture: value })}
                options={[...new Set(news.map((item) => item.culture))].map((value) => ({ value, label: value }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={12} xl={2}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Тип</Typography.Text>
              <Select
                allowClear
                placeholder="Все"
                value={params.type}
                onChange={(value) => setParams({ type: value })}
                options={[...new Set(news.map((item) => item.type))].map((value) => ({ value, label: value }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={12} xl={2}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Сортировка</Typography.Text>
              <Select
                value={params.sort}
                onChange={(value) => setParams({ sort: value })}
                options={[
                  { value: 'new', label: 'Сначала новые' },
                  { value: 'importance', label: 'По рубрикам' },
                ]}
              />
            </Space>
          </Col>
          <Col xs={24} xl={24}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">Период</Typography.Text>
              <DatePicker.RangePicker
                style={{ width: '100%' }}
                value={[
                  params.dateFrom ? dayjs(params.dateFrom, 'YYYY-MM-DD') : null,
                  params.dateTo ? dayjs(params.dateTo, 'YYYY-MM-DD') : null,
                ]}
                format="DD.MM.YYYY"
                onChange={(dates) => {
                  setParams({
                    dateFrom: dates?.[0]?.format('YYYY-MM-DD'),
                    dateTo: dates?.[1]?.format('YYYY-MM-DD'),
                  });
                }}
              />
            </Space>
          </Col>
          <Col xs={24} xl={24}>
            <Space className="news-meta-row" style={{ width: '100%' }}>
              <Typography.Text type="secondary">
                Найдено <strong>{filtered.length}</strong> материалов
              </Typography.Text>
              <Space wrap>
                {params.section && <Tag closable onClose={() => setParams({ section: undefined })}>{params.section}</Tag>}
                {params.region && <Tag closable onClose={() => setParams({ region: undefined })}>{params.region}</Tag>}
                {params.culture && <Tag closable onClose={() => setParams({ culture: undefined })}>{params.culture}</Tag>}
                {params.type && <Tag closable onClose={() => setParams({ type: undefined })}>{params.type}</Tag>}
                {params.q && <Tag closable onClose={() => setParams({ q: undefined })}>{params.q}</Tag>}
              </Space>
              <Button onClick={clearParams}>Сбросить</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Space direction="vertical" size={16} className="news-list" style={{ width: '100%' }}>
            {visibleNews.length ? (
              visibleNews.map((article, index) => {
                const image = resolveNewsImage(article, index);
                const isLead = index === 0;
                return (
                  <Card
                    key={article.id}
                    className={`news-card ${isLead ? 'news-card--lead' : ''}`}
                    onClick={() => navigate(`/news/${article.id}`)}
                  >
                    <div className="news-card__grid">
                      <img
                        src={image}
                        alt={article.title}
                        className="news-card__image"
                        loading={isLead ? 'eager' : 'lazy'}
                        onError={(event) => {
                          event.currentTarget.src = fallbackNewsImage(article, index);
                        }}
                      />
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color="green">{article.section}</Tag>
                          <Tag>{article.type}</Tag>
                          <Typography.Text className="news-card__meta">{article.date}</Typography.Text>
                        </Space>
                        <Typography.Title level={isLead ? 2 : 4} className="news-card__title">
                          {article.title}
                        </Typography.Title>
                        <Typography.Paragraph className="lead-text">
                          {article.lead}
                        </Typography.Paragraph>
                        <Space wrap>
                          <Tag color="green">{article.culture}</Tag>
                          <Tag color="blue">{article.region}</Tag>
                          <Tag>{article.country}</Tag>
                        </Space>
                        <Space wrap>
                          <Button type="primary" onClick={(event) => { event.stopPropagation(); navigate(`/news/${article.id}`); }}>
                            Читать
                          </Button>
                          <Button
                            icon={<ShareAltOutlined />}
                            onClick={(event) => {
                              event.stopPropagation();
                              shareNews(article.title, `${window.location.origin}/news/${article.id}`);
                            }}
                          >
                            Поделиться
                          </Button>
                        </Space>
                      </Space>
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card>
                <Empty description="По выбранным фильтрам материалов нет">
                  <Button type="primary" onClick={clearParams}>
                    Очистить фильтры
                  </Button>
                </Empty>
              </Card>
            )}
          </Space>
        </Col>

        <Col xs={24} xl={8}>
          <div className="news-rail">
            <Card title="Индексы" className="news-rail-card">
              <div className="news-rail-card__items">
                {prices.slice(0, 3).map((row) => (
                  <div key={row.id} className="news-rail-card__row">
                    <div>
                      <Typography.Text strong>{row.culture}</Typography.Text>
                      <Typography.Text type="secondary" style={{ display: 'block' }}>
                        {row.region}
                      </Typography.Text>
                    </div>
                    <Typography.Text className="news-rail-card__value">{formatMoney(row.day)} ₽/т</Typography.Text>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Логистика" className="news-rail-card">
              <div className="news-rail-card__items">
                {railItems.map((item) => (
                  <div key={item.id} className="news-rail-card__row">
                    <div>
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <Typography.Text type="secondary" style={{ display: 'block' }}>
                        {item.summary}
                      </Typography.Text>
                    </div>
                  </div>
                ))}
                {!railItems.length && <Typography.Text type="secondary">Данные по маршрутам появятся после обновления справочника.</Typography.Text>}
              </div>
            </Card>

            <Card title="Быстрые ссылки" className="news-rail-card">
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {sidebarLinks.map((item) => (
                  <Button key={item.path} block onClick={() => navigate(item.path)}>
                    {item.label}
                  </Button>
                ))}
              </Space>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export function NewsDetailPage() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const news = useAppStore((state) => state.news);
  const prices = useAppStore((state) => state.prices);
  const current = news.find((item) => item.id === newsId) ?? news[0];
  const related = useMemo(() => {
    if (!current) return [];
    return news
      .filter((item) => item.id !== current.id)
      .filter((item) => item.section === current.section || item.culture === current.culture || item.region === current.region)
      .sort((a, b) => parseRuDate(b.date) - parseRuDate(a.date))
      .slice(0, 4);
  }, [current, news]);

  if (!current) {
    return <Empty description="Новость не найдена" />;
  }

  const image = resolveNewsImage(current);
  const readTime = formatReadTime(current.lead);
  const priceRow = prices.find((row) => row.culture === current.culture) ?? prices[0];

  return (
    <div className="news-detail">
      <Card className="page-header-card">
        <Breadcrumb
          className="page-breadcrumb"
          items={[
            { title: <Typography.Link onClick={() => navigate('/')}>Главная</Typography.Link> },
            { title: <Typography.Link onClick={() => navigate('/news')}>Новости</Typography.Link> },
            { title: current.section },
          ]}
        />
        <Typography.Title level={1} className="page-header-card__title">
          {current.title}
        </Typography.Title>
        <Space wrap>
          <Tag color="green">{current.section}</Tag>
          <Tag>{current.type}</Tag>
          <Tag>{current.country}</Tag>
          <Tag>{current.culture}</Tag>
          <Tag>{current.region}</Tag>
          <Tag color="gold">{readTime}</Tag>
          <Typography.Text type="secondary">{current.date}</Typography.Text>
        </Space>
      </Card>

      <div className="news-detail__layout">
        <div className="news-detail__body">
          <Card className="section-card">
            <img
              src={image}
              alt={current.title}
              className="news-detail__image"
              onError={(event) => {
                event.currentTarget.src = fallbackNewsImage(current);
              }}
            />
            <Typography.Paragraph className="news-detail__intro" style={{ marginTop: 16 }}>
              {current.lead}
            </Typography.Paragraph>
            <Typography.Paragraph>
              Материал относится к направлению <strong>{current.section}</strong> и связан с культурой <strong>{current.culture}</strong> в регионе <strong>{current.region}</strong>.
            </Typography.Paragraph>
            <Typography.Paragraph>
              Для контекста используйте ценовые ряды, логистику и связанные материалы: они позволяют быстро сопоставить новость с состоянием рынка.
            </Typography.Paragraph>
          </Card>

          <Card title="Ключевые выводы" className="news-detail__quote">
            <Space direction="vertical" size={8}>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {current.section} · {current.culture} · {current.country}
              </Typography.Paragraph>
              <Typography.Text type="secondary">
                Текущая цена по витрине: {priceRow ? `${formatMoney(priceRow.day)} ₽/т` : 'нет данных'}.
              </Typography.Text>
              <Typography.Text type="secondary">
                Сводка сформирована из snapshot и должна быть расширена полным текстом новости на backend.
              </Typography.Text>
            </Space>
          </Card>

          <Card title="Связанные материалы">
            <div className="news-detail__related">
              {related.map((item) => (
                <Card key={item.id} className="news-detail__related-card" onClick={() => navigate(`/news/${item.id}`)}>
                  <Space direction="vertical" size={8}>
                    <Space wrap>
                      <Tag color="green">{item.section}</Tag>
                      <Typography.Text type="secondary">{item.date}</Typography.Text>
                    </Space>
                    <Typography.Title level={4} style={{ marginBottom: 0 }}>
                      {item.title}
                    </Typography.Title>
                    <Typography.Text type="secondary">{item.lead}</Typography.Text>
                  </Space>
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <aside className="news-detail__rail">
          <Card title="Параметры материала" className="news-detail__rail-card">
            <Space direction="vertical" size={8}>
              <Typography.Text>Раздел: {current.section}</Typography.Text>
              <Typography.Text>Культура: {current.culture}</Typography.Text>
              <Typography.Text>Регион: {current.region}</Typography.Text>
              <Typography.Text>Тип: {current.type}</Typography.Text>
              <Typography.Text>Время чтения: {readTime}</Typography.Text>
            </Space>
          </Card>

          <Card title="Поделиться материалом" className="news-detail__rail-card">
            <div className="news-detail__toolbar">
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => shareNews(current.title, `${window.location.origin}/news/${current.id}`)}
              >
                Поделиться
              </Button>
              <Button icon={<BookOutlined />}>Сохранить</Button>
            </div>
          </Card>

       </aside>
      </div>
    </div>
  );
}
