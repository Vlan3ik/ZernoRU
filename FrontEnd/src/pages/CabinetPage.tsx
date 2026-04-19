import { CheckCircleOutlined, FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Segmented, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

const buyerSections = ['Сводка', 'Мои закупки', 'Заказы', 'Избранное', 'Подписки на цены', 'Сообщения', 'Настройки'] as const;
const sellerSections = ['Сводка', 'Мои зерновые лоты', 'Мои лоты техники', 'Заявки и запросы', 'Документы', 'Проверка продавца', 'Тарифы и услуги', 'Сообщения', 'Настройки'] as const;

export function CabinetPage() {
  const navigate = useNavigate();
  const { section: sectionFromRoute } = useParams();
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const orders = useAppStore((state) => state.orders);

  const currentUser = users.find((item) => item.id === currentUserId);
  const [role, setRole] = useState<'buyer' | 'seller'>(currentUser?.role ?? 'buyer');
  const [section, setSection] = useState(normalizeSection(sectionFromRoute));

  const sections = role === 'buyer' ? buyerSections : sellerSections;

  const sectionCards = useMemo(() => {
    if (role === 'buyer') {
      return [
        { title: 'Открытые закупки', value: String(orders.length), hint: 'Активные заказы в работе' },
        { title: 'Избранные лоты', value: '14', hint: 'Подобранные предложения' },
        { title: 'Подписки на цены', value: '6', hint: 'Культуры и регионы' },
      ];
    }
    return [
      { title: 'Мои зерновые лоты', value: String(grainLots.length), hint: 'Активные публикации' },
      { title: 'Мои лоты техники', value: String(equipmentLots.length), hint: 'Объявления по технике' },
      { title: 'Новые запросы', value: '11', hint: 'Покупатели ждут ответ' },
    ];
  }, [equipmentLots.length, grainLots.length, orders.length, role]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Кабинет</Typography.Title>
        <Typography.Paragraph className="lead-text">Логическое разделение кабинета покупателя и продавца со сменой роли в один клик.</Typography.Paragraph>
        <Space wrap>
          <Segmented
            value={role}
            onChange={(value) => {
              setRole(value as 'buyer' | 'seller');
              setSection('Сводка');
              navigate('/cabinet');
            }}
            options={[{ label: 'Покупатель', value: 'buyer' }, { label: 'Продавец', value: 'seller' }]}
          />
          {role === 'seller' && (
            <>
              <Button type="primary" onClick={() => navigate('/marketplace?tab=grain')}>Разместить лот</Button>
              <Button onClick={() => navigate('/seller-verification')}>Проверка продавца</Button>
            </>
          )}
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
        {sectionCards.map((item) => (
          <Col xs={24} md={12} xl={8} key={item.title}>
            <Card className="metric-card">
              <Typography.Text className="metric-title">{item.title}</Typography.Text>
              <Typography.Title level={2}>{item.value}</Typography.Title>
              <Typography.Text type="secondary">{item.hint}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title={section} extra={<Tag>{role === 'buyer' ? 'Кабинет покупателя' : 'Кабинет продавца'}</Tag>}>
        {section === 'Сводка' && (
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Card className="nested-card"><Space><CheckCircleOutlined /><Typography.Text>Статус профиля: активен</Typography.Text></Space></Card>
            <Card className="nested-card"><Space><FileTextOutlined /><Typography.Text>Документы по сделкам доступны в центре документов</Typography.Text></Space></Card>
            <Card className="nested-card"><Space><SettingOutlined /><Typography.Text>Настройте уведомления по ценам, заказам и сообщениям</Typography.Text></Space></Card>
          </Space>
        )}

        {section !== 'Сводка' && (
          <Empty description="Раздел пока без данных" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => navigate(role === 'buyer' ? '/marketplace' : '/marketplace?tab=grain')}>
              {role === 'buyer' ? 'Перейти в торговую площадку' : 'Создать лот'}
            </Button>
          </Empty>
        )}
      </Card>
    </Space>
  );
}

function normalizeSection(value?: string) {
  const map: Record<string, string> = {
    summary: 'Сводка',
    purchases: 'Мои закупки',
    orders: 'Заказы',
    favorites: 'Избранное',
    subscriptions: 'Подписки на цены',
    messages: 'Сообщения',
    settings: 'Настройки',
    grain: 'Мои зерновые лоты',
    equipment: 'Мои лоты техники',
    requests: 'Заявки и запросы',
    documents: 'Документы',
    verification: 'Проверка продавца',
    tariffs: 'Тарифы и услуги',
  };
  return map[value ?? ''] ?? 'Сводка';
}

function denormalizeSection(value: string) {
  const map: Record<string, string> = {
    Сводка: 'summary',
    'Мои закупки': 'purchases',
    Заказы: 'orders',
    Избранное: 'favorites',
    'Подписки на цены': 'subscriptions',
    Сообщения: 'messages',
    Настройки: 'settings',
    'Мои зерновые лоты': 'grain',
    'Мои лоты техники': 'equipment',
    'Заявки и запросы': 'requests',
    Документы: 'documents',
    'Проверка продавца': 'verification',
    'Тарифы и услуги': 'tariffs',
  };
  return map[value] ?? 'summary';
}
