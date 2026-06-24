import {
  BarChartOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { resolveNewsImage } from '../utils/newsImage';

function formatRubles(value: number) {
  return value.toLocaleString('ru-RU');
}

function FeatureCard({
  icon,
  title,
  text,
  variant = 'default',
}: {
  icon: ReactNode;
  title: string;
  text: string;
  variant?: 'default' | 'grain' | 'field' | 'search' | 'market';
}) {
  return (
    <Card className={`home-feature-card home-feature-card--${variant}`}>
      <Space direction="vertical" size={12} align="center" style={{ width: '100%' }}>
        <div className="home-feature-card__icon">{icon}</div>
        <Typography.Text strong className="home-feature-card__title">
          {title}
        </Typography.Text>
        <Typography.Text type="secondary" className="home-feature-card__text">
          {text}
        </Typography.Text>
      </Space>
    </Card>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const news = useAppStore((state) => state.news);
  const prices = useAppStore((state) => state.prices);
  const referenceCatalogs = useAppStore((state) => state.referenceCatalogs);
  const users = useAppStore((state) => state.users);

  const leadLots = [...grainLots.slice(0, 2), ...equipmentLots.slice(0, 2)];
  const latestNews = news.slice(0, 3);
  const routes = referenceCatalogs['routes'] ?? [];

  const mainPrices = prices.slice(0, 4);
  const verifiedCount = users.filter((u) => u.isVerifiedSeller).length;
  const activeLots = grainLots.length + equipmentLots.length;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card home-hero">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={12}>
            <Space direction="vertical" size={16} className="home-hero__copy">
              <Tag color="green" className="home-hero__eyebrow">
                Информационно-торговый портал
              </Tag>
              <Typography.Title level={1} className="home-hero__title">
                Рынок зерна сегодня
              </Typography.Title>
              <Typography.Paragraph className="lead-text home-hero__lead">
                Актуальные цены, активные предложения, логистика и аналитика для эффективных решений в агробизнесе.
              </Typography.Paragraph>
              <Space wrap>
                <Button type="primary" size="large" onClick={() => navigate('/marketplace?tab=grain')}>
                  Смотреть предложения
                </Button>
                <Button size="large" onClick={() => navigate('/analytics')}>
                  Смотреть аналитику
                </Button>
              </Space>
            </Space>
          </Col>

          <Col xs={24} xl={12}>
            <Row gutter={[16, 16]} className="home-hero__features">
              <Col xs={12}>
                <FeatureCard icon={<ShoppingOutlined />} title="Проверенные продавцы" text="Верификация документов и допуск к аукционам" variant="grain" />
              </Col>
              <Col xs={12}>
                <FeatureCard icon={<SearchOutlined />} title="Свежие предложения" text={`${activeLots} лотов зерна, техники и услуг`} variant="search" />
              </Col>
              <Col xs={12}>
                <FeatureCard icon={<BarChartOutlined />} title="Цены и аналитика" text="Данные, обзоры и прогнозы по рынку зерна" variant="field" />
              </Col>
              <Col xs={12}>
                <FeatureCard icon={<TruckOutlined />} title="Логистика" text="Маршруты и тарифы перевозки зерна" variant="market" />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card className="home-split-card">
        <Row gutter={[24, 24]}>
          <Col xs={24} xl={14}>
            <Card
              className="home-news-card"
              title="Главные новости"
              extra={<Button type="link" onClick={() => navigate('/news')}>Смотреть все</Button>}
            >
              <Space direction="vertical" size={0} style={{ width: '100%' }}>
                {latestNews.map((item, index) => (
                  <div key={item.id} className="home-news-item" onClick={() => navigate(`/news/${item.id}`)} role="button" tabIndex={0}>
                    <img src={resolveNewsImage(item, index)} alt={item.title} className="home-news-item__image" />
                    <div className="home-news-item__copy">
                      <Typography.Text strong>{item.title}</Typography.Text>
                      <Typography.Paragraph className="home-news-item__lead">{item.lead}</Typography.Paragraph>
                      <Space wrap size={8}>
                        <Typography.Text type="secondary">{item.date}</Typography.Text>
                        <Tag>{item.section}</Tag>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card className="home-prices-card" title="Сегодня на рынке" extra={<Button type="link" onClick={() => navigate('/prices')}>Все цены</Button>}>
              {mainPrices.length ? (
                <Table
                  size="middle"
                  rowKey="id"
                  pagination={false}
                  dataSource={mainPrices}
                  columns={[
                    { title: 'Культура', dataIndex: 'culture', key: 'culture' },
                    { title: 'Регион', dataIndex: 'region', key: 'region' },
                    {
                      title: 'Цена',
                      dataIndex: 'day',
                      key: 'day',
                      render: (value: number) => `${formatRubles(value)} ₽/т`,
                    },
                    {
                      title: 'За неделю',
                      dataIndex: 'weekChange',
                      key: 'weekChange',
                      render: (value: number) => (
                        <Tag color={value >= 0 ? 'green' : 'red'}>
                          {value > 0 ? '+' : ''}{formatRubles(value)} ₽
                        </Tag>
                      ),
                    },
                  ]}
                />
              ) : (
                <Empty description="Цены загружаются" />
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="home-lots-card" title="Свежие предложения" extra={<Button type="link" onClick={() => navigate('/marketplace')}>Все лоты</Button>}>
        {leadLots.length ? (
          <Row gutter={[16, 16]}>
            {leadLots.map((lot) => (
              <Col key={lot.id} xs={24} lg={12}>
                <Card className="home-lot-card" onClick={() => navigate(`/marketplace/lot/${lot.id}`)}>
                  <Row gutter={[14, 14]} align="middle">
                    <Col xs={24} md={8}>
                      <div className="home-lot-card__media">
                        <img
                          src={lot.coverImageUrl ?? '/images/thematic/image_01.jpg'}
                          alt={lot.title}
                          className="home-lot-card__image"
                        />
                      </div>
                    </Col>
                    <Col xs={24} md={16}>
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color="green">{lot.category === 'grain' ? lot.grainType : lot.brand}</Tag>
                          <Tag color="blue">{lot.region}</Tag>
                          <Tag>{lot.category === 'grain' ? `${lot.grade}` : `${lot.year} г.`}</Tag>
                        </Space>
                        <Typography.Title level={4} className="home-lot-card__title">
                          {lot.title}
                        </Typography.Title>
                        <Typography.Text type="secondary">{lot.description?.slice(0, 120)}</Typography.Text>
                        <Space wrap>
                          <Tag color="green">
                            {lot.category === 'grain' ? `${formatRubles(lot.pricePerTon)} ₽/т` : `${formatRubles(lot.price)} ₽`}
                          </Tag>
                          <Tag color="gold">Проверенный продавец</Tag>
                        </Space>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Предложений пока нет" />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card className="home-rail-card" title="Логистика и маршруты" extra={<Button type="link" onClick={() => navigate('/prices')}>Тарифы</Button>}>
            {routes.length ? (
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {routes.slice(0, 3).map((item) => (
                  <div key={item.id}>
                    <Typography.Text strong>{item.title}</Typography.Text>
                    <Typography.Text type="secondary" style={{ display: 'block' }}>{item.summary}</Typography.Text>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="Маршруты загружаются" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card className="home-rail-card" title="Аналитика и прогнозы">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text>Доступ к ценам, обзорам, сигналам и прогнозам по зерновому рынку.</Typography.Text>
              <Space wrap>
                <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/analytics/tariffs')}>Выбрать тариф</Button>
                <Button onClick={() => navigate('/analytics/demo')}>Пример отчёта</Button>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card className="home-rail-card" title="Проверка участников" extra={<Button type="link" onClick={() => navigate('/seller-verification')}>Подробнее</Button>}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text>{verifiedCount} проверенных продавцов</Typography.Text>
              <Typography.Text type="secondary">Безопасные сделки. Аукционы только для верифицированных участников.</Typography.Text>
              <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/seller-verification')}>Пройти верификацию</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
