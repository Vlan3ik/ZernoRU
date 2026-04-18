import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { newsFeed, priceRows } from '../data/portalContent';
import { useAppStore } from '../store/appStore';

const metrics = [
  { title: 'Пшеница 3 класс', value: '16 800 ?/т', day: '+1,3%', week: '+3,8%' },
  { title: 'Пшеница 4 класс', value: '15 620 ?/т', day: '+0,9%', week: '+2,2%' },
  { title: 'Кукуруза', value: '15 120 ?/т', day: '+0,7%', week: '+2,6%' },
  { title: 'Экспортный спрос', value: '71,2', day: '+0,4', week: '+1,9' },
];

export function HomePage() {
  const navigate = useNavigate();
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const posts = useAppStore((state) => state.posts);

  return (
    <Space direction="vertical" size={28} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Рынок зерна сегодня</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Сводка по ценам, активным лотам, логистике и аналитике. Главная отвечает на три вопроса: что происходит,
          по какой цене торгуют и куда перейти дальше.
        </Typography.Paragraph>
        <Row gutter={[16, 16]}>
          {metrics.map((metric) => (
            <Col key={metric.title} xs={24} sm={12} xl={6}>
              <Card className="metric-card">
                <Typography.Text className="metric-title">{metric.title}</Typography.Text>
                <Typography.Title level={3} className="metric-value">{metric.value}</Typography.Title>
                <Space>
                  <Tag color="green">День {metric.day}</Tag>
                  <Tag color="blue">Неделя {metric.week}</Tag>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <Card title="Главные новости" extra={<Button type="link" onClick={() => navigate('/news')}>Смотреть все</Button>}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {newsFeed.slice(0, 4).map((item) => (
                <Card key={item.id} className="nested-card" onClick={() => navigate(`/news/${item.id}`)}>
                  <Space direction="vertical" size={4}>
                    <Space>
                      <Tag>{item.section}</Tag>
                      <Typography.Text type="secondary">{item.date}</Typography.Text>
                    </Space>
                    <Typography.Title level={4}>{item.title}</Typography.Title>
                    <Typography.Paragraph>{item.lead}</Typography.Paragraph>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card title="Актуальные цены" extra={<Button type="link" onClick={() => navigate('/prices')}>Смотреть все</Button>}>
            <Table
              size="middle"
              rowKey="key"
              pagination={false}
              dataSource={priceRows.slice(0, 4)}
              columns={[
                { title: 'Культура', dataIndex: 'culture', key: 'culture' },
                { title: 'Регион', dataIndex: 'region', key: 'region' },
                { title: 'Цена', dataIndex: 'day', key: 'day', render: (value: number) => `${value.toLocaleString('ru-RU')} ?` },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={8}>
          <Card title="Торговая площадка" extra={<Button type="link" onClick={() => navigate('/marketplace')}>Смотреть все</Button>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <QuickLink title="Зерно" text="Фильтры по качеству, объему и условиям сделки." path="/marketplace?tab=grain" />
              <QuickLink title="Техника" text="Каталог машин с документами и условиями лизинга." path="/marketplace?tab=equipment" />
              <QuickLink title="Услуги" text="Перевозка, хранение, лаборатории и страхование." path="/marketplace?tab=services" />
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Логистика" extra={<Button type="link" onClick={() => navigate('/logistics')}>Смотреть все</Button>}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text>Загрузка транспорта по ключевым направлениям</Typography.Text>
              <Progress percent={72} strokeColor="#2f6f3e" />
              <Typography.Text>Средний срок доставки по ЦФО: 2,4 дня</Typography.Text>
              <Typography.Text>Доля маршрутов без задержек: 81%</Typography.Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Форум и аналитика" extra={<Button type="link" onClick={() => navigate('/forum')}>Смотреть все</Button>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Typography.Text>Активных тем: {posts.length}</Typography.Text>
              <Typography.Text>Новых комментариев за сутки: 18</Typography.Text>
              <Typography.Text>Экспертных ответов: 7</Typography.Text>
              <Button onClick={() => navigate('/analytics')}>Открыть аналитику и прогнозы</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <Card title="Новые лоты зерна" extra={<Button type="link" onClick={() => navigate('/marketplace?tab=grain')}>Смотреть все</Button>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {grainLots.map((lot) => (
                <Card key={lot.id} className="nested-card" onClick={() => navigate(`/marketplace/lot/${lot.id}`)}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Typography.Text strong>{lot.title}</Typography.Text>
                      <Typography.Paragraph type="secondary">{lot.region}</Typography.Paragraph>
                    </Col>
                    <Col>
                      <Typography.Text strong>{lot.pricePerTon.toLocaleString('ru-RU')} ?/т</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card title="Новые лоты техники" extra={<Button type="link" onClick={() => navigate('/marketplace?tab=equipment')}>Смотреть все</Button>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {equipmentLots.map((lot) => (
                <Card key={lot.id} className="nested-card" onClick={() => navigate(`/marketplace/lot/${lot.id}`)}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Typography.Text strong>{lot.title}</Typography.Text>
                      <Typography.Paragraph type="secondary">{lot.region}</Typography.Paragraph>
                    </Col>
                    <Col>
                      <Typography.Text strong>{lot.price.toLocaleString('ru-RU')} ?</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

function QuickLink({ title, text, path }: { title: string; text: string; path: string }) {
  const navigate = useNavigate();

  return (
    <Card className="nested-card">
      <Space direction="vertical" size={6}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary">{text}</Typography.Text>
        <Button type="link" onClick={() => navigate(path)} icon={<ArrowRightOutlined />}>
          Перейти
        </Button>
      </Space>
    </Card>
  );
}

