import { AuditOutlined, DatabaseOutlined, FileDoneOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Tag, Timeline, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../services/portalApi';
import { useAppStore } from '../store/appStore';

export function AdminPage() {
  const navigate = useNavigate();
  const users = useAppStore((state) => state.users);
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const applications = useAppStore((state) => state.sellerApplications);
  const notifications = useAppStore((state) => state.notifications);
  const currentUser = useMemo(() => users.find((user) => user.role === 'admin') ?? users[0], [users]);
  const [stats, setStats] = useState<{ users: number; grainLots: number; equipmentLots: number; orders: number; notifications: number; sellerApplications: number; news: number; prices: number } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    portalApi.getAdminStats(currentUser.id).then(setStats).catch(() => {
      setStats(null);
    });
  }, [currentUser]);

  const runSync = async () => {
    if (!currentUser) {
      return;
    }

    setSyncing(true);
    try {
      await portalApi.syncContent(currentUser.id);
      const nextStats = await portalApi.getAdminStats(currentUser.id);
      setStats(nextStats);
      message.success('Контент синхронизирован');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось синхронизировать контент');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="hero-card">
        <Tag color="blue">Административный центр</Tag>
        <Typography.Title level={1}>Управление данными, верификацией и контентом</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Здесь собран обзор платформы: пользователи, заявки на верификацию, лоты и события. Интерфейс показывает, что под капотом уже живёт единый портал.
        </Typography.Paragraph>
        <Space wrap>
          <Button type="primary" onClick={() => navigate('/cabinet')}>Перейти в кабинет</Button>
          <Button onClick={() => navigate('/marketplace')}>Открыть площадку</Button>
          <Button icon={<ReloadOutlined />} loading={syncing} onClick={() => void runSync()}>Обновить контент</Button>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12} xl={6}><Card className="metric-card"><Typography.Text className="metric-title">Пользователи</Typography.Text><Typography.Title level={2}>{stats?.users ?? users.length}</Typography.Title></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="metric-card"><Typography.Text className="metric-title">Лоты</Typography.Text><Typography.Title level={2}>{(stats?.grainLots ?? grainLots.length) + (stats?.equipmentLots ?? equipmentLots.length)}</Typography.Title></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="metric-card"><Typography.Text className="metric-title">Заявки</Typography.Text><Typography.Title level={2}>{stats?.sellerApplications ?? applications.length}</Typography.Title></Card></Col>
        <Col xs={24} md={12} xl={6}><Card className="metric-card"><Typography.Text className="metric-title">Уведомления</Typography.Text><Typography.Title level={2}>{stats?.notifications ?? notifications.length}</Typography.Title></Card></Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={14}>
          <Card title="Последние заявки">
            <Timeline
              items={applications.slice(0, 5).map((item) => ({
                color: item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'gold',
                children: (
                  <Space direction="vertical" size={2}>
                    <Typography.Text strong>{item.companyName}</Typography.Text>
                    <Typography.Text type="secondary">
                      {item.inn} · {item.status}
                    </Typography.Text>
                  </Space>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Сводка по пользователю">
            <Space direction="vertical" size={8}>
              <Space><AuditOutlined /><Typography.Text>{currentUser?.name}</Typography.Text></Space>
              <Space><TeamOutlined /><Typography.Text>{currentUser?.region}</Typography.Text></Space>
              <Space><DatabaseOutlined /><Typography.Text>{currentUser?.farmType}</Typography.Text></Space>
              <Space><FileDoneOutlined /><Tag color="green">Платформа готова к администрированию</Tag></Space>
              <Typography.Text type="secondary">
                Новости: {stats?.news ?? '—'} · Цены: {stats?.prices ?? '—'}
              </Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
