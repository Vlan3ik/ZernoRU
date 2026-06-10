import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Progress, Row, Space, Table, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsImageMap } from '../data/mediaAssets';
import { newsFeed, priceRows } from '../data/portalContent';
import { useAppStore } from '../store/appStore';
import { formatRubles, formatRublesPerTon } from '../utils/format';

export function HomePage() {
  const navigate = useNavigate();
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const posts = useAppStore((state) => state.posts);
  const replies = useAppStore((state) => state.replies);

  const metrics = useMemo(() => {
    const findPrice = (culture: string) => priceRows.find((item) => item.culture === culture) ?? priceRows[0];
    const buildDelta = (current: number, previous: number) => `+${(((current - previous) / previous) * 100).toFixed(1)}%`;

    const wheat3 = findPrice('Пшеница 3 класса');
    const wheat4 = findPrice('Пшеница 4 класса');
    const corn = findPrice('Кукуруза');
    const demandScore = Math.min(99.9, 58.4 + grainLots.length * 4.1 + equipmentLots.length * 2.3 + posts.length * 0.8 + replies.length * 0.35);

    return [
      {
        title: 'Пшеница 3 класс',
        value: wheat3.day,
        unit: ' ₽/т',
        day: buildDelta(wheat3.day, wheat3.week),
        week: buildDelta(wheat3.day, wheat3.month),
      },
      {
        title: 'Пшеница 4 класс',
        value: wheat4.day,
        unit: ' ₽/т',
        day: buildDelta(wheat4.day, wheat4.week),
        week: buildDelta(wheat4.day, wheat4.month),
      },
      {
        title: 'Кукуруза',
        value: corn.day,
        unit: ' ₽/т',
        day: buildDelta(corn.day, corn.week),
        week: buildDelta(corn.day, corn.month),
      },
      {
        title: 'Экспортный спрос',
        value: Number(demandScore.toFixed(1)),
        unit: ' балла',
        day: `+${Math.min(4.5, 0.4 + grainLots.length * 0.2).toFixed(1)}`,
        week: `+${Math.min(8.0, 1.4 + equipmentLots.length * 0.25).toFixed(1)}`,
      },
    ];
  }, [grainLots.length, equipmentLots.length, posts.length, replies.length]);

  const recentReplies = useMemo(
    () => replies.filter((reply) => Date.now() - new Date(reply.createdAt).getTime() <= 24 * 60 * 60 * 1000).length,
    [replies],
  );
  const expertAnswers = useMemo(
    () => replies.filter((reply) => reply.rating >= 4).length + posts.filter((post) => Boolean(post.verifiedAnswer)).length,
    [posts, replies],
  );
  const logisticsLoad = Math.min(96, 48 + grainLots.length * 6 + equipmentLots.length * 3);
  const avgDeliveryDays = (1.6 + grainLots.length * 0.12 + equipmentLots.length * 0.08).toFixed(1);
  const onTimeShare = Math.min(97, 78 + grainLots.length + Math.floor(equipmentLots.length * 0.5));

  return (
    <Space direction="vertical" size={28} style={{ width: '100%' }}>
      <Card className="hero-card">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={14}>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <Tag color="green">Рынок зерна и техники</Tag>
              <Typography.Title level={1}>Понятный вход в торговлю, цены и сделки без лишней бюрократии</Typography.Title>
              <Typography.Paragraph className="lead-text">
                Главная показывает, что происходит с ценами, какие лоты доступны и куда двигаться дальше. Всё построено вокруг одной логики: найти, сравнить, купить и оформить.
              </Typography.Paragraph>
              <Space wrap>
                <Button type="primary" onClick={() => navigate('/marketplace')}>Открыть площадку</Button>
                <Button onClick={() => navigate('/auth')}>Войти в кабинет</Button>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={10}>
            <Row gutter={[12, 12]}>
              {metrics.map((metric) => (
                <Col key={metric.title} xs={24} sm={12}>
                  <Card className="metric-card metric-card--live">
                    <Typography.Text className="metric-title">{metric.title}</Typography.Text>
                    <Typography.Title level={3} className="metric-value">
                      <AnimatedMetricValue value={metric.value} unit={metric.unit} />
                    </Typography.Title>
                    <Space wrap>
                      <Tag color="green">День {metric.day}</Tag>
                      <Tag color="blue">Неделя {metric.week}</Tag>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <Card title="Главные новости" extra={<Button type="link" onClick={() => navigate('/news')}>Смотреть все</Button>}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {newsFeed.slice(0, 4).map((item) => (
                <Card key={item.id} className="nested-card clickable-card" onClick={() => navigate(`/news/${item.id}`)} role="button" tabIndex={0}>
                  <Row gutter={[14, 14]} align="middle">
                    <Col xs={24} md={8}>
                      <img src={item.imageUrl ?? newsImageMap[item.id]} alt={item.title} className="news-image-thumb" />
                    </Col>
                    <Col xs={24} md={16}>
                      <Space direction="vertical" size={4}>
                        <Space>
                          <Tag>{item.section}</Tag>
                          <Typography.Text type="secondary">{item.date}</Typography.Text>
                        </Space>
                        <Typography.Title level={4}>{item.title}</Typography.Title>
                        <Typography.Paragraph>{item.lead}</Typography.Paragraph>
                      </Space>
                    </Col>
                  </Row>
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
                { title: 'Цена', dataIndex: 'day', key: 'day', render: (value: number) => formatRublesPerTon(value) },
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
              <Progress percent={logisticsLoad} strokeColor="#2f6f3e" />
              <Typography.Text>Средний срок доставки по ЦФО: {avgDeliveryDays} дня</Typography.Text>
              <Typography.Text>Доля маршрутов без задержек: {onTimeShare}%</Typography.Text>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Форум и аналитика" extra={<Button type="link" onClick={() => navigate('/forum')}>Смотреть все</Button>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Typography.Text>Активных тем: {posts.length}</Typography.Text>
              <Typography.Text>Новых комментариев за сутки: {recentReplies}</Typography.Text>
              <Typography.Text>Экспертных ответов: {expertAnswers}</Typography.Text>
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
                <Card key={lot.id} className="nested-card clickable-card" onClick={() => navigate(`/marketplace/lot/${lot.id}`)} role="button" tabIndex={0}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Typography.Text strong>{lot.title}</Typography.Text>
                      <Typography.Paragraph type="secondary">{lot.region}</Typography.Paragraph>
                    </Col>
                    <Col>
                      <Typography.Text strong>{formatRublesPerTon(lot.pricePerTon)}</Typography.Text>
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
                <Card key={lot.id} className="nested-card clickable-card" onClick={() => navigate(`/marketplace/lot/${lot.id}`)} role="button" tabIndex={0}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Typography.Text strong>{lot.title}</Typography.Text>
                      <Typography.Paragraph type="secondary">{lot.region}</Typography.Paragraph>
                    </Col>
                    <Col>
                      <Typography.Text strong>{formatRubles(lot.price)}</Typography.Text>
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
    <Card className="nested-card clickable-card" onClick={() => navigate(path)} role="button" tabIndex={0}>
      <Space direction="vertical" size={6}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary">{text}</Typography.Text>
        <Button
          type="link"
          onClick={(event) => {
            event.stopPropagation();
            navigate(path);
          }}
          icon={<ArrowRightOutlined />}
        >
          Перейти
        </Button>
      </Space>
    </Card>
  );
}

function AnimatedMetricValue({ value, unit }: { value: number; unit: string }) {
  const animated = useAnimatedNumber(value, 900);

  return <span>{unit === ' ₽/т' ? `${Math.round(animated).toLocaleString('ru-RU')}${unit}` : `${animated.toFixed(1)}${unit}`}</span>;
}

function useAnimatedNumber(target: number, durationMs: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    let startedAt = 0;

    const step = (timestamp: number) => {
      if (!startedAt) startedAt = timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);

      if (progress < 1) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [durationMs, target]);

  return value;
}
