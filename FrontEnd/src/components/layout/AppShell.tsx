import { BellOutlined, DownOutlined, LoginOutlined, MenuOutlined, LogoutOutlined, SearchOutlined, SafetyCertificateOutlined, CrownOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Col,
  Badge,
  Drawer,
  Dropdown,
  Grid,
  Input,
  Layout,
  Menu,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { ReactNode, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { footerColumns, mainNavigation } from '../../config/portalNavigation';
import { clearSession } from '../../services/session';
import { useAppStore } from '../../store/appStore';
import { priceSlug } from '../../utils/price';

const { Header, Content, Footer } = Layout;
const compactNavigation = mainNavigation.filter((item) => ['home', 'news', 'prices', 'marketplace', 'forum', 'analytics'].includes(item.key));

interface Props {
  children: ReactNode;
}

function getActiveTopMenuKey(pathname: string) {
  const found = compactNavigation.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return found?.key ?? 'home';
}

function shouldShowMarketRail(pathname: string) {
  return pathname === '/';
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function subscriptionLabel(subscription: { isActive: boolean; plan: string | null }) {
  if (!subscription.isActive) return 'Без подписки';
  const plan = subscription.plan?.toLowerCase();
  if (plan === 'corporate' || plan === 'enterprise') return 'Корпоративный';
  if (plan === 'professional' || plan === 'pro' || plan === 'yearly' || plan === 'quarterly') return 'Профессиональный';
  return 'Базовый';
}

function subscriptionColor(subscription: { isActive: boolean; plan: string | null }) {
  if (!subscription.isActive) return 'default';
  const plan = subscription.plan?.toLowerCase();
  if (plan === 'corporate' || plan === 'enterprise') return 'purple';
  if (plan === 'professional' || plan === 'pro' || plan === 'yearly' || plan === 'quarterly') return 'gold';
  return 'green';
}

export function AppShell({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const loadAll = useAppStore((s) => s.loadAll);
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationsRead = useAppStore((s) => s.markNotificationsRead);
  const cart = useAppStore((s) => s.cart);
  const referenceCatalogs = useAppStore((s) => s.referenceCatalogs);
  const news = useAppStore((s) => s.news);
  const prices = useAppStore((s) => s.prices);
  const analytics = useAppStore((s) => s.analytics);
  const subscription = useAppStore((s) => s.subscription);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');

  const currentUser = users.find((user) => user.id === currentUserId);
  const cartQty = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.viewed).length, [notifications]);
  const activeKey = getActiveTopMenuKey(location.pathname);
  const showMarketRail = shouldShowMarketRail(location.pathname);

  const topMenuItems = useMemo(
    () =>
      compactNavigation.map((item) => ({
        key: item.key,
        label: item.label,
        children: item.children.map((child) => ({ key: child.path, label: child.label })),
      })),
    [],
  );

  const profileMenuItems = useMemo(
    () => [
      { key: 'cabinet', label: 'Профиль' },
      ...(currentUser?.role === 'admin' ? [{ key: 'admin', label: 'Админ-панель', icon: <SafetyCertificateOutlined /> }] : []),
      { key: 'orders', label: 'Сделки и заказы' },
      { key: 'cart', label: `Корзина (${cartQty})` },
      { key: 'notifications', label: `Уведомления (${unreadCount})` },
      { key: 'logout', label: 'Выйти', icon: <LogoutOutlined /> },
    ],
    [cartQty, currentUser?.role, unreadCount],
  );

  const onSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleProfileAction = async (key: string) => {
    if (key === 'cabinet') {
      navigate('/cabinet');
      return;
    }
    if (key === 'admin') {
      navigate('/admin');
      return;
    }
    if (key === 'orders') {
      navigate('/orders');
      return;
    }
    if (key === 'cart') {
      navigate('/cart');
      return;
    }
    if (key === 'notifications') {
      setNotifOpen(true);
      markNotificationsRead();
      return;
    }
    if (key === 'logout') {
      clearSession();
      await loadAll();
      navigate('/auth');
    }
  };

  return (
    <Layout className="portal-layout">
      <Header className="portal-header">
        <div className="portal-header__inner">
          <Space size={12} align="center" className="portal-header__brand">
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                className="mobile-menu-button"
                aria-label="Открыть меню"
                onClick={() => setMobileNavOpen(true)}
              />
            )}

            <div className="brand-logo" onClick={() => navigate('/')} role="button" tabIndex={0}>
              <img src="/images/logo-mark.svg" alt="ЗерноАгроМир" className="brand-logo__mark" />
              <div className="brand-logo__text">
                <Typography.Text className="brand-main">ЗерноАгроМир</Typography.Text>
                <Typography.Text className="brand-sub">Информационно-торговый портал</Typography.Text>
              </div>
            </div>
          </Space>

          {!isMobile && (
            <Menu
              mode="horizontal"
              triggerSubMenuAction="hover"
              selectedKeys={[activeKey]}
              items={topMenuItems}
              onClick={(info) => {
                const top = compactNavigation.find((item) => item.key === info.key);
                if (top) {
                  navigate(top.path);
                } else {
                  navigate(String(info.key));
                }
              }}
              className="main-navigation"
            />
          )}

          <Space size={10} className="portal-header__actions" wrap>
            {!isMobile && currentUser?.role === 'admin' && (
              <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/admin')}>
                Админ-панель
              </Button>
            )}

            {!isMobile && (
              <Input.Search
                allowClear
                placeholder="Поиск по рынку, темам и компаниям"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onSearch={onSearch}
                className="global-search"
                enterButton={<SearchOutlined />}
              />
            )}

            {!isMobile && !currentUser && (
              <Button type="primary" icon={<LoginOutlined />} onClick={() => navigate('/auth')} className="auth-button">
                Вход
              </Button>
            )}

            {!isMobile && currentUser && (
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: profileMenuItems,
                  onClick: ({ key }) => {
                    void handleProfileAction(String(key));
                  },
                }}
              >
                <Button className="profile-button" icon={<Avatar size={28}>{initials(currentUser.name)}</Avatar>}>
                  <Space size={8} align="center">
                    <span className="profile-button__name">{currentUser.name}</span>
                    <Tag color={subscriptionColor(subscription)} className="profile-button__tag" icon={subscription.isActive ? <CrownOutlined /> : undefined}>
                      {subscriptionLabel(subscription)}
                    </Tag>
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            )}

            {!isMobile && currentUser && (
              <Badge count={unreadCount} size="small" overflowCount={99} showZero>
                <Button
                  type="text"
                  shape="circle"
                  className="notification-button"
                  icon={<BellOutlined />}
                  aria-label={`Уведомления: ${unreadCount}`}
                  onClick={() => {
                    setNotifOpen(true);
                    markNotificationsRead();
                  }}
                />
              </Badge>
            )}
          </Space>
        </div>
      </Header>

      <Content className="portal-content">
        <div className={`content-grid ${showMarketRail ? 'with-rail' : 'without-rail'}`}>
          <main className="content-main">{children}</main>
          {showMarketRail && <MarketRail onNavigate={navigate} catalogs={referenceCatalogs} news={news} prices={prices} analytics={analytics} />}
        </div>
      </Content>

      <Footer className="portal-footer">
        <Row gutter={[20, 20]} className="portal-footer__grid">
          {footerColumns.map((column) => (
            <Col xs={12} sm={12} lg={4} key={column.title}>
              <Typography.Title level={5} className="portal-footer__title">
                {column.title}
              </Typography.Title>
              <Space direction="vertical" size={6} className="portal-footer__links">
                {column.links.map((link) => (
                  <Typography.Link key={link.path} onClick={() => navigate(link.path)}>
                    {link.label}
                  </Typography.Link>
                ))}
              </Space>
            </Col>
          ))}
          <Col xs={24} sm={12} lg={8}>
            <Card className="footer-contact-card">
              <Space direction="vertical" size={6}>
                <Typography.Text className="footer-contact-card__eyebrow">Есть вопросы?</Typography.Text>
                <Typography.Title level={5} className="footer-contact-card__title">
                  info@zernoagromir.ru
                </Typography.Title>
                <Typography.Text className="footer-contact-card__phone">8 800 550-00-60</Typography.Text>
                <Typography.Text type="secondary">Пн–Пт с 9:00 до 18:00 (мск)</Typography.Text>
              </Space>
            </Card>
          </Col>
        </Row>
      </Footer>

      {isMobile && (
        <div className="mobile-bottom-nav">
          <Button type="text" onClick={() => navigate('/')}>Главная</Button>
          <Button type="text" onClick={() => navigate('/news')}>Новости</Button>
          <Button type="text" onClick={() => navigate('/prices')}>Цены</Button>
          <Button type="text" onClick={() => navigate('/marketplace')}>Маркет</Button>
          <Button type="text" onClick={() => navigate('/cabinet')}>Кабинет</Button>
        </div>
      )}

      <Drawer
        title="Навигация"
        placement="left"
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        width="88vw"
      >
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={topMenuItems}
          onClick={(info) => {
            const top = compactNavigation.find((item) => item.key === info.key);
            if (top) {
              navigate(top.path);
            } else {
              navigate(String(info.key));
            }
            setMobileNavOpen(false);
          }}
        />

        {!currentUser ? (
          <Button type="primary" icon={<LoginOutlined />} block style={{ marginTop: 16 }} onClick={() => navigate('/auth')}>
            Вход
          </Button>
        ) : (
          <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
            {currentUser.role === 'admin' && <Button block icon={<SafetyCertificateOutlined />} onClick={() => navigate('/admin')}>Админ-панель</Button>}
            <Button block onClick={() => navigate('/cabinet')}>
              {currentUser.name} · {subscriptionLabel(subscription)}
            </Button>
          </Space>
        )}
      </Drawer>

      <Drawer
        title="Уведомления"
        placement="right"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        width={isMobile ? '92vw' : 420}
      >
        <Timeline
          items={notifications.map((item) => ({
            color: item.viewed ? 'gray' : 'green',
            children: (
              <Space direction="vertical" size={2}>
                <Typography.Text>{item.message}</Typography.Text>
                <Typography.Text type="secondary">{dayjs(item.createdAt).format('DD.MM.YYYY HH:mm')}</Typography.Text>
              </Space>
            ),
          }))}
        />
      </Drawer>
    </Layout>
  );
}

function MarketRail({
  onNavigate,
  catalogs,
  news,
  prices,
  analytics,
}: {
  onNavigate: (path: string) => void;
  catalogs: Record<string, Array<{ id: string; slug: string; title: string; summary: string; region: string }>>;
  news: Array<{ id: string; title: string; lead: string; section: string; type: string }>;
  prices: Array<{ id: string; culture: string; region: string; day: number; weekChange: number }>;
  analytics: Array<{ month: string; ndvi: number; ssi: number; priceForecast: number; demand: number; supply: number }>;
}) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const railTariffs = (catalogs['rail-tariffs'] ?? []).map((item) => ({
    label: `${item.title}${item.summary ? ` · ${item.summary}` : ''}`,
    path: `/rail-tariffs/${item.slug}`,
  }));
  const priceSnapshot = [...prices].slice(0, 3);
  const latestNews = [...news].slice(0, 2);
  const latestTrend = analytics.at(-1);
  const comments = [
    latestNews[0]
      ? `${latestNews[0].title} · ${latestNews[0].lead}`
      : 'Свежий обзор рынка и экспортных условий смотрите в ленте новостей.',
    latestNews[1]
      ? `${latestNews[1].title} · ${latestNews[1].lead}`
      : 'Логистика и спрос обновляются в новостной ленте и аналитике.',
    latestTrend
      ? `Прогноз урожайности ${latestTrend.month}: NDVI ${latestTrend.ndvi.toLocaleString('ru-RU')} · SSI ${latestTrend.ssi.toLocaleString('ru-RU')}`
      : 'Прогнозы и сигналы доступны в разделе аналитики.',
  ];
  const quickLinks = [
    { label: 'Цены', path: '/prices' },
    { label: 'Ж/д тарифы', path: '/rail-tariffs' },
    { label: 'Торговая площадка', path: '/marketplace' },
    { label: 'Аналитика', path: '/analytics' },
  ];

  if (isMobile) {
    return (
      <aside className="market-rail">
        <Collapse
          items={[
            {
              key: 'indices',
              label: 'Индексы',
              children: <RailLinkList items={priceSnapshot.map((item) => ({ label: `${item.culture} · ${item.day.toLocaleString('ru-RU')} ₽/т`, path: `/prices/${priceSlug(item.culture)}` }))} onNavigate={onNavigate} />,
            },
            { key: 'rail', label: 'Ж/д тарифы', children: <RailLinkList items={railTariffs} onNavigate={onNavigate} /> },
            { key: 'comments', label: 'Комментарии рынка', children: <RailLinkList items={latestNews.map((item) => ({ label: `${item.title} · ${item.lead}`, path: `/news/${item.id}` }))} onNavigate={onNavigate} /> },
            {
              key: 'changes',
              label: 'Последние изменения цен',
              children: <RailLinkList items={priceSnapshot.map((item) => ({ label: `${item.culture} · ${item.weekChange > 0 ? '+' : ''}${item.weekChange.toLocaleString('ru-RU')} ₽/неделя`, path: `/prices/${priceSlug(item.culture)}` }))} onNavigate={onNavigate} />,
            },
            {
              key: 'quick',
              label: 'Быстрые ссылки',
              children: (
                <Space direction="vertical" size={4}>
                  {quickLinks.map((item) => (
                    <Typography.Link key={item.path} onClick={() => onNavigate(item.path)}>
                      {item.label}
                    </Typography.Link>
                  ))}
                </Space>
              ),
            },
          ]}
        />
      </aside>
    );
  }

  return (
    <aside className="market-rail">
      <Card title={<RailCardTitle title="Индексы" action="Цены" onClick={() => onNavigate('/prices')} />} className="rail-card">
        <RailLinkList items={priceSnapshot.map((item) => ({ label: `${item.culture} · ${item.day.toLocaleString('ru-RU')} ₽/т`, path: `/prices/${priceSlug(item.culture)}` }))} onNavigate={onNavigate} />
      </Card>
      <Card title={<RailCardTitle title="Ж/д тарифы" action="Открыть" onClick={() => onNavigate('/rail-tariffs')} />} className="rail-card">
        <RailLinkList items={railTariffs} onNavigate={onNavigate} />
      </Card>
      <Card title={<RailCardTitle title="Комментарии" action="Аналитика" onClick={() => onNavigate('/analytics')} />} className="rail-card">
        <RailLinkList
          items={comments.map((item, index) => ({
            label: item,
            path: latestNews[index]?.id ? `/news/${latestNews[index].id}` : '/news',
          }))}
          onNavigate={onNavigate}
        />
      </Card>
      <Card title={<RailCardTitle title="Последние изменения цен" action="Цены" onClick={() => onNavigate('/prices')} />} className="rail-card">
        <RailLinkList items={priceSnapshot.map((item) => ({ label: `${item.culture} · ${item.weekChange > 0 ? '+' : ''}${item.weekChange.toLocaleString('ru-RU')} ₽/неделя`, path: `/prices/${priceSlug(item.culture)}` }))} onNavigate={onNavigate} />
      </Card>
      <Card title="Быстрые ссылки" className="rail-card">
        <Space direction="vertical" size={4}>
          {quickLinks.map((item) => (
            <Typography.Link key={item.path} onClick={() => onNavigate(item.path)}>
              {item.label}
            </Typography.Link>
          ))}
        </Space>
      </Card>
    </aside>
  );
}

function RailCardTitle({
  title,
  action,
  onClick,
}: {
  title: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
      <span>{title}</span>
      <Typography.Link onClick={onClick}>{action}</Typography.Link>
    </Space>
  );
}

function RailLinkList({
  items,
  onNavigate,
}: {
  items: Array<{ label: string; path: string }>;
  onNavigate: (path: string) => void;
}) {
  return (
    <Space direction="vertical" size={6}>
      {items.map((item) => (
        <Typography.Link key={`${item.path}-${item.label}`} onClick={() => onNavigate(item.path)}>
          {item.label}
        </Typography.Link>
      ))}
    </Space>
  );
}
