import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Empty, Form, Input, List, Row, Select, Space, Statistic, Switch, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { portalApi } from '../services/portalApi';
import { useAppStore } from '../store/appStore';
import type { MarketplaceLot, Order } from '../types/domain';

const sectionMap: Record<string, string> = {
  summary: 'overview',
  lots: 'lots',
  orders: 'orders',
  documents: 'documents',
  settings: 'settings',
  purchases: 'orders',
  sales: 'lots',
};

function subscriptionTitle(plan: string | null, active: boolean) {
  if (!active) return 'Подписка не активна';
  const normalized = plan?.toLowerCase();
  if (normalized === 'corporate' || normalized === 'enterprise') return 'Корпоративный';
  if (normalized === 'professional' || normalized === 'pro' || normalized === 'yearly' || normalized === 'quarterly') return 'Профессиональный';
  return 'Базовый';
}

function verificationLabel(status?: string) {
  if (status === 'approved') return 'Документы подтверждены';
  if (status === 'rejected') return 'Нужны исправления';
  return 'На проверке';
}

function verificationColor(status?: string) {
  if (status === 'approved') return 'green';
  if (status === 'rejected') return 'red';
  return 'gold';
}

function lotPrice(lot: MarketplaceLot) {
  if (lot.category === 'grain') return lot.pricePerTon;
  return lot.price;
}

function lotCategoryLabel(lot: MarketplaceLot) {
  if (lot.category === 'grain') return 'Зерно';
  if (lot.category === 'equipment') return 'Техника';
  return 'Услуга';
}

export function CabinetPage() {
  const navigate = useNavigate();
  const { section: routeSection } = useParams();
  const loadAll = useAppStore((state) => state.loadAll);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const serviceLots = useAppStore((state) => state.serviceLots);
  const orders = useAppStore((state) => state.orders);
  const cart = useAppStore((state) => state.cart);
  const notifications = useAppStore((state) => state.notifications);
  const referenceCatalogs = useAppStore((state) => state.referenceCatalogs);
  const sellerApplications = useAppStore((state) => state.sellerApplications);
  const subscription = useAppStore((state) => state.subscription);
  const [saving, setSaving] = useState(false);

  const currentUser = users.find((item) => item.id === currentUserId);
  const activeSection = sectionMap[routeSection ?? 'summary'] ?? 'overview';
  const allLots = useMemo<MarketplaceLot[]>(() => [...grainLots, ...equipmentLots, ...serviceLots], [equipmentLots, grainLots, serviceLots]);
  const myLots = useMemo(() => allLots.filter((lot) => lot.sellerId === currentUserId), [allLots, currentUserId]);
  const myLotIds = useMemo(() => new Set(myLots.map((lot) => lot.id)), [myLots]);
  const myOrders = useMemo(() => orders.filter((order) => order.userId === currentUserId || order.items.some((item) => myLotIds.has(item.lotId))), [orders, currentUserId, myLotIds]);
  const latestApplication = useMemo(
    () => [...sellerApplications]
      .filter((application) => application.userId === currentUserId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0] ?? null,
    [currentUserId, sellerApplications],
  );
  const documentStatus = currentUser?.isVerifiedSeller ? 'approved' : latestApplication?.status;
  const unread = notifications.filter((item) => !item.viewed).length;

  const sectionButtons = [
    { key: 'overview', label: 'Обзор', path: '/cabinet' },
    { key: 'lots', label: 'Мои лоты', path: '/cabinet/lots' },
    { key: 'orders', label: 'Сделки', path: '/cabinet/orders' },
    { key: 'documents', label: 'Документы', path: '/cabinet/documents' },
    { key: 'settings', label: 'Настройки', path: '/cabinet/settings' },
  ];

  const lotColumns: ColumnsType<MarketplaceLot> = [
    { title: 'Лот', dataIndex: 'title', key: 'title', render: (value, lot) => <Typography.Link onClick={() => navigate(`/marketplace/lot/${lot.id}`)}>{value}</Typography.Link> },
    { title: 'Категория', key: 'category', render: (_, lot) => <Tag>{lotCategoryLabel(lot)}</Tag> },
    { title: 'Регион', dataIndex: 'region', key: 'region' },
    { title: 'Цена', key: 'price', render: (_, lot) => `${lotPrice(lot).toLocaleString('ru-RU')} ₽` },
    { title: 'Дата', dataIndex: 'createdAt', key: 'createdAt', render: (value) => dayjs(value).format('DD.MM.YYYY') },
  ];

  const orderColumns: ColumnsType<Order> = [
    { title: 'Заказ', dataIndex: 'id', key: 'id', render: (value) => <Typography.Link onClick={() => navigate(`/orders/${value}`)}>{String(value).slice(0, 8)}</Typography.Link> },
    { title: 'Позиций', key: 'items', render: (_, order) => order.items.length },
    { title: 'Сумма', dataIndex: 'total', key: 'total', render: (value) => `${Number(value).toLocaleString('ru-RU')} ₽` },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (value) => <Tag color={value === 'paid' ? 'green' : 'blue'}>{value === 'paid' ? 'Оплачен' : value === 'processing' ? 'В работе' : 'Создан'}</Tag> },
    { title: 'Дата', dataIndex: 'createdAt', key: 'createdAt', render: (value) => dayjs(value).format('DD.MM.YYYY') },
  ];

  if (!currentUser) {
    return <Empty description="Войдите, чтобы открыть профиль"><Button type="primary" onClick={() => navigate('/auth')}>Войти</Button></Empty>;
  }

  const submitProfile = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      await portalApi.updateProfile({
        displayName: values.displayName,
        region: values.region,
        farmType: values.farmType,
        inn: values.inn,
        ogrn: values.ogrn,
        preferredLanguage: 'ru',
        twoFactorEnabled: Boolean(values.twoFactorEnabled),
        emailNotificationsEnabled: Boolean(values.emailNotificationsEnabled),
      });
      await loadAll();
      message.success('Профиль сохранён');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card className="section-card">
        <Row gutter={[20, 20]} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size={8}>
              <Typography.Title level={1}>Личный профиль</Typography.Title>
              <Typography.Paragraph className="lead-text">Единый кабинет для покупок, продаж, документов, уведомлений и подписки. Разделения на покупателя и продавца больше нет: один аккаунт может покупать и размещать лоты.</Typography.Paragraph>
              <Space wrap>
                <Tag icon={<UserOutlined />}>{currentUser.name}</Tag>
                <Tag icon={<CrownOutlined />} color={subscription.isActive ? 'green' : 'default'}>{subscriptionTitle(subscription.plan, subscription.isActive)}</Tag>
                {currentUser.role === 'admin' && <Tag color="gold">Администратор</Tag>}
              </Space>
            </Space>
          </Col>
          <Col>
            <Space wrap>
              <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate('/marketplace/create-lot')}>Разместить лот</Button>
              <Button icon={<FileProtectOutlined />} onClick={() => navigate('/seller-verification')}>{documentStatus === 'approved' ? 'Документы подтверждены' : 'Подтвердить документы'}</Button>
              <Button onClick={() => navigate('/analytics/tariffs')}>Подписка</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}><Card><Statistic title="Мои лоты" value={myLots.length} prefix={<ShopOutlined />} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card><Statistic title="Сделки" value={myOrders.length} prefix={<ShoppingCartOutlined />} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card><Statistic title="В корзине" value={cart.length} prefix={<ShoppingCartOutlined />} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card><Statistic title="Новых уведомлений" value={unread} prefix={<BellOutlined />} /></Card></Col>
      </Row>

      <Card>
        <Space wrap>
          {sectionButtons.map((item) => (
            <Button key={item.key} type={activeSection === item.key ? 'primary' : 'default'} onClick={() => navigate(item.path)}>{item.label}</Button>
          ))}
        </Space>
      </Card>

      {activeSection === 'overview' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Card title="Профиль компании">
              <Descriptions column={1} bordered size="small" items={[
                { key: 'name', label: 'Название', children: currentUser.name },
                { key: 'email', label: 'Email', children: currentUser.email },
                { key: 'region', label: 'Регион', children: currentUser.region || 'Не указан' },
                { key: 'farmType', label: 'Тип деятельности', children: currentUser.farmType || 'Не указан' },
                { key: 'inn', label: 'ИНН', children: currentUser.inn || 'Не указан' },
                { key: 'ogrn', label: 'ОГРН', children: currentUser.ogrn || 'Не указан' },
              ]} />
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card title="Подписка на аналитику">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Typography.Title level={3}>{subscriptionTitle(subscription.plan, subscription.isActive)}</Typography.Title>
                {subscription.isActive ? <Typography.Text>Действует до {subscription.expiresAt ? dayjs(subscription.expiresAt).format('DD.MM.YYYY') : '—'}</Typography.Text> : <Typography.Text type="secondary">Приобретите подписку, чтобы открыть закрытые таблицы, сигналы и отчёты аналитики.</Typography.Text>}
                <Button type="primary" onClick={() => navigate('/analytics/tariffs')}>{subscription.isActive ? 'Управлять подпиской' : 'Приобрести подписку'}</Button>
              </Space>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Последние уведомления">
              <List dataSource={notifications.slice(0, 5)} locale={{ emptyText: 'Уведомлений пока нет' }} renderItem={(item) => <List.Item><Space><BellOutlined /><Typography.Text>{item.message}</Typography.Text><Typography.Text type="secondary">{dayjs(item.createdAt).format('DD.MM.YYYY HH:mm')}</Typography.Text></Space></List.Item>} />
            </Card>
          </Col>
        </Row>
      )}

      {activeSection === 'lots' && <Card title="Мои лоты" extra={<Button type="primary" onClick={() => navigate('/marketplace/create-lot')}>Разместить лот</Button>}><Table rowKey="id" columns={lotColumns} dataSource={myLots} scroll={{ x: 900 }} locale={{ emptyText: 'Вы ещё не размещали лоты' }} /></Card>}
      {activeSection === 'orders' && <Card title="Сделки и заказы"><Table rowKey="id" columns={orderColumns} dataSource={myOrders} scroll={{ x: 800 }} locale={{ emptyText: 'Сделок пока нет' }} /></Card>}
      {activeSection === 'documents' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title="Подтверждение документов"
              extra={<Tag color={verificationColor(documentStatus)} icon={documentStatus === 'approved' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}>{verificationLabel(documentStatus)}</Tag>}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Typography.Paragraph>
                  Подтвердите реквизиты компании, банковские данные и документы один раз. После отправки заявка попадёт в админ-панель на проверку, а статус обновится в профиле из API.
                </Typography.Paragraph>
                {latestApplication && (
                  <Descriptions column={1} size="small" bordered items={[
                    { key: 'company', label: 'Компания', children: latestApplication.companyName },
                    { key: 'inn', label: 'ИНН', children: latestApplication.inn },
                    { key: 'ogrn', label: 'ОГРН', children: latestApplication.ogrn },
                    { key: 'submitted', label: 'Отправлено', children: dayjs(latestApplication.submittedAt).format('DD.MM.YYYY HH:mm') },
                  ]} />
                )}
                <Space wrap>
                  <Button type="primary" icon={<FileProtectOutlined />} onClick={() => navigate('/seller-verification')}>
                    {documentStatus === 'approved' ? 'Обновить документы' : latestApplication ? 'Продолжить подтверждение' : 'Подтвердить документы'}
                  </Button>
                  <Button onClick={() => navigate('/documents')}>Открыть центр документов</Button>
                </Space>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Документы по сделкам">
              <Empty image={<FileTextOutlined />} description="Документы по сделкам появятся после оформления заказа">
                <Button onClick={() => navigate('/documents')}>Открыть центр документов</Button>
              </Empty>
            </Card>
          </Col>
        </Row>
      )}
      {activeSection === 'settings' && (
        <Card title="Настройки профиля">
          <Form layout="vertical" initialValues={{ displayName: currentUser.name, region: currentUser.region, farmType: currentUser.farmType, inn: currentUser.inn, ogrn: currentUser.ogrn, emailNotificationsEnabled: true, twoFactorEnabled: false }} onFinish={(values) => void submitProfile(values)}>
            <Row gutter={16}>
              <Col xs={24} md={12}><Form.Item name="displayName" label="Название / ФИО" rules={[{ required: true, message: 'Введите название' }]}><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="region" label="Регион"><Select showSearch placeholder="Выберите регион" options={(referenceCatalogs['regions'] ?? []).map((r) => ({ value: r.title, label: r.title }))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} allowClear /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="farmType" label="Тип деятельности"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="inn" label="ИНН"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="ogrn" label="ОГРН"><Input /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="emailNotificationsEnabled" label="Email-уведомления" valuePropName="checked"><Switch /></Form.Item></Col>
              <Col xs={24} md={12}><Form.Item name="twoFactorEnabled" label="Двухфакторная защита" valuePropName="checked"><Switch /></Form.Item></Col>
            </Row>
            <Button type="primary" htmlType="submit" loading={saving}>Сохранить</Button>
          </Form>
        </Card>
      )}
    </Space>
  );
}
