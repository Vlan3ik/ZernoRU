import { Button, Card, Col, DatePicker, Empty, Row, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { newsImageMap } from '../data/mediaAssets';
import { newsFeed } from '../data/portalContent';

type SortMode = 'date' | 'importance';

export function NewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [section, setSection] = useState<string | undefined>(searchParams.get('section') ? normalizeSection(searchParams.get('section') as string) : undefined);
  const [country, setCountry] = useState<string | undefined>(searchParams.get('country') ?? undefined);
  const [culture, setCulture] = useState<string | undefined>(searchParams.get('culture') ?? undefined);
  const [region, setRegion] = useState<string | undefined>(searchParams.get('region') ?? undefined);
  const [type, setType] = useState<string | undefined>(searchParams.get('type') ?? undefined);
  const [sort, setSort] = useState<SortMode>((searchParams.get('sort') as SortMode) ?? 'date');

  const filtered = useMemo(() => {
    const list = newsFeed.filter((item) => {
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
        'Мировые новости': 3,
        Аналитика: 4,
        'Пресс-релизы': 5,
      };
      return [...list].sort((a, b) => (rank[a.section] ?? 99) - (rank[b.section] ?? 99));
    }

    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [section, country, culture, region, type, sort]);

  const headline = filtered[0] ?? newsFeed[0];

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
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSection(undefined);
    setCountry(undefined);
    setCulture(undefined);
    setRegion(undefined);
    setType(undefined);
    setSort('date');
    setSearchParams({});
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Новости рынка</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Лента материалов с фильтрами, сортировкой, ведущей новостью и быстрыми действиями.
        </Typography.Paragraph>
      </Card>

      <Card title={`Фильтры новостей · найдено: ${filtered.length}`}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Раздел"
              value={section}
              onChange={(value) => {
                setSection(value);
                syncParams({ section: value, country, culture, region, type, sort });
              }}
              style={{ width: '100%' }}
              options={[...new Set(newsFeed.map((item) => item.section))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Страна"
              value={country}
              onChange={(value) => {
                setCountry(value);
                syncParams({ section, country: value, culture, region, type, sort });
              }}
              style={{ width: '100%' }}
              options={[...new Set(newsFeed.map((item) => item.country))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Культура"
              value={culture}
              onChange={(value) => {
                setCulture(value);
                syncParams({ section, country, culture: value, region, type, sort });
              }}
              style={{ width: '100%' }}
              options={[...new Set(newsFeed.map((item) => item.culture))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={4}>
            <Select
              allowClear
              placeholder="Регион"
              value={region}
              onChange={(value) => {
                setRegion(value);
                syncParams({ section, country, culture, region: value, type, sort });
              }}
              style={{ width: '100%' }}
              options={[...new Set(newsFeed.map((item) => item.region))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={3}>
            <Select
              allowClear
              placeholder="Тип"
              value={type}
              onChange={(value) => {
                setType(value);
                syncParams({ section, country, culture, region, type: value, sort });
              }}
              style={{ width: '100%' }}
              options={[...new Set(newsFeed.map((item) => item.type))].map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={12} xl={3}>
            <Select
              value={sort}
              onChange={(value) => {
                setSort(value);
                syncParams({ section, country, culture, region, type, sort: value });
              }}
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
          {section && <Tag closable onClose={() => { setSection(undefined); syncParams({ country, culture, region, type, sort }); }}>{section}</Tag>}
          {country && <Tag closable onClose={() => { setCountry(undefined); syncParams({ section, culture, region, type, sort }); }}>{country}</Tag>}
          {culture && <Tag closable onClose={() => { setCulture(undefined); syncParams({ section, country, region, type, sort }); }}>{culture}</Tag>}
          {region && <Tag closable onClose={() => { setRegion(undefined); syncParams({ section, country, culture, type, sort }); }}>{region}</Tag>}
          {type && <Tag closable onClose={() => { setType(undefined); syncParams({ section, country, culture, region, sort }); }}>{type}</Tag>}
        </Space>
      </Card>

      <Card title="Главная новость дня" className="headline-card clickable-card" onClick={() => navigate(`/news/${headline.id}`)} role="button" tabIndex={0}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} xl={11}>
            <img src={headline.imageUrl ?? newsImageMap[headline.id]} alt={headline.title} className="news-image-large" />
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
                <Button onClick={(e) => e.stopPropagation()}>Сохранить</Button>
                <Button onClick={(e) => e.stopPropagation()}>Подписаться на тему</Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card title="Лента материалов">
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          {filtered.map((item) => (
            <Card key={item.id} className="nested-card clickable-card" onClick={() => navigate(`/news/${item.id}`)} role="button" tabIndex={0}>
              <Row gutter={[14, 14]}>
                <Col xs={24} md={8} xl={6}>
                  <img src={item.imageUrl ?? newsImageMap[item.id]} alt={item.title} className="news-image-thumb" />
                </Col>
                <Col xs={24} md={16} xl={18}>
                  <Space direction="vertical" size={5} style={{ width: '100%' }}>
                    <Space>
                      <Tag>{item.section}</Tag>
                      <Tag color="blue">{item.culture}</Tag>
                      <Tag>{item.region}</Tag>
                      <Typography.Text type="secondary">{item.date}</Typography.Text>
                    </Space>
                    <Typography.Title level={4}>{item.title}</Typography.Title>
                    <Typography.Paragraph>{item.lead}</Typography.Paragraph>
                    <Space>
                      <Button type="primary" onClick={(e) => { e.stopPropagation(); navigate(`/news/${item.id}`); }}>Открыть</Button>
                      <Button onClick={(e) => e.stopPropagation()}>Сохранить</Button>
                      <Button onClick={(e) => e.stopPropagation()}>Подписаться на тему</Button>
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
  const current = newsFeed.find((item) => item.id === newsId) ?? newsFeed[0];
  const related = newsFeed.filter((item) => item.id !== current.id).slice(0, 3);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card>
        <Typography.Link onClick={() => navigate('/news')}>Новости</Typography.Link>
        <Typography.Title level={1}>{current.title}</Typography.Title>
        <Space>
          <Typography.Text type="secondary">{current.date}</Typography.Text>
          <Typography.Text type="secondary">Источник: {current.source}</Typography.Text>
          <Tag>{current.culture}</Tag>
          <Tag>{current.country}</Tag>
        </Space>
        <img src={current.imageUrl ?? newsImageMap[current.id]} alt={current.title} className="news-image-large" style={{ marginTop: 12 }} />
        <Typography.Paragraph className="lead-text">{current.lead}</Typography.Paragraph>
        <Typography.Paragraph>
          Рынок реагирует на изменение экспортной активности и доступности логистики. В материале собраны ключевые
          показатели, комментарии участников торгов и влияние на внутренние цены по регионам.
        </Typography.Paragraph>
        <Typography.Paragraph>
          Дополнительно представлены таблицы и графики динамики цен, а также ссылки на связанные лоты, чтобы
          пользователь мог перейти от новости к практическим действиям в торговом контуре.
        </Typography.Paragraph>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <Card title="Связанные материалы">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {related.map((item) => (
                <Card key={item.id} className="nested-card clickable-card" onClick={() => navigate(`/news/${item.id}`)} role="button" tabIndex={0}>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}><img src={item.imageUrl ?? newsImageMap[item.id]} alt={item.title} className="news-image-thumb" /></Col>
                    <Col xs={24} md={16}>
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <Typography.Paragraph type="secondary">{item.lead}</Typography.Paragraph>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Как это влияет на рынок">
            <Typography.Paragraph>
              Рост экспортной активности усиливает конкуренцию за качественные партии, поддерживает портовые цены и
              повышает значимость своевременной логистики.
            </Typography.Paragraph>
          </Card>
          <Card title="Цены по теме" style={{ marginTop: 16 }}>
            <Space direction="vertical" size={6}>
              <Typography.Text>Пшеница 3 класса: 16 800 ₽/т (+1,3%)</Typography.Text>
              <Typography.Text>Пшеница 4 класса: 15 620 ₽/т (+0,9%)</Typography.Text>
              <Typography.Text>Экспортная цена FOB: 243 USD/т (+0,9%)</Typography.Text>
            </Space>
          </Card>
          <Card title="Действия" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block>Поделиться</Button>
              <Button block type="primary">Подписаться на тему</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

function normalizeSection(value: string) {
  const map: Record<string, string> = {
    main: 'Главные новости',
    russia: 'Новости России',
    world: 'Мировые новости',
    analytics: 'Аналитика',
    press: 'Пресс-релизы',
  };
  return map[value] ?? value;
}

function denormalizeSection(value: string) {
  const map: Record<string, string> = {
    'Главные новости': 'main',
    'Новости России': 'russia',
    'Мировые новости': 'world',
    Аналитика: 'analytics',
    'Пресс-релизы': 'press',
  };
  return map[value] ?? value;
}
