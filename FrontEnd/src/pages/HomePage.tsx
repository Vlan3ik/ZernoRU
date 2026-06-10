import { Button, Card, Col, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { newsImageMap } from '../data/mediaAssets';
import { useAppStore } from '../store/appStore';

function formatRubles(value: number) {
  return value.toLocaleString('ru-RU');
}

function resolveNewsImage(id: string) {
  return newsImageMap[id] ?? newsImageMap['n-1'] ?? '/images/thematic/image_01.jpg';
}

export function HomePage() {
  const navigate = useNavigate();
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const posts = useAppStore((state) => state.posts);
  const news = useAppStore((state) => state.news);
  const prices = useAppStore((state) => state.prices);
  const analytics = useAppStore((state) => state.analytics);

  const heroNews = news[0];
  const leadLots = [...grainLots.slice(0, 2), ...equipmentLots.slice(0, 2)];

  const summaryCards = [
    { title: 'Активные лоты', value: `${grainLots.length + equipmentLots.length}`, note: 'зерно, техника, услуги' },
    { title: 'Новости дня', value: `${news.length}`, note: 'только российский и СНГ рынок' },
    { title: 'Темы форума', value: `${posts.length}`, note: 'обсуждения и ответы' },
    { title: 'Строки цен', value: `${prices.length}`, note: 'обновляемая витрина котировок' },
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
                Главная витрина рынка зерна, цен и сделок
              </Typography.Title>
              <Typography.Paragraph className="lead-text home-hero__lead">
                На одном экране собраны новости, биржевые ориентиры, активные лоты, логистика и аналитика по рынку России и СНГ.
              </Typography.Paragraph>
              <Space wrap>
                <Button type="primary" size="large" onClick={() => navigate('/marketplace?tab=grain')}>
                  Торговая площадка
                </Button>
                <Button size="large" onClick={() => navigate('/news')}>
                  Новости
                </Button>
                <Button size="large" onClick={() => navigate('/prices')}>
                  Цены
                </Button>
              </Space>
            </Space>
          </Col>

          <Col xs={24} xl={12}>
            <Row gutter={[14, 14]} className="home-hero__stats">
              {summaryCards.map((item) => (
                <Col xs={12} key={item.title}>
                  <Card className="home-hero-stat">
                    <Typography.Text type="secondary" className="home-hero-stat__title">
                      {item.title}
                    </Typography.Text>
                    <Typography.Title level={3} className="home-hero-stat__value">
                      {item.value}
                    </Typography.Title>
                    <Typography.Text type="secondary" className="home-hero-stat__note">
                      {item.note}
                    </Typography.Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <Card
            className="home-feature-card"
            title="Главная новость дня"
            extra={<Button type="link" onClick={() => navigate('/news')}>Все новости</Button>}
          >
            {heroNews ? (
              <Row gutter={[18, 18]} align="middle">
                <Col xs={24} md={10}>
                  <img src={resolveNewsImage(heroNews.id)} alt={heroNews.title} className="home-news-image" />
                </Col>
                <Col xs={24} md={14}>
                  <Space direction="vertical" size={10}>
                    <Space wrap>
                      <Tag color="green">{heroNews.section}</Tag>
                      <Tag color="blue">{heroNews.culture}</Tag>
                      <Tag>{heroNews.region}</Tag>
                      <Typography.Text type="secondary">{heroNews.date}</Typography.Text>
                    </Space>
                    <Typography.Title level={3}>{heroNews.title}</Typography.Title>
                    <Typography.Paragraph>{heroNews.lead}</Typography.Paragraph>
                    <Space wrap>
                      <Button type="primary" onClick={() => navigate(`/news/${heroNews.id}`)}>
                        Открыть новость
                      </Button>
                      <Button onClick={() => navigate('/prices')}>
                        Перейти к ценам
                      </Button>
                    </Space>
                  </Space>
                </Col>
              </Row>
            ) : (
              <Typography.Text type="secondary">Новостей пока нет.</Typography.Text>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            className="home-feature-card"
            title="Актуальные цены"
            extra={<Button type="link" onClick={() => navigate('/prices')}>Все котировки</Button>}
          >
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

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={8}>
          <Card className="home-mini-card" title="Торговая площадка" extra={<Button type="link" onClick={() => navigate('/marketplace')}>Открыть</Button>}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text className="home-mini-card__text">
                Проверенные продавцы, документы, логистика и аукционы в одном потоке.
              </Typography.Text>
              <Button block type="primary" onClick={() => navigate('/marketplace?tab=grain')}>
                Смотреть лоты зерна
              </Button>
              <Progress percent={84} strokeColor="#2f6f3e" showInfo={false} />
              <Space wrap>
                <Tag color="green">Проверенные продавцы</Tag>
                <Tag color="blue">Документы</Tag>
                <Tag color="gold">Аукционы</Tag>
              </Space>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="home-mini-card" title="Логистика" extra={<Button type="link" onClick={() => navigate('/logistics')}>Открыть</Button>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Typography.Text>Средний срок доставки по ключевым направлениям</Typography.Text>
              <Progress percent={72} strokeColor="#2f6f3e" />
              <Typography.Text>Срок маршрута ЦФО → ЮФО: 2,4 дня</Typography.Text>
              <Typography.Text>Доля маршрутов без задержек: 81%</Typography.Text>
              <Button onClick={() => navigate('/routes')}>Посмотреть маршруты</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="home-mini-card" title="Форум и аналитика" extra={<Button type="link" onClick={() => navigate('/forum')}>Открыть</Button>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Typography.Text>Активных тем: {posts.length}</Typography.Text>
              <Typography.Text>Новостей с аналитикой: {news.filter((item) => item.section === 'Аналитика').length}</Typography.Text>
              <Typography.Text>Публикаций в этом месяце: {analytics.length}</Typography.Text>
              <Button onClick={() => navigate('/analytics')}>Перейти в аналитику</Button>
            </Space>
          </Card>
        </Col>
      </Row>

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

      <Card className="home-rail-card" title="Биржевые ориентиры и комментарии">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text strong>Биржевые котировки</Typography.Text>
              <Typography.Text>Биржа Санкт-Петербург: пшеница 3 класс — 16 840 ₽/т</Typography.Text>
              <Typography.Text>МосБиржа: кукуруза — 15 120 ₽/т</Typography.Text>
              <Typography.Text>Новороссийск FOB: ячмень — 13 950 ₽/т</Typography.Text>
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
