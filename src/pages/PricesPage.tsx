import { AreaChartOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { priceRows } from '../data/portalContent';

export function PricesPage() {
  const navigate = useNavigate();
  const [region, setRegion] = useState<string | undefined>();
  const [marketType, setMarketType] = useState<string | undefined>();

  const filtered = useMemo(() => {
    return priceRows.filter((row) => {
      if (region && row.region !== region) return false;
      if (marketType && marketType === 'Экспорт' && row.port === 'Нет') return false;
      return true;
    });
  }, [region, marketType]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Цены и котировки</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Текущая цена, изменение за день, неделю и месяц, графики и таблицы по регионам с фильтрами по каналу
          продаж и типу рынка.
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
              options={[...new Set(priceRows.map((row) => row.region))].map((value) => ({ value, label: value }))}
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
          const dayDelta = row.day - row.week;
          const weekDelta = row.week - row.month;
          return (
            <Col key={row.key} xs={24} md={12} xl={8}>
              <Card className="metric-card" onClick={() => navigate(`/prices/${row.key}`)}>
                <Typography.Text className="metric-title">{row.culture}</Typography.Text>
                <Typography.Title level={2}>{row.day.toLocaleString('ru-RU')} ?/т</Typography.Title>
                <Space>
                  <Tag color={dayDelta >= 0 ? 'green' : 'red'}>День {dayDelta >= 0 ? '+' : ''}{dayDelta.toLocaleString('ru-RU')} ?</Tag>
                  <Tag color={weekDelta >= 0 ? 'blue' : 'red'}>Неделя {weekDelta >= 0 ? '+' : ''}{weekDelta.toLocaleString('ru-RU')} ?</Tag>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card title="Таблица по регионам" extra={<Button type="link" onClick={() => navigate('/prices/archive')}>Открыть архив</Button>}>
        <Table
          rowKey="key"
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
            { title: 'Порт', dataIndex: 'port', key: 'port' },
            {
              title: 'Текущая цена',
              dataIndex: 'day',
              key: 'day',
              sorter: (a, b) => a.day - b.day,
              render: (value: number) => `${value.toLocaleString('ru-RU')} ?/т`,
            },
            {
              title: 'Неделя',
              dataIndex: 'week',
              key: 'week',
              render: (value: number) => `${value.toLocaleString('ru-RU')} ?/т`,
            },
            {
              title: 'Месяц',
              dataIndex: 'month',
              key: 'month',
              render: (value: number) => `${value.toLocaleString('ru-RU')} ?/т`,
            },
            {
              title: 'Детально',
              key: 'action',
              render: (_, row) => (
                <Button type="link" onClick={() => navigate(`/prices/${row.key}`)}>
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
  const row = priceRows.find((item) => item.key === slug) ?? priceRows[0];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card>
        <Typography.Link onClick={() => navigate('/prices')}>Цены и котировки</Typography.Link>
        <Typography.Title level={1}>{row.culture}</Typography.Title>
        <Space wrap>
          <Tag color="green">Текущая цена {row.day.toLocaleString('ru-RU')} ?/т</Tag>
          <Tag color="blue">Неделя {row.week.toLocaleString('ru-RU')} ?/т</Tag>
          <Tag color="default">Месяц {row.month.toLocaleString('ru-RU')} ?/т</Tag>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={15}>
          <Card title="Динамика цены" extra={<AreaChartOutlined />}>
            <div className="mock-chart">
              <Typography.Text>
                График динамики за 30 дней: рост на 4,7%, повышенная волатильность в портовом канале продаж.
              </Typography.Text>
            </div>
          </Card>
          <Card title="Таблица по регионам" style={{ marginTop: 16 }}>
            <Table
              rowKey="key"
              pagination={false}
              dataSource={priceRows}
              columns={[
                { title: 'Культура', dataIndex: 'culture', key: 'culture' },
                { title: 'Регион', dataIndex: 'region', key: 'region' },
                { title: 'Цена', dataIndex: 'day', key: 'day', render: (value: number) => `${value.toLocaleString('ru-RU')} ?/т` },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Связанные новости">
            <Space direction="vertical" size={8}>
              <Typography.Link onClick={() => navigate('/news/n-1')}>Экспорт поддерживает цены в портах</Typography.Link>
              <Typography.Link onClick={() => navigate('/news/n-2')}>Логистика влияет на региональный дисконт</Typography.Link>
              <Typography.Link onClick={() => navigate('/analytics')}>Сценарии на следующий месяц</Typography.Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

