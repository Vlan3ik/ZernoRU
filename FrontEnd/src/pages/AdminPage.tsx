import {
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  GlobalOutlined,
  HomeOutlined,
  LineChartOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { portalApi, type AdminWorkspaceDto } from '../services/portalApi';
import { useAppStore } from '../store/appStore';

const { Sider, Content } = Layout;

type AdminRecord = Record<string, unknown>;
type ModalMode = 'user' | 'lot' | 'news' | 'price' | 'reference' | 'subscription' | 'notification' | 'action';

const adminSections = [
  { key: 'dashboard', path: '/admin', label: 'Рабочий стол', icon: <HomeOutlined /> },
  { key: 'users', path: '/admin/users', label: 'Пользователи', icon: <TeamOutlined /> },
  { key: 'seller-applications', path: '/admin/seller-applications', label: 'Заявки продавцов', icon: <SafetyCertificateOutlined /> },
  { key: 'lots', path: '/admin/lots', label: 'Лоты', icon: <ShopOutlined /> },
  { key: 'auctions', path: '/admin/auctions', label: 'Торги', icon: <ThunderboltOutlined /> },
  { key: 'orders', path: '/admin/orders', label: 'Сделки и заказы', icon: <ShoppingCartOutlined /> },
  { key: 'subscriptions', path: '/admin/subscriptions', label: 'Подписки', icon: <LineChartOutlined /> },
  { key: 'prices', path: '/admin/prices', label: 'Цены и котировки', icon: <BarChartOutlined /> },
  { key: 'analytics', path: '/admin/analytics', label: 'Аналитика', icon: <FileTextOutlined /> },
  { key: 'content', path: '/admin/content', label: 'Новости и контент', icon: <BookOutlined /> },
  { key: 'expert-applications', path: '/admin/expert-applications', label: 'Эксперты форума', icon: <AuditOutlined /> },
  { key: 'forum', path: '/admin/forum', label: 'Форум', icon: <GlobalOutlined /> },
  { key: 'references', path: '/admin/references', label: 'Справочники', icon: <ToolOutlined /> },
  { key: 'notifications', path: '/admin/notifications', label: 'Уведомления', icon: <BellOutlined /> },
  { key: 'settings', path: '/admin/settings', label: 'Настройки и права', icon: <SettingOutlined /> },
  { key: 'audit-log', path: '/admin/audit-log', label: 'Журнал действий', icon: <AuditOutlined /> },
];

function getSectionFromPath(pathname: string) {
  const exact = adminSections.find((item) => item.path === pathname);
  if (exact) return exact.key;
  const byPrefix = adminSections.find((item) => item.path !== '/admin' && pathname.startsWith(`${item.path}/`));
  return byPrefix?.key ?? 'dashboard';
}

function asString(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function asNumber(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRub(value: unknown) {
  return `${Math.round(asNumber(value)).toLocaleString('ru-RU')} ₽`;
}

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = dayjs(String(value));
  return date.isValid() ? date.format('DD.MM.YYYY HH:mm') : String(value);
}

function statusTag(value: unknown) {
  const raw = asString(value, '').toLowerCase();
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'На проверке', color: 'gold' },
    approved: { label: 'Одобрена', color: 'green' },
    rejected: { label: 'Отклонена', color: 'red' },
    active: { label: 'Активен', color: 'green' },
    hidden: { label: 'Скрыт', color: 'default' },
    проверено: { label: 'Проверен', color: 'green' },
    withdrawn: { label: 'Отозвана', color: 'default' },
    created: { label: 'Создан', color: 'blue' },
    paid: { label: 'Оплачен', color: 'green' },
    processing: { label: 'В работе', color: 'gold' },
    ended: { label: 'Завершен', color: 'default' },
    cancelled: { label: 'Отменен', color: 'red' },
    published: { label: 'Опубликован', color: 'green' },
    draft: { label: 'Черновик', color: 'blue' },
    blocked: { label: 'Заблокирован', color: 'red' },
    verified: { label: 'Проверен', color: 'green' },
    new: { label: 'Новый', color: 'blue' },
  };
  const item = map[raw] ?? { label: asString(value), color: 'default' };
  return <Tag color={item.color}>{item.label}</Tag>;
}

function riskTag(value: unknown) {
  const raw = asString(value, '').toLowerCase();
  if (raw.includes('выс') || raw === 'high') return <Tag color="red">Высокий риск</Tag>;
  if (raw.includes('сред') || raw === 'medium') return <Tag color="gold">Средний риск</Tag>;
  if (raw.includes('низ') || raw === 'low') return <Tag color="green">Низкий риск</Tag>;
  return <Tag color="blue">Информационный</Tag>;
}

function subscriptionTag(value: unknown) {
  const raw = asString(value, '').toLowerCase();
  if (!raw || raw === 'none' || raw === 'нет') return <Tag>Нет подписки</Tag>;
  if (raw.includes('corporate') || raw.includes('корп')) return <Tag color="purple">Корпоративный</Tag>;
  if (raw.includes('professional') || raw.includes('проф') || raw.includes('year')) return <Tag color="gold">Профессиональный</Tag>;
  return <Tag color="green">Базовый</Tag>;
}

function categoryLabel(value: unknown) {
  const raw = asString(value, '').toLowerCase();
  if (raw === 'grain') return 'Зерно';
  if (raw === 'equipment') return 'Техника';
  if (raw === 'service') return 'Услуги';
  return asString(value);
}

const adminFieldLabels: Record<string, string> = {
  id: 'ID',
  userId: 'ID пользователя',
  userName: 'Пользователь',
  displayName: 'Имя / название',
  email: 'Email',
  role: 'Роль',
  companyName: 'Компания',
  inn: 'ИНН',
  ogrn: 'ОГРН',
  docPhotoUrl: 'Документ',
  status: 'Статус',
  sellerVerificationStatus: 'Статус верификации',
  isVerifiedSeller: 'Продавец проверен',
  createdAt: 'Создано',
  createdAtUtc: 'Создано',
  updatedAt: 'Обновлено',
  updatedAtUtc: 'Обновлено',
  submittedAt: 'Дата подачи',
  submittedAtUtc: 'Дата подачи',
  reviewedAt: 'Дата проверки',
  reviewerName: 'Проверил',
  title: 'Название',
  description: 'Описание',
  category: 'Категория',
  region: 'Регион',
  price: 'Цена',
  amount: 'Сумма',
  culture: 'Культура',
  className: 'Класс',
  basis: 'Базис',
  source: 'Источник',
  slug: 'Код',
  summary: 'Краткое описание',
  details: 'Описание',
  contacts: 'Контакты',
  plan: 'Тариф',
  period: 'Период',
  isActive: 'Активен',
  isPublished: 'Опубликован',
  expiresAt: 'Действует до',
  expireAt: 'Действует до',
  startedAt: 'Начало',
  startAt: 'Начало',
  lastBid: 'Последняя ставка',
  bidsCount: 'Ставок',
  startingPrice: 'Стартовая цена',
  currentHighestBid: 'Текущий максимум',
  minimumStep: 'Шаг',
  leads: 'Лидов',
  views: 'Просмотры',
  complains: 'Жалобы',
  complaints: 'Жалобы',
  repliesCount: 'Ответов',
  section: 'Раздел',
  lead: 'Лид',
  date: 'Дата',
  country: 'Страна',
  subscription: 'Подписка',
  verificationStatus: 'Статус верификации',
  specialization: 'Специализация',
  experienceYears: 'Стаж',
  experienceSummary: 'Опыт',
  proof: 'Подтверждение',
  contact: 'Контакт',
  authorName: 'Автор',
  content: 'Содержание',
  tags: 'Теги',
  type: 'Тип',
  rating: 'Рейтинг',
  volumeTons: 'Объём, т',
  pricePerTon: 'Цена за тонну',
  qualityScore: 'Индекс качества',
  grainType: 'Тип зерна',
  grade: 'Класс',
  hasOwnTransport: 'Свой транспорт',
  auctionEnabled: 'Аукцион',
  brand: 'Марка',
  year: 'Год выпуска',
  condition: 'Состояние',
  operatingHours: 'Моточасы',
  enginePowerHp: 'Мощность, л.с.',
  ownershipStatus: 'Право собственности',
  serviceType: 'Тип услуги',
  unit: 'Единица тарифа',
  farmType: 'Тип хозяйства',
};

function adminFieldLabel(key: string): string {
  return adminFieldLabels[key] ?? key;
}

function renderAdminFieldValue(key: string, value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') return '—';

  if (typeof value === 'boolean') {
    return value ? <Tag color="green">Да</Tag> : <Tag>Нет</Tag>;
  }

  const raw = String(value);

  // Role mapping
  if (key === 'role' || key === 'Role') {
    if (raw === 'Admin') return 'Администратор';
    if (raw === 'Seller') return 'Продавец';
    if (raw === 'Buyer') return 'Покупатель';
    return raw;
  }

  // Category mapping
  if (key === 'category' || key === 'Category') {
    if (raw === 'grain') return 'Зерно';
    if (raw === 'equipment') return 'Техника';
    if (raw === 'service') return 'Услуги';
    return raw;
  }

  // Plan mapping
  if (key === 'plan' || key === 'Plan') {
    if (raw === 'Basic') return 'Базовый';
    if (raw === 'Professional') return 'Профессиональный';
    if (raw === 'Corporate') return 'Корпоративный';
    return raw;
  }

  // Status or date — use existing helpers
  if (key.toLowerCase().includes('status')) return statusTag(value);
  if (key.toLowerCase().includes('created') || key.toLowerCase().includes('updated') || key.toLowerCase().includes('submitted') || key.toLowerCase().includes('reviewed') || key.toLowerCase().includes('expires') || key.toLowerCase().includes('started')) return asString(formatDate(value));

  if (Array.isArray(value)) return value.join(', ');
  return asString(value);
}

function downloadCsv(name: string, rows: AdminRecord[]) {
  const keys = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  const content = [keys.join(';'), ...rows.map((row) => keys.map((key) => `"${asString(row[key], '').replace(/"/g, '""')}"`).join(';'))].join('\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function useFilteredRows(rows: AdminRecord[], search: string, filters: Record<string, string>) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !q || Object.values(row).some((value) => asString(value, '').toLowerCase().includes(q));
      const matchesFilters = Object.entries(filters).every(([key, value]) => !value || value === 'all' || asString(row[key], '').toLowerCase() === value.toLowerCase());
      return matchesSearch && matchesFilters;
    });
  }, [rows, search, filters]);
}

export function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const currentUser = users.find((user) => user.id === currentUserId);
  const expertApplications = useAppStore((state) => state.forumExpertApplications);
  const referenceCatalogs = useAppStore((state) => state.referenceCatalogs);
  const regionOptions = useMemo(() => {
    const ref = (referenceCatalogs['regions'] ?? []).map((r) => r.title);
    return ref.length ? ref : ['Россия', 'Центральный ФО', 'Южный ФО', 'Приволжский ФО'];
  }, [referenceCatalogs]);
  const [data, setData] = useState<AdminWorkspaceDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<AdminRecord | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [form] = Form.useForm();
  const activeSection = getSectionFromPath(location.pathname);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await portalApi.getAdminWorkspace());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить админ-панель');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') void load();
  }, [currentUser?.role, load]);

  useEffect(() => {
    setSearch('');
    setFilters({});
    setSelected(null);
  }, [activeSection]);

  const openModal = (mode: ModalMode, record?: AdminRecord) => {
    setModalMode(mode);
    setSelected(record ?? null);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    if (mode === 'news' && !record) form.setFieldsValue({ section: 'Новости России', type: 'news', country: 'Россия', culture: 'Пшеница', region: 'Россия', status: 'draft' });
    if (mode === 'price' && !record) form.setFieldsValue({ culture: 'Пшеница', className: '3 класс', region: 'Краснодарский край', basis: 'CPT', source: 'Ручной ввод', status: 'draft' });
    if (mode === 'reference' && !record) form.setFieldsValue({ category: 'cultures', status: 'active', order: 100 });
    if (mode === 'subscription' && record) form.setFieldsValue({ plan: record.planCode ?? record.plan, isActive: true, period: 'month' });
    if (mode === 'notification') form.setFieldsValue({ recipients: 'all', channel: 'cabinet', status: 'draft' });
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
    form.resetFields();
  };

  const runAction = async (action: string, payload: AdminRecord = {}) => {
    await portalApi.runAdminAction({ action, section: activeSection, ...payload });
    message.success('Действие выполнено');
    await load();
  };

  const saveModal = async () => {
    try {
      const values = await form.validateFields();
      if (modalMode === 'user' && selected?.id) {
        await portalApi.updateAdminUser(String(selected.id), values);
        message.success('Пользователь сохранён');
      }
      if (modalMode === 'lot' && selected?.id) {
        await portalApi.updateAdminLot(String(selected.category), String(selected.id), values);
        message.success('Лот сохранён');
      }
      if (modalMode === 'news') {
        if (selected?.id) await portalApi.updateAdminNews(String(selected.id), values);
        else await portalApi.createAdminNews(values);
        message.success('Материал сохранён');
      }
      if (modalMode === 'price') {
        if (selected?.id) await portalApi.updateAdminPrice(String(selected.id), values);
        else await portalApi.createAdminPrice(values);
        message.success('Цена сохранена');
      }
      if (modalMode === 'reference') {
        if (selected?.id) await portalApi.updateAdminReference(String(selected.id), values);
        else await portalApi.createAdminReference(values);
        message.success('Справочник сохранён');
      }
      if (modalMode === 'subscription' && selected?.userId) {
        await portalApi.updateAdminSubscription(String(selected.userId), values);
        message.success('Подписка обновлена');
      }
      if (modalMode === 'notification') {
        await portalApi.sendAdminNotification(values);
        message.success('Уведомление создано');
      }
      if (modalMode === 'action') {
        await portalApi.runAdminAction({ action: values.action, section: activeSection, comment: values.comment, objectId: selected?.id });
        message.success('Административное действие выполнено');
      }
      closeModal();
      await load();
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось сохранить изменения');
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Card className="section-card">
        <Alert type="warning" showIcon message="Админ-панель доступна только администратору" description="Войдите под учетной записью администратора. Для обычного пользователя пункт скрыт в шапке." />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/')}>На главную</Button>
      </Card>
    );
  }

  const tableToolbar = (rows: AdminRecord[], extra?: ReactNode) => (
    <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
      <Col xs={24} lg={8}>
        <Input allowClear prefix={<SearchOutlined />} placeholder="Поиск по таблице" value={search} onChange={(event) => setSearch(event.target.value)} />
      </Col>
      <Col flex="auto"><Space wrap>{extra}</Space></Col>
      <Col>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>Обновить</Button>
          <Button icon={<FileExcelOutlined />} onClick={() => downloadCsv(activeSection, rows)}>Экспорт</Button>
        </Space>
      </Col>
    </Row>
  );

  const kpis = data?.kpis ?? [];
  const tasks = data?.tasks ?? [];
  const activity = data?.activity ?? [];
  const usersRows = useFilteredRows(data?.users ?? [], search, filters);
  const applicationsRows = useFilteredRows(data?.sellerApplications ?? [], search, filters);
  const lotsRows = useFilteredRows(data?.lots ?? [], search, filters);
  const auctionRows = useFilteredRows(data?.auctions ?? [], search, filters);
  const orderRows = useFilteredRows(data?.orders ?? [], search, filters);
  const subscriptionRows = useFilteredRows(data?.subscriptions ?? [], search, filters);
  const priceRows = useFilteredRows(data?.prices ?? [], search, filters);
  const analyticsRows = useFilteredRows(data?.analyticsContent ?? [], search, filters);
  const signalRows = useFilteredRows(data?.analyticsSignals ?? [], search, filters);
  const newsRows = useFilteredRows(data?.news ?? [], search, filters);
  const topicRows = useFilteredRows(data?.forumTopics ?? [], search, filters);
  const replyRows = useFilteredRows(data?.forumReplies ?? [], search, filters);
  const referenceRows = useFilteredRows(data?.references ?? [], search, filters);
  const notificationRows = useFilteredRows(data?.notifications ?? [], search, filters);
  const auditRows = useFilteredRows(data?.auditLog ?? [], search, filters);

  const userColumns: ColumnsType<AdminRecord> = [
    { title: 'Пользователь / компания', dataIndex: 'displayName', fixed: 'left', width: 230 },
    { title: 'Email', dataIndex: 'email', width: 220 },
    { title: 'Телефон', dataIndex: 'phone', width: 150 },
    { title: 'Роль', dataIndex: 'roleLabel', width: 130, render: statusTag },
    { title: 'Регион', dataIndex: 'region', width: 180 },
    { title: 'ИНН', dataIndex: 'inn', width: 130 },
    { title: 'Проверка', dataIndex: 'verificationStatus', width: 150, render: statusTag },
    { title: 'Подписка', dataIndex: 'subscription', width: 170, render: subscriptionTag },
    { title: 'Лоты', dataIndex: 'lotsCount', width: 90 },
    { title: 'Сделки', dataIndex: 'ordersCount', width: 90 },
    { title: 'Дата регистрации', dataIndex: 'createdAt', width: 150, render: formatDate },
    { title: 'Действия', fixed: 'right', width: 210, render: (_, record) => <Space><Button icon={<EyeOutlined />} onClick={() => setSelected(record)}>Открыть</Button><Button icon={<EditOutlined />} onClick={() => openModal('user', record)}>Изменить</Button></Space> },
  ];

  const applicationColumns: ColumnsType<AdminRecord> = [
    { title: 'Компания', dataIndex: 'companyName', fixed: 'left', width: 230 },
    { title: 'ИНН', dataIndex: 'inn', width: 130 },
    { title: 'ОГРН', dataIndex: 'ogrn', width: 150 },
    { title: 'Регион', dataIndex: 'region', width: 180 },
    { title: 'Пользователь', dataIndex: 'userName', width: 200 },
    { title: 'Документы', dataIndex: 'documentsStatus', width: 150, render: statusTag },
    { title: 'Статус', dataIndex: 'status', width: 150, render: statusTag },
    { title: 'Дата подачи', dataIndex: 'submittedAt', width: 150, render: formatDate },
    { title: 'Ответственный', dataIndex: 'assignee', width: 150 },
    { title: 'Действие', fixed: 'right', width: 280, render: (_, record) => <Space wrap><Button onClick={() => setSelected(record)}>Проверить</Button><Button type="primary" onClick={async () => { await portalApi.approveSellerApplication(String(record.id)); message.success('Заявка одобрена'); await load(); }}>Одобрить</Button><Button danger onClick={async () => { await portalApi.rejectSellerApplication(String(record.id)); message.success('Заявка отклонена'); await load(); }}>Отклонить</Button></Space> },
  ];

  const lotColumns: ColumnsType<AdminRecord> = [
    { title: 'Лот', dataIndex: 'title', fixed: 'left', width: 250 },
    { title: 'Категория', dataIndex: 'category', width: 120, render: (value) => <Tag>{categoryLabel(value)}</Tag> },
    { title: 'Продавец', dataIndex: 'sellerName', width: 190 },
    { title: 'Регион', dataIndex: 'region', width: 170 },
    { title: 'Культура / тип', dataIndex: 'cultureOrType', width: 150 },
    { title: 'Объем', dataIndex: 'volume', width: 100 },
    { title: 'Цена', dataIndex: 'price', width: 140, sorter: (a, b) => asNumber(a.price) - asNumber(b.price), render: formatRub },
    { title: 'Формат', dataIndex: 'saleFormat', width: 150 },
    { title: 'Документы', dataIndex: 'documentsStatus', width: 160, render: statusTag },
    { title: 'Публикация', dataIndex: 'publicationStatus', width: 150, render: statusTag },
    { title: 'Дата', dataIndex: 'createdAt', width: 150, render: formatDate },
    { title: 'Действия', fixed: 'right', width: 260, render: (_, record) => <Space wrap><Button onClick={() => setSelected(record)}>Открыть</Button><Button icon={<EditOutlined />} onClick={() => openModal('lot', record)}>Изменить</Button><Button onClick={() => openModal('action', { ...record, action: 'hide-lot' })}>Скрыть</Button></Space> },
  ];

  const auctionColumns: ColumnsType<AdminRecord> = [
    { title: 'Лот', dataIndex: 'lotTitle', fixed: 'left', width: 240 },
    { title: 'Продавец', dataIndex: 'sellerName', width: 190 },
    { title: 'Начальная цена', dataIndex: 'startingPrice', width: 140, render: formatRub },
    { title: 'Текущая ставка', dataIndex: 'currentHighestBid', width: 150, render: formatRub },
    { title: 'Шаг', dataIndex: 'minimumStep', width: 100, render: formatRub },
    { title: 'Ставки', dataIndex: 'bidsCount', width: 100 },
    { title: 'Лидер', dataIndex: 'leadingUserName', width: 170 },
    { title: 'Окончание', dataIndex: 'endsAtUtc', width: 160, render: formatDate },
    { title: 'Статус', dataIndex: 'status', width: 140, render: statusTag },
    { title: 'Действия', fixed: 'right', width: 210, render: (_, record) => <Space><Button onClick={() => setSelected(record)}>Открыть</Button><Button danger onClick={async () => { await portalApi.updateAdminAuction(String(record.id), { status: 'Cancelled' }); await load(); }}>Отменить</Button></Space> },
  ];

  const orderColumns: ColumnsType<AdminRecord> = [
    { title: 'Номер заказа', dataIndex: 'shortId', fixed: 'left', width: 130 },
    { title: 'Покупатель', dataIndex: 'buyerName', width: 200 },
    { title: 'Продавец', dataIndex: 'sellerName', width: 200 },
    { title: 'Позиций', dataIndex: 'itemsCount', width: 100 },
    { title: 'Сумма', dataIndex: 'total', width: 140, render: formatRub },
    { title: 'Оплата', dataIndex: 'paymentMethod', width: 150 },
    { title: 'Доставка', dataIndex: 'deliveryMode', width: 180 },
    { title: 'Статус', dataIndex: 'status', width: 170, render: (_, record) => <Select value={asString(record.status)} style={{ width: 150 }} options={[{ value: 'Created', label: 'Создан' }, { value: 'Paid', label: 'Оплачен' }, { value: 'Processing', label: 'В работе' }]} onChange={async (status) => { await portalApi.updateAdminOrder(String(record.id), { status }); await load(); }} /> },
    { title: 'Дата', dataIndex: 'createdAt', width: 150, render: formatDate },
    { title: 'Действия', fixed: 'right', width: 140, render: (_, record) => <Button onClick={() => setSelected(record)}>Открыть</Button> },
  ];

  const subscriptionColumns: ColumnsType<AdminRecord> = [
    { title: 'Пользователь / компания', dataIndex: 'displayName', fixed: 'left', width: 240 },
    { title: 'Тариф', dataIndex: 'plan', width: 170, render: subscriptionTag },
    { title: 'Период', dataIndex: 'period', width: 120 },
    { title: 'Статус', dataIndex: 'status', width: 130, render: statusTag },
    { title: 'Начало', dataIndex: 'startedAt', width: 150, render: formatDate },
    { title: 'Окончание', dataIndex: 'expiresAt', width: 150, render: formatDate },
    { title: 'Автопродление', dataIndex: 'autoRenew', width: 150, render: (value) => value ? <Tag color="green">Включено</Tag> : <Tag>Выключено</Tag> },
    { title: 'Сумма', dataIndex: 'amount', width: 130, render: formatRub },
    { title: 'Действия', fixed: 'right', width: 260, render: (_, record) => <Space wrap><Button onClick={() => openModal('subscription', record)}>Продлить / сменить</Button><Button danger onClick={async () => { await portalApi.updateAdminSubscription(String(record.userId), { isActive: false }); await load(); }}>Отключить</Button></Space> },
  ];

  const priceColumns: ColumnsType<AdminRecord> = [
    { title: 'Культура', dataIndex: 'culture', fixed: 'left', width: 150 },
    { title: 'Класс', dataIndex: 'className', width: 120 },
    { title: 'Регион', dataIndex: 'region', width: 190 },
    { title: 'Базис', dataIndex: 'basis', width: 110 },
    { title: 'Цена, ₽/т', dataIndex: 'price', width: 140, render: formatRub },
    { title: 'Изменение', dataIndex: 'change', width: 120, render: (value) => `${asNumber(value) > 0 ? '+' : ''}${asNumber(value).toLocaleString('ru-RU')} ₽/т` },
    { title: 'Источник', dataIndex: 'source', width: 180 },
    { title: 'Дата обновления', dataIndex: 'updatedAt', width: 160, render: formatDate },
    { title: 'Статус', dataIndex: 'status', width: 140, render: statusTag },
    { title: 'Действия', fixed: 'right', width: 190, render: (_, record) => <Space><Button onClick={() => openModal('price', record)}>Изменить</Button><Button onClick={() => runAction('publish-price', { objectId: record.id })}>Опубликовать</Button></Space> },
  ];

  const newsColumns: ColumnsType<AdminRecord> = [
    { title: 'Заголовок', dataIndex: 'title', fixed: 'left', width: 280 },
    { title: 'Раздел', dataIndex: 'section', width: 170 },
    { title: 'Тип', dataIndex: 'type', width: 130 },
    { title: 'Культура', dataIndex: 'culture', width: 140 },
    { title: 'Регион', dataIndex: 'region', width: 170 },
    { title: 'Автор', dataIndex: 'author', width: 160 },
    { title: 'Статус', dataIndex: 'status', width: 140, render: statusTag },
    { title: 'Дата', dataIndex: 'date', width: 130 },
    { title: 'Просмотры', dataIndex: 'views', width: 120 },
    { title: 'Действия', fixed: 'right', width: 220, render: (_, record) => <Space><Button icon={<EditOutlined />} onClick={() => openModal('news', record)}>Изменить</Button><Popconfirm title="Удалить материал?" onConfirm={async () => { await portalApi.deleteAdminNews(String(record.id)); await load(); }}><Button danger icon={<DeleteOutlined />} /></Popconfirm></Space> },
  ];

  const renderHeader = (title: string, description: string, actions?: React.ReactNode) => (
    <Card className="section-card" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Typography.Title level={1}>{title}</Typography.Title>
          <Typography.Paragraph className="lead-text">{description}</Typography.Paragraph>
        </Col>
        <Col><Space wrap>{actions}</Space></Col>
      </Row>
    </Card>
  );

  const renderDashboard = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Рабочий стол', 'Сводка по пользователям, лотам, сделкам, подпискам и модерации портала.', <><Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>Обновить данные</Button><Button icon={<PlusOutlined />} onClick={() => openModal('news')}>Создать новость</Button><Button icon={<PlusOutlined />} onClick={() => openModal('price')}>Добавить цену</Button><Button type="primary" onClick={() => navigate('/admin/seller-applications')}>Перейти к заявкам</Button></>)}
      <Row gutter={[16, 16]}>
        {kpis.map((item) => <Col xs={24} sm={12} xl={6} key={asString(item.key)}><Card><Statistic title={asString(item.title)} value={asNumber(item.value)} suffix={asString(item.suffix, '')} prefix={item.severity === 'critical' ? <AlertOutlinedTag /> : undefined} valueStyle={{ color: item.severity === 'critical' ? '#cf1322' : item.severity === 'warning' ? '#d48806' : undefined }} /></Card></Col>)}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Задачи администратора" extra={<Button onClick={() => downloadCsv('admin-tasks', tasks)}>Экспорт</Button>}>
            <Table rowKey="id" size="middle" dataSource={tasks} pagination={{ pageSize: 6 }} columns={[
              { title: 'Тип задачи', dataIndex: 'type' },
              { title: 'Объект', dataIndex: 'object' },
              { title: 'Приоритет', dataIndex: 'priority', render: riskTag },
              { title: 'Статус', dataIndex: 'status', render: statusTag },
              { title: 'Ответственный', dataIndex: 'assignee' },
              { title: 'Дата', dataIndex: 'createdAt', render: formatDate },
              { title: 'Действие', render: (_, record) => <Button onClick={() => navigate(String(record.path ?? '/admin'))}>Открыть</Button> },
            ]} />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Активность портала">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={activity}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" name="Регистрации" stroke="currentColor" />
                <Line type="monotone" dataKey="lots" name="Лоты" stroke="currentColor" />
                <Line type="monotone" dataKey="orders" name="Сделки" stroke="currentColor" />
                <Line type="monotone" dataKey="subscriptions" name="Подписки" stroke="currentColor" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </Space>
  );

  const renderUsers = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Пользователи', 'Управление аккаунтами, правами, статусами, подписками и активностью пользователей.')}
      <Card>
        {tableToolbar(usersRows, <><Select allowClear placeholder="Роль" style={{ width: 180 }} onChange={(value) => setFilters((old) => ({ ...old, role: value ?? '' }))} options={[{ value: 'Admin', label: 'Администратор' }, { value: 'Buyer', label: 'Участник' }, { value: 'Seller', label: 'Продавец' }]} /><Select allowClear placeholder="Подписка" style={{ width: 200 }} onChange={(value) => setFilters((old) => ({ ...old, subscription: value ?? '' }))} options={[{ value: 'none', label: 'Нет подписки' }, { value: 'Basic', label: 'Базовый' }, { value: 'Professional', label: 'Профессиональный' }, { value: 'Corporate', label: 'Корпоративный' }]} /></>)}
        <Table rowKey="id" loading={loading} columns={userColumns} dataSource={usersRows} scroll={{ x: 1800 }} />
      </Card>
    </Space>
  );

  const renderApplications = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Заявки продавцов', 'Проверка компаний, документов и допуска к размещению лотов.')}
      <Card>
        {tableToolbar(applicationsRows, <Select allowClear placeholder="Статус" style={{ width: 180 }} onChange={(value) => setFilters((old) => ({ ...old, status: value ?? '' }))} options={[{ value: 'Pending', label: 'На проверке' }, { value: 'Approved', label: 'Одобрена' }, { value: 'Rejected', label: 'Отклонена' }]} />)}
        <Table rowKey="id" loading={loading} columns={applicationColumns} dataSource={applicationsRows} scroll={{ x: 1600 }} />
      </Card>
    </Space>
  );

  const renderLots = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Лоты', 'Модерация, публикация и управление лотами зерна, техники и услуг.')}
      <Card>
        {tableToolbar(lotsRows, <><Select allowClear placeholder="Категория" style={{ width: 180 }} onChange={(value) => setFilters((old) => ({ ...old, category: value ?? '' }))} options={[{ value: 'grain', label: 'Зерно' }, { value: 'equipment', label: 'Техника' }, { value: 'service', label: 'Услуги' }]} /><Select allowClear placeholder="Статус" style={{ width: 180 }} onChange={(value) => setFilters((old) => ({ ...old, publicationStatus: value ?? '' }))} options={[{ value: 'published', label: 'Опубликован' }, { value: 'hidden', label: 'Скрыт' }]} /></>)}
        <Tabs items={[{ key: 'all', label: 'Все лоты', children: <Table rowKey="id" columns={lotColumns} dataSource={lotsRows} loading={loading} scroll={{ x: 1900 }} /> }, { key: 'moderation', label: 'На модерации', children: <Table rowKey="id" columns={lotColumns} dataSource={lotsRows.filter((x) => asString(x.documentsStatus).toLowerCase() !== 'approved')} scroll={{ x: 1900 }} /> }]} />
      </Card>
    </Space>
  );

  const renderAuctions = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Торги', 'Контроль активных аукционов, ставок, победителей и спорных ситуаций.')}
      <Row gutter={[16, 16]}>{['Активные торги', 'Завершенные торги', 'Ставки за период', 'Торги без ставок', 'Спорные торги'].map((title) => <Col xs={24} md={8} xl={5} key={title}><Card><Statistic title={title} value={auctionRows.filter((row) => title.includes('Актив') ? asString(row.status) === 'Active' : title.includes('без') ? asNumber(row.bidsCount) === 0 : true).length} /></Card></Col>)}</Row>
      <Card>{tableToolbar(auctionRows)}<Table rowKey="id" columns={auctionColumns} dataSource={auctionRows} loading={loading} scroll={{ x: 1600 }} /></Card>
    </Space>
  );

  const renderOrders = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Сделки и заказы', 'Контроль оформления заказов, оплат, доставки и статусов.')}
      <Card>{tableToolbar(orderRows, <Select allowClear placeholder="Статус" style={{ width: 180 }} onChange={(value) => setFilters((old) => ({ ...old, status: value ?? '' }))} options={[{ value: 'Created', label: 'Создан' }, { value: 'Paid', label: 'Оплачен' }, { value: 'Processing', label: 'В работе' }]} />)}<Table rowKey="id" columns={orderColumns} dataSource={orderRows} loading={loading} scroll={{ x: 1500 }} /></Card>
    </Space>
  );

  const renderSubscriptions = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Подписки', 'Управление тарифами, пробным доступом и активными подписками пользователей.', <Button type="primary" onClick={() => openModal('subscription', subscriptionRows[0])}>Активировать вручную</Button>)}
      <Row gutter={[16, 16]}>{['Активные подписки', 'Пробный доступ', 'Истекают скоро', 'Истекшие подписки', 'Выручка за период', 'Средний тариф'].map((title) => <Col xs={24} md={8} xl={4} key={title}><Card><Statistic title={title} value={title.includes('Выручка') ? subscriptionRows.reduce((sum, item) => sum + asNumber(item.amount), 0) : title.includes('Сред') ? Math.round(subscriptionRows.reduce((sum, item) => sum + asNumber(item.amount), 0) / Math.max(subscriptionRows.length, 1)) : subscriptionRows.filter((item) => title.includes('Актив') ? asString(item.status) === 'active' : title.includes('Истек') ? asString(item.status) === 'expired' : true).length} formatter={(value) => title.includes('Выручка') || title.includes('Сред') ? formatRub(value) : String(value)} /></Card></Col>)}</Row>
      <Card>{tableToolbar(subscriptionRows)}<Table rowKey="id" columns={subscriptionColumns} dataSource={subscriptionRows} loading={loading} scroll={{ x: 1500 }} /></Card>
    </Space>
  );

  const renderPrices = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Цены и котировки', 'Управление ценами, индексами, биржевыми значениями, пошлинами и импортом данных.', <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('price')}>Добавить цену</Button>)}
      <Tabs items={[
        { key: 'prices', label: 'Цены', children: <Card>{tableToolbar(priceRows)}<Table rowKey="id" columns={priceColumns} dataSource={priceRows} loading={loading} scroll={{ x: 1500 }} /></Card> },
        { key: 'duties', label: 'Пошлины', children: <Card><Table rowKey="id" dataSource={data?.duties ?? []} columns={[{ title: 'Культура', dataIndex: 'culture' }, { title: 'Тип пошлины', dataIndex: 'type' }, { title: 'Значение', dataIndex: 'value' }, { title: 'Период', dataIndex: 'period' }, { title: 'Источник', dataIndex: 'source' }, { title: 'Статус', dataIndex: 'status', render: statusTag }]} /></Card> },
        { key: 'import', label: 'Импорт данных', children: <Card><Alert showIcon type="info" message="Импорт Excel / CSV" description="Загрузка, предпросмотр ошибок и журнал импортов подключены к административному API. Для демо-стенда используйте кнопку проверки." /><Button style={{ marginTop: 16 }} onClick={() => runAction('validate-price-import')}>Проверить импорт</Button></Card> },
      ]} />
    </Space>
  );

  const renderAnalytics = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Аналитика', 'CMS для рыночных обзоров, сигналов, прогнозов, отчетов и тарифных ограничений.', <Button type="primary" onClick={() => openModal('news')}>Создать обзор</Button>)}
      <Tabs items={[
        { key: 'reviews', label: 'Обзоры рынка', children: <Table rowKey="id" dataSource={analyticsRows} columns={newsColumns} scroll={{ x: 1500 }} /> },
        { key: 'signals', label: 'Сигналы по посевам', children: <Table rowKey="id" dataSource={signalRows} columns={[{ title: 'Дата', dataIndex: 'date' }, { title: 'Регион', dataIndex: 'region' }, { title: 'Культура', dataIndex: 'culture' }, { title: 'Тип', dataIndex: 'type' }, { title: 'Риск', dataIndex: 'risk', render: riskTag }, { title: 'Влияние', dataIndex: 'priceImpact' }, { title: 'Статус', dataIndex: 'status', render: statusTag }, { title: 'Источник', dataIndex: 'source' }, { title: 'Действия', render: (_, record) => <Space><Button onClick={() => setSelected(record)}>Открыть</Button><Button onClick={() => runAction('close-signal', { objectId: record.id })}>Закрыть</Button></Space> }]} scroll={{ x: 1300 }} /> },
        { key: 'reports', label: 'Настройки отчетов', children: <Card><Descriptions bordered items={[{ key: 'frequency', label: 'Частота', children: 'Ежедневно / еженедельно' }, { key: 'export', label: 'Экспорт', children: 'Excel и PDF' }, { key: 'access', label: 'Ограничения', children: 'По тарифам Базовый / Профессиональный / Корпоративный' }]} /><Button style={{ marginTop: 16 }} onClick={() => runAction('save-report-settings')}>Сохранить настройки</Button></Card> },
      ]} />
    </Space>
  );

  const renderContent = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Новости и контент', 'Управление новостями, статьями, пресс-релизами, баннерами и медиа.', <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('news')}>Создать материал</Button>)}
      <Card>{tableToolbar(newsRows)}<Table rowKey="id" columns={newsColumns} dataSource={newsRows} loading={loading} scroll={{ x: 1600 }} /></Card>
    </Space>
  );

  const renderForum = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Форум', 'Модерация тем, ответов, жалоб и экспертных статусов.')}
      <Tabs items={[
        { key: 'topics', label: 'Темы', children: <Card>{tableToolbar(topicRows)}<Table rowKey="id" dataSource={topicRows} columns={[{ title: 'Тема', dataIndex: 'title', fixed: 'left', width: 260 }, { title: 'Раздел', dataIndex: 'section' }, { title: 'Автор', dataIndex: 'authorName' }, { title: 'Теги', dataIndex: 'tags', render: (tags) => Array.isArray(tags) ? tags.map((tag) => <Tag key={String(tag)}>{String(tag)}</Tag>) : null }, { title: 'Ответы', dataIndex: 'repliesCount' }, { title: 'Жалобы', dataIndex: 'complaints' }, { title: 'Статус', dataIndex: 'status', render: statusTag }, { title: 'Дата', dataIndex: 'createdAt', render: formatDate }, { title: 'Действия', fixed: 'right', width: 240, render: (_, record) => <Space><Button onClick={() => setSelected(record)}>Открыть</Button><Button onClick={async () => { await portalApi.updateAdminForumTopic(String(record.id), { action: 'pin' }); await load(); }}>Закрепить</Button><Popconfirm title="Удалить тему?" onConfirm={async () => { await portalApi.deleteAdminForumTopic(String(record.id)); await load(); }}><Button danger>Удалить</Button></Popconfirm></Space> }]} scroll={{ x: 1400 }} /></Card> },
        { key: 'replies', label: 'Ответы', children: <Table rowKey="id" dataSource={replyRows} columns={[{ title: 'Тема', dataIndex: 'topicTitle' }, { title: 'Автор', dataIndex: 'authorName' }, { title: 'Ответ', dataIndex: 'content' }, { title: 'Рейтинг', dataIndex: 'rating' }, { title: 'Дата', dataIndex: 'createdAt', render: formatDate }, { title: 'Действия', render: (_, record) => <Popconfirm title="Удалить ответ?" onConfirm={async () => { await portalApi.deleteAdminForumReply(String(record.id)); await load(); }}><Button danger>Удалить</Button></Popconfirm> }]} /> },
      ]} />
    </Space>
  );

  const renderExpertApplications = () => {
    const rows: AdminRecord[] = expertApplications.map((app) => ({
      id: app.id,
      userId: app.userId,
      userName: app.userName,
      section: app.section,
      specialization: app.specialization,
      experienceYears: app.experienceYears,
      experienceSummary: app.experienceSummary,
      proof: app.proof,
      contact: app.contact,
      status: app.status,
      createdAt: app.createdAt,
      reviewedAt: app.reviewedAt ?? '',
      reviewerName: app.reviewerName ?? '',
    }));

    const expertApplicationColumns: ColumnsType<AdminRecord> = [
      { title: 'Пользователь', dataIndex: 'userName', fixed: 'left', width: 180 },
      { title: 'Раздел', dataIndex: 'section', width: 130 },
      { title: 'Специализация', dataIndex: 'specialization', width: 200 },
      { title: 'Стаж', dataIndex: 'experienceYears', width: 80 },
      { title: 'Статус', dataIndex: 'status', width: 130, render: statusTag },
      { title: 'Создана', dataIndex: 'createdAt', width: 160, render: formatDate },
      { title: 'Проверена', dataIndex: 'reviewedAt', width: 160, render: formatDate },
      { title: 'Кто проверил', dataIndex: 'reviewerName', width: 160 },
      { title: 'Действия', fixed: 'right', width: 240, render: (_, record) => (
        <Space wrap>
          <Button
            type="primary"
            size="small"
            disabled={String(record.status) !== 'pending' && String(record.status) !== 'withdrawn'}
            onClick={async () => {
              try { await useAppStore.getState().approveForumExpertApplication(String(record.id)); message.success('Заявка одобрена'); } catch (e) { message.error(e instanceof Error ? e.message : 'Ошибка'); }
            }}
          >Одобрить</Button>
          <Button
            danger
            size="small"
            disabled={String(record.status) !== 'pending'}
            onClick={async () => {
              try { await useAppStore.getState().rejectForumExpertApplication(String(record.id)); message.success('Заявка отклонена'); } catch (e) { message.error(e instanceof Error ? e.message : 'Ошибка'); }
            }}
          >Отклонить</Button>
        </Space>
      )},
    ];

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {renderHeader('Заявки экспертов форума', 'Управление заявками на статус эксперта форума: проверка, одобрение и отклонение.')}
        <Card>
          {tableToolbar(rows)}
          <Table rowKey="id" columns={expertApplicationColumns} dataSource={rows} loading={loading} scroll={{ x: 1400 }} />
        </Card>
      </Space>
    );
  };

  const renderReferences = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Справочники', 'Управление культурами, регионами, классами, базисами, тарифами и другими выпадающими списками.', <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('reference')}>Добавить значение</Button>)}
      <Card>{tableToolbar(referenceRows)}<Table rowKey="id" dataSource={referenceRows} columns={[{ title: 'Название', dataIndex: 'title', fixed: 'left' }, { title: 'Код', dataIndex: 'slug' }, { title: 'Категория', dataIndex: 'category' }, { title: 'Порядок', dataIndex: 'order' }, { title: 'Статус', dataIndex: 'status', render: statusTag }, { title: 'Используется', dataIndex: 'usedIn' }, { title: 'Действия', render: (_, record) => <Button onClick={() => openModal('reference', record)}>Изменить</Button> }]} /></Card>
    </Space>
  );

  const renderNotifications = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Уведомления', 'Системные уведомления, рассылки, шаблоны сообщений и история отправок.', <Button type="primary" icon={<MailOutlined />} onClick={() => openModal('notification')}>Создать уведомление</Button>)}
      <Card>{tableToolbar(notificationRows)}<Table rowKey="id" dataSource={notificationRows} columns={[{ title: 'Тема', dataIndex: 'message', fixed: 'left' }, { title: 'Получатели', dataIndex: 'recipients' }, { title: 'Канал', dataIndex: 'channel' }, { title: 'Статус', dataIndex: 'status', render: statusTag }, { title: 'Дата отправки', dataIndex: 'createdAt', render: formatDate }, { title: 'Открытия', dataIndex: 'opens' }, { title: 'Действия', render: (_, record) => <Button onClick={() => runAction('repeat-notification', { objectId: record.id })}>Повторить</Button> }]} /></Card>
    </Space>
  );

  const renderSettings = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Настройки и права', 'Роли администраторов, матрица прав, интеграции и системные параметры.')}
      <Card title="Матрица прав"><Table rowKey="section" dataSource={data?.roleMatrix ?? []} pagination={false} columns={[{ title: 'Раздел', dataIndex: 'section' }, { title: 'Просмотр', dataIndex: 'view' }, { title: 'Создание', dataIndex: 'create' }, { title: 'Редактирование', dataIndex: 'edit' }, { title: 'Удаление', dataIndex: 'delete' }, { title: 'Публикация', dataIndex: 'publish' }]} /></Card>
      <Card title="Системные параметры"><Descriptions bordered column={1} items={[{ key: 'seed', label: 'Данные', children: 'Все разделы читают актуальные данные из API и БД' }, { key: 'audit', label: 'Журнал', children: 'Важные действия фиксируются в административном журнале API' }, { key: 'roles', label: 'Роли', children: 'Суперадминистратор, модератор, контент-менеджер, аналитик, оператор сделок, финансовый менеджер' }]} /></Card>
    </Space>
  );

  const renderAuditLog = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {renderHeader('Журнал действий', 'История важных действий администраторов: изменения, публикации, удаления и решения по заявкам.')}
      <Card>{tableToolbar(auditRows)}<Table rowKey="id" dataSource={auditRows} columns={[{ title: 'Дата и время', dataIndex: 'createdAt', render: formatDate }, { title: 'Администратор', dataIndex: 'admin' }, { title: 'Раздел', dataIndex: 'section' }, { title: 'Действие', dataIndex: 'action' }, { title: 'Объект', dataIndex: 'object' }, { title: 'Старое значение', dataIndex: 'oldValue' }, { title: 'Новое значение', dataIndex: 'newValue' }, { title: 'IP / устройство', dataIndex: 'device' }, { title: 'Комментарий', dataIndex: 'comment' }]} scroll={{ x: 1500 }} /></Card>
    </Space>
  );

  const renderContentBySection = () => {
    if (activeSection === 'users') return renderUsers();
    if (activeSection === 'seller-applications') return renderApplications();
    if (activeSection === 'lots') return renderLots();
    if (activeSection === 'auctions') return renderAuctions();
    if (activeSection === 'orders') return renderOrders();
    if (activeSection === 'subscriptions') return renderSubscriptions();
    if (activeSection === 'prices') return renderPrices();
    if (activeSection === 'analytics') return renderAnalytics();
    if (activeSection === 'content') return renderContent();
    if (activeSection === 'expert-applications') return renderExpertApplications();
    if (activeSection === 'forum') return renderForum();
    if (activeSection === 'references') return renderReferences();
    if (activeSection === 'notifications') return renderNotifications();
    if (activeSection === 'settings') return renderSettings();
    if (activeSection === 'audit-log') return renderAuditLog();
    return renderDashboard();
  };

  return (
    <Layout style={{ minHeight: 'calc(100vh - 160px)', background: 'transparent' }}>
      <Sider width={292} theme="light" style={{ borderRadius: 20, overflow: 'hidden', marginRight: 20 }}>
        <div style={{ padding: 20, borderBottom: '1px solid #eef1f3' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>Админ-панель</Typography.Title>
          <Typography.Text type="secondary">Рабочее место оператора портала</Typography.Text>
        </div>
        <Menu mode="inline" selectedKeys={[activeSection]} items={adminSections.map((item) => ({ key: item.key, label: item.label, icon: item.icon }))} onClick={({ key }) => navigate(adminSections.find((item) => item.key === key)?.path ?? '/admin')} style={{ borderInlineEnd: 0 }} />
      </Sider>
      <Content>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card size="small" style={{ borderRadius: 16 }}>
            <Row align="middle" gutter={[12, 12]}>
              <Col flex="auto"><Typography.Text strong>Служебная шапка:</Typography.Text> <Typography.Text type="secondary">{currentUser?.name} · администратор · данные обновлены {data?.generatedAt ?? '—'}</Typography.Text></Col>
              <Col><Button icon={<ReloadOutlined />} onClick={() => void load()} loading={loading}>Обновить</Button></Col>
            </Row>
          </Card>
          {error && <Alert type="error" showIcon message="Ошибка загрузки" description={error} />}
          {renderContentBySection()}
        </Space>
      </Content>

      <Drawer title="Карточка объекта" width={720} open={Boolean(selected) && !modalMode} onClose={() => setSelected(null)}>
        {selected && <Descriptions bordered column={1} items={Object.entries(selected).map(([key, value]) => ({ key, label: adminFieldLabel(key), children: renderAdminFieldValue(key, value) }))} />}
      </Drawer>

      <Modal title="Административное действие" open={modalMode === 'action'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="action" label="Действие" initialValue="return-to-revision"><Select options={[{ value: 'hide-lot', label: 'Скрыть лот' }, { value: 'reject-lot', label: 'Отклонить лот' }, { value: 'return-to-revision', label: 'Вернуть на доработку' }, { value: 'request-documents', label: 'Запросить документы' }]} /></Form.Item>
          <Form.Item name="comment" label="Причина / комментарий" rules={[{ required: true, message: 'Укажите причину действия' }]}><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Пользователь" open={modalMode === 'user'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose width={680}>
        <Form form={form} layout="vertical">
          <Form.Item name="displayName" label="Название / ФИО" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}><Input /></Form.Item>
          <Row gutter={12}><Col span={12}><Form.Item name="region" label="Регион"><Select showSearch placeholder="Выберите регион" options={regionOptions.map((r) => ({ value: r, label: r }))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} allowClear /></Form.Item></Col><Col span={12}><Form.Item name="farmType" label="Тип деятельности"><Input /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={12}><Form.Item name="role" label="Права доступа"><Select options={[{ value: 'Buyer', label: 'Участник' }, { value: 'Admin', label: 'Администратор' }]} /></Form.Item></Col><Col span={12}><Form.Item name="isVerifiedSeller" label="Проверенная компания" valuePropName="checked"><Switch checkedChildren="Да" unCheckedChildren="Нет" /></Form.Item></Col></Row>
        </Form>
      </Modal>

      <Modal title="Лот" open={modalMode === 'lot'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose width={720}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Название" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}><Col span={12}><Form.Item name="region" label="Регион"><Select showSearch placeholder="Выберите регион" options={regionOptions.map((r) => ({ value: r, label: r }))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} allowClear /></Form.Item></Col><Col span={12}><Form.Item name="price" label="Цена"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col></Row>
          <Form.Item name="description" label="Описание"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="isPublished" label="Опубликован" valuePropName="checked"><Switch checkedChildren="Да" unCheckedChildren="Нет" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Материал" open={modalMode === 'news'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose width={800}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Заголовок" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="lead" label="Лид" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Row gutter={12}><Col span={12}><Form.Item name="section" label="Раздел"><Select options={['Главные новости', 'Новости России', 'Новости СНГ', 'Аналитика', 'Пресс-релизы'].map((value) => ({ value, label: value }))} /></Form.Item></Col><Col span={12}><Form.Item name="type" label="Тип"><Select options={[{ value: 'news', label: 'Новость' }, { value: 'analytics', label: 'Аналитика' }, { value: 'press', label: 'Пресс-релиз' }]} /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={8}><Form.Item name="country" label="Страна"><Input /></Form.Item></Col><Col span={8}><Form.Item name="culture" label="Культура"><Input /></Form.Item></Col><Col span={8}><Form.Item name="region" label="Регион"><Select showSearch placeholder="Выберите регион" options={regionOptions.map((r) => ({ value: r, label: r }))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} allowClear /></Form.Item></Col></Row>
        </Form>
      </Modal>

      <Modal title="Цена" open={modalMode === 'price'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose width={760}>
        <Form form={form} layout="vertical">
          <Row gutter={12}><Col span={8}><Form.Item name="culture" label="Культура" rules={[{ required: true }]}><Select showSearch options={['Пшеница', 'Кукуруза', 'Ячмень', 'Рожь', 'Овес'].map((value) => ({ value, label: value }))} /></Form.Item></Col><Col span={8}><Form.Item name="className" label="Класс"><Select showSearch options={['3 класс', '4 класс', '5 класс', 'Фураж'].map((value) => ({ value, label: value }))} /></Form.Item></Col><Col span={8}><Form.Item name="basis" label="Базис"><Select options={['EXW', 'CPT', 'FOB', 'Элеватор', 'Порт'].map((value) => ({ value, label: value }))} /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={12}><Form.Item name="region" label="Регион" rules={[{ required: true }]}><Select showSearch placeholder="Выберите регион" options={regionOptions.map((r) => ({ value: r, label: r }))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} /></Form.Item></Col><Col span={12}><Form.Item name="price" label="Цена, ₽/т" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={12}><Form.Item name="change" label="Изменение"><InputNumber style={{ width: '100%' }} /></Form.Item></Col><Col span={12}><Form.Item name="source" label="Источник"><Input /></Form.Item></Col></Row>
        </Form>
      </Modal>

      <Modal title="Справочник" open={modalMode === 'reference'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose width={720}>
        <Form form={form} layout="vertical">
          <Row gutter={12}><Col span={12}><Form.Item name="category" label="Категория" rules={[{ required: true }]}><Select options={[
  { value: 'cultures', label: 'Культуры' },
  { value: 'regions', label: 'Регионы' },
  { value: 'classes', label: 'Классы зерна' },
  { value: 'basis', label: 'Базисы поставки' },
  { value: 'lot-types', label: 'Типы лотов' },
  { value: 'payments', label: 'Способы оплаты' },
  { value: 'delivery', label: 'Доставка' },
  { value: 'routes', label: 'Маршруты' },
  { value: 'rail-tariffs', label: 'Ж/д тарифы' },
  { value: 'subscription-tariffs', label: 'Тарифы подписки' },
]} /></Form.Item></Col><Col span={12}><Form.Item name="title" label="Название" rules={[{ required: true }]}><Input /></Form.Item></Col></Row>
          <Row gutter={12}><Col span={12}><Form.Item name="slug" label="Код"><Input /></Form.Item></Col><Col span={12}><Form.Item name="status" label="Статус"><Select options={[{ value: 'active', label: 'Активен' }, { value: 'hidden', label: 'Скрыт' }]} /></Form.Item></Col></Row>
          <Form.Item name="summary" label="Описание"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Подписка" open={modalMode === 'subscription'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="plan" label="Тариф" rules={[{ required: true }]}><Select options={[{ value: 'Basic', label: 'Базовый' }, { value: 'Professional', label: 'Профессиональный' }, { value: 'Corporate', label: 'Корпоративный' }]} /></Form.Item>
          <Form.Item name="period" label="Период"><Select options={[{ value: 'month', label: 'Месяц' }, { value: 'year', label: 'Год' }, { value: 'trial', label: 'Пробный доступ' }]} /></Form.Item>
          <Form.Item name="expiresAt" label="Дата окончания"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="isActive" label="Активна" valuePropName="checked"><Switch checkedChildren="Да" unCheckedChildren="Нет" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Уведомление" open={modalMode === 'notification'} onCancel={closeModal} onOk={() => void saveModal()} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="message" label="Тема / текст" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="recipients" label="Получатели"><Select options={[{ value: 'all', label: 'Все' }, { value: 'sellers', label: 'Продавцы' }, { value: 'subscribers', label: 'Подписчики' }]} /></Form.Item>
          <Form.Item name="channel" label="Канал"><Select options={[{ value: 'cabinet', label: 'Личный кабинет' }, { value: 'email', label: 'Email' }, { value: 'telegram', label: 'Telegram' }]} /></Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

function AlertOutlinedTag() {
  return <ClockCircleOutlined />;
}
