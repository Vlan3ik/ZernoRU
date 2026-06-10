import { CheckCircleOutlined, FileTextOutlined, MessageOutlined, ShoppingOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Form, Input, Row, Segmented, Select, Space, Switch, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { UserProfile } from '../types/domain';

const sections = ['Сводка', 'Профиль', 'Сделки', 'Лоты', 'Документы', 'Подписки', 'Сообщения', 'Настройки'] as const;

export function CabinetPage() {
  const navigate = useNavigate();
  const { section: sectionFromRoute } = useParams();
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const orders = useAppStore((state) => state.orders);
  const notifications = useAppStore((state) => state.notifications);
  const subscription = useAppStore((state) => state.subscription);
  const sellerApplications = useAppStore((state) => state.sellerApplications);
  const updateProfile = useAppStore((state) => state.updateProfile);

  const currentUser = users.find((item) => item.id === currentUserId);
  const [section, setSection] = useState(normalizeSection(sectionFromRoute));

  const summaryCards = useMemo(() => {
    return [
      { title: 'Заказы', value: String(orders.length), hint: 'Активные и завершенные сделки' },
      { title: 'Лоты', value: String(grainLots.length + equipmentLots.length), hint: 'Размещенные предложения' },
      { title: 'Уведомления', value: String(notifications.filter((item) => !item.viewed).length), hint: 'Не просмотренные события' },
      { title: 'Заявки', value: String(sellerApplications.length), hint: 'Верификация и документы' },
    ];
  }, [equipmentLots.length, grainLots.length, notifications, orders.length, sellerApplications.length]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="hero-card">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Tag color="green">Единый кабинет</Tag>
          <Typography.Title level={1}>{currentUser?.name ?? 'Профиль пользователя'}</Typography.Title>
          <Typography.Paragraph className="lead-text">
            Здесь собраны сделки, лоты, документы, подписки и сообщения. Переключатель ролей больше не нужен: один профиль сам показывает нужные сценарии.
          </Typography.Paragraph>
          <Space wrap>
            <Tag color={currentUser?.role === 'admin' ? 'blue' : currentUser?.role === 'seller' ? 'gold' : 'green'}>{currentUser?.role === 'admin' ? 'Админ' : currentUser?.role === 'seller' ? 'Продавец' : 'Покупатель'}</Tag>
            {currentUser?.isVerifiedSeller && <Tag color="success">Проверенный участник</Tag>}
            <Button type="primary" onClick={() => navigate('/marketplace')}>Открыть площадку</Button>
            <Button onClick={() => setSection('Профиль')}>Редактировать профиль</Button>
            <Button onClick={() => navigate('/seller-verification')}>Загрузить документы</Button>
            {(currentUser?.role === 'seller' || currentUser?.role === 'admin') && <Button onClick={() => navigate('/marketplace')}>Опубликовать лот</Button>}
            {currentUser?.role === 'admin' && <Button onClick={() => navigate('/admin')}>Админ-панель</Button>}
          </Space>
        </Space>
      </Card>

      <Card title="Разделы кабинета">
        <Segmented
          value={section}
          onChange={(value) => {
            const next = value as string;
            setSection(next);
            navigate(`/cabinet/${denormalizeSection(next)}`);
          }}
          options={sections.map((item) => ({ label: item, value: item }))}
          block
        />
      </Card>

      <Row gutter={[24, 24]}>
        {summaryCards.map((item) => (
          <Col xs={24} md={12} xl={6} key={item.title}>
            <Card className="metric-card">
              <Typography.Text className="metric-title">{item.title}</Typography.Text>
              <Typography.Title level={2}>{item.value}</Typography.Title>
              <Typography.Text type="secondary">{item.hint}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title={section} extra={<Tag>{currentUser?.region ?? 'Регион не указан'}</Tag>}>
        {section === 'Сводка' && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Card className="nested-card"><Space><CheckCircleOutlined /><Typography.Text>Профиль активен и готов к сделкам</Typography.Text></Space></Card>
            <Card className="nested-card"><Space><ShoppingOutlined /><Typography.Text>Корзина, заказы и оплата доступны из одного места</Typography.Text></Space></Card>
            <Card className="nested-card"><Space><FileTextOutlined /><Typography.Text>Документы и заявки на верификацию доступны в отдельном разделе</Typography.Text></Space></Card>
          </Space>
        )}

        {section === 'Профиль' && currentUser && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Card className="nested-card">
              <Space direction="vertical" size={6}>
                <Typography.Text strong>Тип аккаунта</Typography.Text>
                <Typography.Text>{currentUser.role === 'admin' ? 'Администратор' : currentUser.role === 'seller' ? 'Продавец' : 'Покупатель'}</Typography.Text>
              </Space>
            </Card>
            <Card className="nested-card">
              <Space direction="vertical" size={6}>
                <Typography.Text strong>Организация</Typography.Text>
                <Typography.Text>{currentUser.name}</Typography.Text>
                <Typography.Text type="secondary">{currentUser.farmType}</Typography.Text>
              </Space>
            </Card>
            <Card className="nested-card">
              <Space direction="vertical" size={6}>
                <Typography.Text strong>Регион</Typography.Text>
                <Typography.Text>{currentUser.region}</Typography.Text>
              </Space>
            </Card>
            <Card className="nested-card">
              <Space direction="vertical" size={6}>
                <Typography.Text strong>Документы</Typography.Text>
                <Typography.Text>ИНН: {currentUser.inn ?? 'не указан'}</Typography.Text>
                <Typography.Text>ОГРН: {currentUser.ogrn ?? 'не указан'}</Typography.Text>
              </Space>
            </Card>
          </Space>
        )}

        {section === 'Сделки' && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {orders.length ? orders.map((order) => (
              <Card key={order.id} className="nested-card">
                <Space direction="vertical" size={4}>
                  <Typography.Text strong>Заказ {order.id}</Typography.Text>
                  <Typography.Text type="secondary">{order.items.length} позиций · {order.total.toLocaleString('ru-RU')} ₽</Typography.Text>
                </Space>
              </Card>
            )) : <Empty description="Пока нет заказов" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          </Space>
        )}

        {section === 'Лоты' && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {[...grainLots, ...equipmentLots].map((lot) => (
              <Card key={lot.id} className="nested-card">
                <Space direction="vertical" size={4}>
                  <Typography.Text strong>{lot.title}</Typography.Text>
                  <Typography.Text type="secondary">{lot.region}</Typography.Text>
                </Space>
              </Card>
            ))}
          </Space>
        )}

        {section === 'Документы' && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Card className="nested-card"><Space><FileTextOutlined /><Typography.Text>Сертификаты, заявки и сканы документов готовы к загрузке</Typography.Text></Space></Card>
            <Card className="nested-card"><Space><CheckCircleOutlined /><Typography.Text>Проверка профиля: {currentUser?.isVerifiedSeller ? 'подтверждена' : 'в ожидании'}</Typography.Text></Space></Card>
          </Space>
        )}

        {section === 'Подписки' && (
          <Card className="nested-card">
            <Space direction="vertical" size={6}>
              <Typography.Text strong>Текущая подписка</Typography.Text>
              <Typography.Text>{subscription.isActive ? `${subscription.plan === 'monthly' ? 'Месячный' : 'Годовой'} тариф` : 'Подписка не активна'}</Typography.Text>
            </Space>
          </Card>
        )}

        {section === 'Сообщения' && (
          <Card className="nested-card">
            <Space><MessageOutlined /><Typography.Text>Диалоги по сделкам и вопросам логистики собраны в центре сообщений.</Typography.Text></Space>
          </Card>
        )}

        {section === 'Настройки' && (
          <ProfileSettingsCard currentUser={currentUser} onSave={async (values) => {
            await updateProfile(values);
            message.success('Профиль обновлен');
          }} />
        )}
      </Card>
    </Space>
  );
}

function ProfileSettingsCard({ currentUser, onSave }: { currentUser?: UserProfile; onSave: (values: { displayName: string; region: string; farmType: string; inn?: string; ogrn?: string; preferredLanguage: 'ru' | 'en'; twoFactorEnabled: boolean; emailNotificationsEnabled: boolean }) => Promise<void>; }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const initialValues = useMemo(() => ({
    displayName: currentUser?.name ?? '',
    region: currentUser?.region ?? 'Смоленская область',
    farmType: currentUser?.farmType ?? '',
    inn: currentUser?.inn ?? '',
    ogrn: currentUser?.ogrn ?? '',
    preferredLanguage: currentUser?.preferredLanguage ?? 'ru',
    twoFactorEnabled: currentUser?.twoFactorEnabled ?? false,
    emailNotificationsEnabled: currentUser?.emailNotificationsEnabled ?? true,
  }), [currentUser]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [form, initialValues]);

  return (
    <Card className="nested-card">
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={async (values) => {
          setSaving(true);
          try {
            await onSave(values);
          } finally {
            setSaving(false);
          }
        }}
      >
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="displayName" label="Название профиля" rules={[{ required: true, message: 'Введите название' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="region" label="Регион" rules={[{ required: true, message: 'Введите регион' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="farmType" label="Тип хозяйства" rules={[{ required: true, message: 'Введите тип' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="preferredLanguage" label="Язык интерфейса">
              <Select options={[{ value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }]} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="inn" label="ИНН">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="ogrn" label="ОГРН">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Form.Item name="twoFactorEnabled" valuePropName="checked" label="Двухфакторная защита">
            <Switch />
          </Form.Item>
          <Form.Item name="emailNotificationsEnabled" valuePropName="checked" label="Почтовые уведомления">
            <Switch />
          </Form.Item>
        </Space>

        <Space wrap>
          <Button type="primary" htmlType="submit" loading={saving}>Сохранить профиль</Button>
          <Button onClick={() => form.resetFields()}>Сбросить</Button>
        </Space>
      </Form>
    </Card>
  );
}

function normalizeSection(value?: string) {
  const map: Record<string, string> = {
    summary: 'Сводка',
    profile: 'Профиль',
    deals: 'Сделки',
    lots: 'Лоты',
    documents: 'Документы',
    subscriptions: 'Подписки',
    messages: 'Сообщения',
    settings: 'Настройки',
  };
  return map[value ?? ''] ?? 'Сводка';
}

function denormalizeSection(value: string) {
  const map: Record<string, string> = {
    Сводка: 'summary',
    Профиль: 'profile',
    Сделки: 'deals',
    Лоты: 'lots',
    Документы: 'documents',
    Подписки: 'subscriptions',
    Сообщения: 'messages',
    Настройки: 'settings',
  };
  return map[value] ?? 'summary';
}
