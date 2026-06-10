import { AreaChartOutlined, LockOutlined, RiseOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Row, Space, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SubscriptionKpiGrid } from '../components/subscription/SubscriptionKpiGrid';
import { SubscriptionRecommendations } from '../components/subscription/SubscriptionRecommendations';
import { useAppStore } from '../store/appStore';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const subscription = useAppStore((state) => state.subscription);
  const analytics = useAppStore((state) => state.analytics);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Аналитика и прогнозы</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Продуктовый раздел с ценностью: прогнозы цен, индексы по полям, сигналы по посевам, региональная аналитика,
          вебинары и рекомендации по продаже урожая.
        </Typography.Paragraph>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Card title="Ценность подписки" extra={<RiseOutlined />}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card className="nested-card">Прогнозы цен по культурам и регионам</Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="nested-card">Индексы по полям и сигналы по посевам</Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="nested-card">Баланс спроса и предложения</Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="nested-card">Рекомендации по продаже урожая</Card>
              </Col>
            </Row>
          </Card>

          {subscription.isActive ? (
            <>
              <Card title="Живая аналитика" style={{ marginTop: 16 }}>
                <SubscriptionKpiGrid analytics={analytics} />
              </Card>
              <div style={{ marginTop: 16 }}>
                <SubscriptionRecommendations analytics={analytics} />
              </div>
            </>
          ) : (
            <Card title="Демо-аналитика" style={{ marginTop: 16 }}>
              <Space direction="vertical" size={8}>
                <Tag color="gold" icon={<LockOutlined />}>Доступ закрыт без подписки</Tag>
                <Typography.Text>NDVI: 0,63</Typography.Text>
                <Typography.Paragraph type="secondary">
                  NDVI (нормализованный вегетационный индекс) показывает активность растительности.
                  <Typography.Link onClick={() => navigate('/analytics/demo')}> Как считать</Typography.Link>
                </Typography.Paragraph>
                <Typography.Text>SSI: 0,41</Typography.Text>
                <Typography.Paragraph type="secondary">
                  SSI (индекс стрессовых состояний) показывает риск дефицита влаги и перегрева.
                  <Typography.Link onClick={() => navigate('/analytics/demo')}> Как считать</Typography.Link>
                </Typography.Paragraph>
              </Space>
            </Card>
          )}
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Подписка" extra={<AreaChartOutlined />}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Tag color={subscription.isActive ? 'green' : 'gold'}>{subscription.isActive ? 'Активна' : 'Не активна'}</Tag>
              <Typography.Text>Тариф: {subscription.plan === 'yearly' ? 'Годовой' : subscription.plan === 'monthly' ? 'Месячный' : 'Не выбран'}</Typography.Text>
              <Typography.Text>Срок действия: {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString('ru-RU') : 'не задан'}</Typography.Text>
              <Typography.Text>Базовый тариф: 4 900 ₽/мес</Typography.Text>
              <Typography.Text>Профессиональный тариф: 12 900 ₽/мес</Typography.Text>
              <Divider />
              <Button type="primary" block onClick={() => navigate('/analytics/subscription')}>Открыть управление подпиской</Button>
              <Button block onClick={() => navigate('/analytics/tariffs')}>Сравнить тарифы</Button>
              <Button block onClick={() => navigate('/analytics/demo')}>Посмотреть демо</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function SubscriptionPage() {
  return <AnalyticsPage />;
}
