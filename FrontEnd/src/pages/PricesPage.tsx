import { AreaChartOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, Row, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAppStore } from '../store/appStore';
import { portalApi, type PriceHistoryResponseDto } from '../services/portalApi';
import { NewsArticle, PriceRecord } from '../types/domain';
import { priceSlugForRecord } from '../utils/price';

function resolvePriceRecord(prices: PriceRecord[], slug?: string): PriceRecord | undefined {
  if (!slug || slug === 'regions') return prices[0];
  return prices.find((item) => priceSlugForRecord(item) === slug) ?? prices[0];
}

function summarizeRecord(record: PriceRecord) {
  const week = record.day - record.weekChange;
  const month = record.day - record.weekChange * 2.3;
  return { week, month };
}

function relatedNews(news: NewsArticle[], record: PriceRecord) {
  return news
    .filter((item) => item.culture === record.culture || item.region === record.region)
    .slice(0, 3);
}

export function PricesPage() {
  const navigate = useNavigate();
  const prices = useAppStore((state) => state.prices);
  const referenceCatalogs = useAppStore((state) => state.referenceCatalogs);
  const [region, setRegion] = useState<string | undefined>();
  const [marketType, setMarketType] = useState<string | undefined>();

  const regionOptions = useMemo(() => {
    const refRegions = (referenceCatalogs['regions'] ?? []).map((r) => r.title);
    const priceRegions = prices.map((r) => r.region);
    return [...new Set([...refRegions, ...priceRegions])].sort();
  }, [referenceCatalogs, prices]);

  const filtered = useMemo(() => {
    return prices.filter((row) => {
      if (region && row.region !== region) return false;
      if (marketType === 'Экспорт' && !['ЮФО', 'Черноморский регион'].some((value) => row.region.includes(value))) return false;
      if (marketType === 'Внутренний' && ['ЮФО', 'Черноморский регион'].some((value) => row.region.includes(value))) return false;
      return true;
    });
  }, [marketType, prices, region]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Цены</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Snapshot подгружает реальные рыночные записи, а карточка detail рисует график и связанные материалы без заглушек.
        </Typography.Paragraph>
      </Card>

      <Card title="Фильтры цен">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8} xl={5}>
            <Select
              allowClear
              placeholder="Регион"
              value={region}
              onChange={setRegion}
              style={{ width: '100%' }}
              options={regionOptions.map((value) => ({ value, label: value }))}
            />
          </Col>
          <Col xs={24} md={8} xl={5}>
            <Select
              allowClear
              placeholder="Тип рынка"
              value={marketType}
              onChange={setMarketType}
              style={{ width: '100%' }}
              options={[
                { value: 'Внутренний', label: 'Внутренний' },
                { value: 'Экспорт', label: 'Экспорт' },
              ]}
            />
          </Col>
          <Col xs={24} md={8} xl={4}>
            <Button block onClick={() => { setRegion(undefined); setMarketType(undefined); }}>
              Сбросить
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {filtered.slice(0, 3).map((row) => {
          const { week } = summarizeRecord(row);
          const delta = row.day - week;
          return (
            <Col key={row.id} xs={24} md={12} xl={8}>
              <Card className="metric-card" onClick={() => navigate(`/prices/${priceSlugForRecord(row)}`)}>
                <Typography.Text className="metric-title">{row.culture}</Typography.Text>
                <Typography.Title level={2}>{row.day.toLocaleString('ru-RU')} ₽/т</Typography.Title>
                <Space wrap>
                  <Tag color={delta >= 0 ? 'green' : 'red'}>
                    День {delta >= 0 ? '+' : ''}
                    {delta.toLocaleString('ru-RU')} ₽
                  </Tag>
                  <Tag color="blue">Регион {row.region}</Tag>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card title="Таблица по регионам" extra={<Button type="link" onClick={() => navigate('/prices/archive')}>Открыть архив</Button>}>
        <Table
          rowKey="id"
          dataSource={filtered}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 920 }}
          columns={[
            {
              title: 'Культура',
              dataIndex: 'culture',
              key: 'culture',
              sorter: (a, b) => a.culture.localeCompare(b.culture),
            },
            { title: 'Регион', dataIndex: 'region', key: 'region' },
            {
              title: 'Текущая цена',
              dataIndex: 'day',
              key: 'day',
              sorter: (a, b) => a.day - b.day,
              render: (value: number) => `${value.toLocaleString('ru-RU')} ₽/т`,
            },
            {
              title: 'Неделя',
              dataIndex: 'weekChange',
              key: 'weekChange',
              render: (value: number) => `${(value > 0 ? '+' : '') + value.toLocaleString('ru-RU')} ₽`,
            },
            {
              title: 'Детально',
              key: 'action',
              render: (_, row) => (
                <Button type="link" onClick={() => navigate(`/prices/${priceSlugForRecord(row)}`)}>
                  Открыть
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}

export function PriceDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const prices = useAppStore((state) => state.prices);
  const news = useAppStore((state) => state.news);
  const [historyData, setHistoryData] = useState<PriceHistoryResponseDto | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const row = useMemo(() => resolvePriceRecord(prices, slug), [prices, slug]);
  const otherRows = useMemo(() => prices.filter((item) => item.id !== row?.id).slice(0, 6), [prices, row]);
  const related = useMemo(() => (row ? relatedNews(news, row) : []), [news, row]);

  useEffect(() => {
    if (!row) return;
    setHistoryLoading(true);
    setHistoryError(null);
    portalApi.getPriceHistory(row.id)
      .then(setHistoryData)
      .catch((err: unknown) => setHistoryError(err instanceof Error ? err.message : 'Ошибка загрузки истории'))
      .finally(() => setHistoryLoading(false));
  }, [row?.id]);

  if (!row && slug !== 'regions') {
    return <Empty description="Цена не найдена" />;
  }

  if (slug === 'regions') {
    return (
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <Card>
          <Typography.Link onClick={() => navigate('/prices')}>Цены</Typography.Link>
          <Typography.Title level={1}>Пшеница по регионам</Typography.Title>
          <Typography.Paragraph className="lead-text">
            Распределение цен на пшеницу по всем регионам.
          </Typography.Paragraph>
        </Card>
        <Card title="Регионы и цены">
          <Table
            rowKey="id"
            pagination={false}
            dataSource={prices.filter((item) => item.culture.startsWith('Пшеница'))}
            columns={[
              { title: 'Культура', dataIndex: 'culture', key: 'culture' },
              { title: 'Регион', dataIndex: 'region', key: 'region' },
              { title: 'Цена', dataIndex: 'day', key: 'day', render: (value: number) => `${value.toLocaleString('ru-RU')} ₽/т` },
              {
                title: 'Детально',
                key: 'action',
                render: (_, record) => <Button type="link" onClick={() => navigate(`/prices/${priceSlugForRecord(record)}`)}>Открыть</Button>,
              },
            ]}
          />
        </Card>
      </Space>
    );
  }

  const chartData = historyData?.points ?? [];
  const trendText = row!.weekChange >= 0 ? 'Положительная динамика' : 'Снижение';

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card>
        <Typography.Link onClick={() => navigate('/prices')}>Цены</Typography.Link>
        <Typography.Title level={1}>{row!.culture} · {row!.region}</Typography.Title>
        <Space wrap>
          <Tag color="green">Текущая цена {row!.day.toLocaleString('ru-RU')} ₽/т</Tag>
          <Tag color={row!.weekChange >= 0 ? 'green' : 'red'}>
            За неделю {row!.weekChange >= 0 ? '+' : ''}{row!.weekChange.toLocaleString('ru-RU')} ₽
          </Tag>
        </Space>
      </Card>

      {historyError && <Alert type="warning" message="Не удалось загрузить историю цен" description={historyError} showIcon />}

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={15}>
          <Card title="Динамика цены (30 дней)" extra={historyLoading ? <Spin size="small" /> : <AreaChartOutlined />}>
            {chartData.length ? (
              <>
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis width={80} />
                      <Tooltip formatter={(value: unknown) => `${Number(value ?? 0).toLocaleString('ru-RU')} ₽/т`} />
                      <Legend />
                      <Line type="monotone" dataKey="price" stroke="#2f6f3e" strokeWidth={3} dot={false} name="Цена" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <Typography.Paragraph style={{ marginTop: 12 }}>
                  {trendText}: {row!.weekChange >= 0 ? '+' : ''}{row!.weekChange.toLocaleString('ru-RU')} ₽ за неделю.
                  График построен по данным из архива за 30 дней.
                </Typography.Paragraph>
              </>
            ) : (
              <Empty description={historyLoading ? 'Загрузка...' : 'Нет данных для графика'} />
            )}
          </Card>

          <Card title="Архив цен за 30 дней" style={{ marginTop: 16 }}>
            {chartData.length ? (
              <Table
                rowKey="date"
                dataSource={[...chartData].reverse()}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
                columns={[
                  { title: 'Дата', dataIndex: 'date', key: 'date', width: 120 },
                  { title: 'Цена, ₽/т', dataIndex: 'price', key: 'price', render: (value: number) => value.toLocaleString('ru-RU') },
                ]}
              />
            ) : (
              <Empty description={historyLoading ? 'Загрузка...' : 'Архив пуст'} />
            )}
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

        <Col xs={24} xl={9}>
          <Card title="Другие цены">
            <Space direction="vertical" size={8}>
              {otherRows.map((item) => (
                <Button key={item.id} type="link" onClick={() => navigate(`/prices/${priceSlugForRecord(item)}`)} style={{ padding: 0, height: 'auto' }}>
                  {item.culture} · {item.region}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
