import { ShareAltOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Empty, Row, Select, Space, Tag, Typography, message } from 'antd';
import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { newsImageMap } from '../data/mediaAssets';
import { useAppStore } from '../store/appStore';
import { NewsArticle } from '../types/domain';

type SortMode = 'date' | 'importance';

function normalizeSection(value?: string | null) {
  if (!value) return undefined;
  switch (value) {
    case 'main':
    case 'Главные новости':
      return 'Главные новости';
    case 'russia':
    case 'Новости России':
      return 'Новости России';
    case 'cis':
    case 'world':
    case 'Новости СНГ':
    case 'Мировые новости':
      return 'Новости СНГ';
    case 'analytics':
    case 'Аналитика':
      return 'Аналитика';
    case 'press':
    case 'Пресс-релизы':
      return 'Пресс-релизы';
    default:
      return value;
  }
}

function denormalizeSection(value: string) {
  const map: Record<string, string> = {
    'Главные новости': 'main',
    'Новости России': 'russia',
    'Новости СНГ': 'cis',
    Аналитика: 'analytics',
    'Пресс-релизы': 'press',
  };
  return map[value] ?? value;
}

function resolveNewsImage(article: NewsArticle) {
  return article.imageUrl ?? newsImageMap[article.id] ?? newsImageMap['n-1'] ?? '/images/thematic/image_01.jpg';
}

function shareNews(title: string, url: string) {
  if (navigator.share) {
    void navigator.share({ title, url }).catch(() => undefined);
    return;
  }

  void navigator.clipboard.writeText(url).then(() => {
    void message.success('Ссылка на материал скопирована');
  }).catch(() => {
    void message.info(url);
  });
}

export function NewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const news = useAppStore((state) => state.news);

  const section = normalizeSection(searchParams.get('section'));
  const country = searchParams.get('country') ?? undefined;
  const culture = searchParams.get('culture') ?? undefined;
  const region = searchParams.get('region') ?? undefined;
  const type = searchParams.get('type') ?? undefined;
  const sort = (searchParams.get('sort') as SortMode) ?? 'date';

  const filtered = useMemo(() => {
    const list = news.filter((item) => {
      if (section && item.section !== section) return false;
      if (country && item.country !== country) return false;
      if (culture && item.culture !== culture) return false;
      if (region && item.region !== region) return false;
      if (type && item.type !== type) return false;
      return true;
    });

    if (sort === 'importance') {
      const rank: Record<string, number> = {
        'Главные новости': 1,
        'Новости России': 2,
        'Новости СНГ': 3,
        Аналитика: 4,
        'Пресс-релизы': 5,
      };
      return [...list].sort((a, b) => (rank[a.section] ?? 99) - (rank[b.section] ?? 99));
    }

    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [culture, country, news, region, section, sort, type]);

  const headline = filtered[0] ?? news[0];

  const syncParams = (next: {
    section?: string;
    country?: string;
    culture?: string;
    region?: string;
    type?: string;
    sort?: string;
  }) => {
    const params = new URLSearchParams();
    if (next.section) params.set('section', denormalizeSection(next.section));
    if (next.country) params.set('country', next.country);
    if (next.culture) params.set('culture', next.culture);
    if (next.region) params.set('region', next.region);
    if (next.type) params.set('type', next.type);
    if (next.sort) params.set('sort', next.sort);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Новости рынка</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Лента материалов, которая повторяет композицию ReactDesign: hero, фильтры в одну строку, главная новость и лента ниже.
        </Typography.Paragraph>
      </Card>

      <Card title={`Фильтры новостей · найдено: ${filtered.length}`}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Раздел"
              value={section}
              onChange={(value) => syncParams({ section: value, country, culture, region, type, sort })}
              style={{ width: '100%' }}
              options={[...new Set(news.map((item) => item.section))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Страна"
              value={country}
              onChange={(value) => syncParams({ section, country: value, culture, region, type, sort })}
              style={{ width: '100%' }}
              options={[...new Set(news.map((item) => item.country))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Культура"
              value={culture}
              onChange={(value) => syncParams({ section, country, culture: value, region, type, sort })}
              style={{ width: '100%' }}
              options={[...new Set(news.map((item) => item.culture))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Регион"
              value={region}
              onChange={(value) => syncParams({ section, country, culture, region: value, type, sort })}
              style={{ width: '100%' }}
              options={[...new Set(news.map((item) => item.region))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={3}>
            <Select
              allowClear
              placeholder="Тип"
              value={type}
              onChange={(value) => syncParams({ section, country, culture, region, type: value, sort })}
              style={{ width: '100%' }}
              options={[...new Set(news.map((item) => item.type))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={3}>
            <Select
              value={sort}
              onChange={(value) => syncParams({ section, country, culture, region, type, sort: value })}
              style={{ width: '100%' }}
              options={[
                { value: 'date', label: 'По дате' },
                { value: 'importance', label: 'По значимости' },
              ]}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <DatePicker.RangePicker style={{ width: '100%' }} placeholder={['Дата от', 'Дата до']} />
          </Col>
          <Col xs={24} md={12} xl={2}>
            <Button block onClick={clearFilters}>Сбросить</Button>
          </Col>
        </Row>

        <Space wrap style={{ marginTop: 12 }}>
          {section && <Tag closable onClose={() => syncParams({ country, culture, region, type, sort })}>{section}</Tag>}
          {country && <Tag closable onClose={() => syncParams({ section, culture, region, type, sort })}>{country}</Tag>}
          {culture && <Tag closable onClose={() => syncParams({ section, country, region, type, sort })}>{culture}</Tag>}
          {region && <Tag closable onClose={() => syncParams({ section, country, culture, type, sort })}>{region}</Tag>}
          {type && <Tag closable onClose={() => syncParams({ section, country, culture, region, sort })}>{type}</Tag>}
        </Space>
      </Card>

      <Card title="Главная новость дня" className="headline-card" onClick={() => navigate(`/news/${headline.id}`)}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} xl={11}>
            <img src={resolveNewsImage(headline)} alt={headline.title} className="news-image-large" />
          </Col>
          <Col xs={24} xl={13}>
            <Space direction="vertical" size={8}>
              <Space>
                <Tag color="green">{headline.type}</Tag>
                <Typography.Text type="secondary">{headline.date}</Typography.Text>
              </Space>
              <Typography.Title level={2}>{headline.title}</Typography.Title>
              <Typography.Paragraph>{headline.lead}</Typography.Paragraph>
              <Space>
                <Button type="primary" onClick={(e) => { e.stopPropagation(); navigate(`/news/${headline.id}`); }}>Открыть</Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    shareNews(headline.title, `${window.location.origin}/news/${headline.id}`);
                  }}
                >
                  Поделиться
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Лента материалов">
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          {filtered.map((item) => (
            <Card key={item.id} className="nested-card">
              <Row gutter={[14, 14]}>
                <Col xs={24} md={8} xl={6}>
                  <img src={resolveNewsImage(item)} alt={item.title} className="news-image-thumb" />
                </Col>
                <Col xs={24} md={16} xl={18}>
                  <Space direction="vertical" size={5} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag>{item.section}</Tag>
                      <Tag color="blue">{item.culture}</Tag>
                      <Tag>{item.region}</Tag>
                      <Typography.Text type="secondary">{item.date}</Typography.Text>
                    </Space>
                    <Typography.Title level={4}>{item.title}</Typography.Title>
                    <Typography.Paragraph>{item.lead}</Typography.Paragraph>
                    <Space>
                      <Button type="primary" onClick={() => navigate(`/news/${item.id}`)}>Открыть</Button>
                      <Button icon={<ShareAltOutlined />} onClick={() => shareNews(item.title, `${window.location.origin}/news/${item.id}`)}>
                        Поделиться
                      </Button>
                    </Space>
                  </Space>
                </Col>
              </Row>
            </Card>
          ))}
          {!filtered.length && (
            <Empty description="По выбранным фильтрам материалов нет">
              <Button type="primary" onClick={clearFilters}>Очистить фильтры</Button>
            </Empty>
          )}
        </Space>
      </Card>
    </Space>
  );
}

export function NewsDetailPage() {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const news = useAppStore((state) => state.news);
  const current = news.find((item) => item.id === newsId) ?? news[0];

  const related = useMemo(() => {
    if (!current) return [];
    return news
      .filter((item) => item.id !== current.id)
      .filter((item) => item.section === current.section || item.culture === current.culture || item.region === current.region)
      .slice(0, 3);
  }, [current, news]);

  if (!current) {
    return <Empty description="Новость не найдена" />;
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card>
        <Typography.Link onClick={() => navigate('/news')}>Новости</Typography.Link>
        <Typography.Title level={1}>{current.title}</Typography.Title>
        <Space wrap>
          <Typography.Text type="secondary">{current.date}</Typography.Text>
          <Typography.Text type="secondary">Источник: Редакция ЗерноРУ</Typography.Text>
          <Tag>{current.culture}</Tag>
          <Tag>{current.country}</Tag>
          <Tag>{current.region}</Tag>
        </Space>
        <img src={resolveNewsImage(current)} alt={current.title} className="news-image-large" style={{ marginTop: 12 }} />
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Card title="Материал">
            <Space direction="vertical" size={12}>
              <Typography.Paragraph>
                {current.lead}
              </Typography.Paragraph>
              <Typography.Paragraph>
                В этой версии материал привязан к данным snapshot и не расходится со сводкой на главной, в ценах и на каталожных страницах.
              </Typography.Paragraph>
              <Space wrap>
                <Button
                  type="primary"
                  onClick={() => shareNews(current.title, `${window.location.origin}/news/${current.id}`)}
                  icon={<ShareAltOutlined />}
                >
                  Поделиться
                </Button>
                <Button onClick={() => navigate('/marketplace')}>Перейти в торговую площадку</Button>
              </Space>
            </Space>
          </Card>

          <Card title="Связанные материалы" style={{ marginTop: 16 }}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {related.map((item) => (
                <Card key={item.id} className="nested-card" onClick={() => navigate(`/news/${item.id}`)}>
                  <Space direction="vertical" size={4}>
                    <Space>
                      <Tag>{item.section}</Tag>
                      <Typography.Text type="secondary">{item.date}</Typography.Text>
                    </Space>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Typography.Text type="secondary">{item.lead}</Typography.Text>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Параметры материала">
            <Space direction="vertical" size={8}>
              <Typography.Text>Раздел: {current.section}</Typography.Text>
              <Typography.Text>Культура: {current.culture}</Typography.Text>
              <Typography.Text>Регион: {current.region}</Typography.Text>
              <Typography.Text>Тип: {current.type}</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
