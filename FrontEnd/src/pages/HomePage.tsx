import {
  BarChartOutlined,
  SearchOutlined,
  ShoppingOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Table, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

function formatRubles(value: number) {
  return value.toLocaleString('ru-RU');
}

function resolveNewsImage(imageUrl?: string) {
  return imageUrl ?? '/images/thematic/image_01.jpg';
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

  const leadLots = [...grainLots.slice(0, 2), ...equipmentLots.slice(0, 2)];
  const latestNews = news.slice(0, 3);
  const railItems = referenceCatalogs['rail-tariffs']?.slice(0, 1) ?? [];

  const heroFeatures = [
    { title: 'Проверенные продавцы', text: 'Мы проверяем продавцов для вашей уверенности', icon: <ShoppingOutlined />, variant: 'grain' as const },
    { title: 'С документами', text: 'Только лоты с полным пакетом документов', icon: <BarChartOutlined />, variant: 'field' as const },
    { title: 'Быстрый поиск', text: 'Удобные фильтры помогают найти лучшее предложение', icon: <SearchOutlined />, variant: 'search' as const },
    { title: 'Зерно / Техника / Услуги', text: 'Широкий выбор категорий для вашего бизнеса', icon: <TruckOutlined />, variant: 'market' as const },
  ];


  const whyCards = [
    { title: 'Проверенные продавцы', text: 'Мы проверяем участников и их документы.', icon: <ShoppingOutlined /> },
    { title: 'Документы и безопасность', text: 'Подтвержденные документы и прозрачные сделки.', icon: <BarChartOutlined /> },
    { title: 'Прямые сделки', text: 'Без посредников и лишних комиссий.', icon: <SearchOutlined /> },
    { title: 'Аналитика рынка', text: 'Актуальные данные, обзоры и прогнозы экспертов.', icon: <TruckOutlined /> },
  ];

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
              {heroFeatures.map((item) => (
                <Col xs={12} key={item.title}>
                  <FeatureCard icon={item.icon} title={item.title} text={item.text} variant={item.variant} />
                </Col>
              ))}
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
                    <img src={resolveNewsImage(item.imageUrl)} alt={item.title} className="home-news-item__image" />
                    <div className="home-news-item__copy">
                      <Space wrap size={8}>
                        <Typography.Text strong>{item.title}</Typography.Text>
                      </Space>
                      <Typography.Paragraph className="home-news-item__lead">{item.lead}</Typography.Paragraph>
                      <Space wrap size={8}>
                        <Typography.Text type="secondary">{item.date}</Typography.Text>
                        <Tag>{item.section}</Tag>
                        <Tag color="green">{index === 0 ? 'news' : item.culture}</Tag>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={10}>
            <Card className="home-prices-card" title="Актуальные цены" extra={<Button type="link" onClick={() => navigate('/prices')}>Все цены</Button>}>
              <Table
                size="middle"
                rowKey="id"
                pagination={false}
                dataSource={prices.slice(0, 5)}
                columns={[
                  { title: 'Культура', dataIndex: 'culture', key: 'culture' },
                  { title: 'Регион', dataIndex: 'region', key: 'region' },
                  {
                    title: 'Цена',
                    dataIndex: 'day',
                    key: 'day',
                    render: (value: number) => `${formatRubles(value)} ₽/т`,
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
          <Col xs={24} md={12} xl={8}>
            <Card className="home-rail-card" title="Индексы" extra={<Button type="link" onClick={() => navigate('/prices')}>Все индексы</Button>}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Typography.Text>Индекс внутреннего рынка ЦФО: {formatRubles(prices[0]?.day ?? 0)} ₽/т</Typography.Text>
                <Typography.Text>Индекс экспортного спроса: 71,2</Typography.Text>
                <Typography.Text>Индекс логистической нагрузки: 58,4</Typography.Text>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12} xl={8}>
            <Card className="home-rail-card" title="Логистика" extra={<Button type="link" onClick={() => navigate('/routes')}>Все маршруты</Button>}>
              {railItems.map((item) => (
                <Space direction="vertical" size={6} key={item.id}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Typography.Text type="secondary">{item.summary}</Typography.Text>
                </Space>
              ))}
            </Card>
          </Col>
        </Row>
      </Card>

      <Card className="home-why-card" title="Почему ЗерноАгроМир">
        <Row gutter={[16, 16]}>
          {whyCards.map((item) => (
            <Col xs={24} md={12} xl={6} key={item.title}>
              <FeatureCard icon={item.icon} title={item.title} text={item.text} />
            </Col>
          ))}
        </Row>
      </Card>

      <Card className="home-lots-card" title="Свежие лоты" extra={<Button type="link" onClick={() => navigate('/marketplace')}>Все лоты</Button>}>
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
                      <Typography.Text type="secondary">{lot.description}</Typography.Text>
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
      </Card>

      <Card className="home-rail-card" title="Рыночные ориентиры и комментарии">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text strong>Ценовые ориентиры</Typography.Text>
              <Typography.Text>Пшеница 3 класса: 16 840 ₽/т</Typography.Text>
              <Typography.Text>Кукуруза: 15 120 ₽/т</Typography.Text>
              <Typography.Text>Ячмень: 13 950 ₽/т</Typography.Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text strong>Индексы</Typography.Text>
              <Typography.Text>Индекс внутреннего рынка ЦФО: 16 840 ₽/т</Typography.Text>
              <Typography.Text>Индекс экспортного спроса: 71,2</Typography.Text>
              <Typography.Text>Индекс логистической нагрузки: 58,4</Typography.Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text strong>Комментарии рынка</Typography.Text>
              <Typography.Text>Экспортная премия по протеину 12,5% сохраняется.</Typography.Text>
              <Typography.Text>В портах растет число заявок на майские отгрузки.</Typography.Text>
              <Typography.Text>Ставки на зерновозы стабилизировались после пика сезона.</Typography.Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}
