import { BellOutlined, DownOutlined, LoginOutlined, MenuOutlined, LogoutOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Col,
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
import { footerColumns, mainNavigation, marketRailWidgets } from '../../config/portalNavigation';
import { clearSession } from '../../services/session';
import { useAppStore } from '../../store/appStore';

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
  return ['/', '/news', '/prices', '/analytics'].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
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
      { key: 'cabinet', label: 'Кабинет' },
      { key: 'orders', label: 'Заказы' },
      { key: 'favorites', label: 'Избранное' },
      { key: 'cart', label: `Корзина (${cartQty})` },
      { key: 'notifications', label: `Уведомления (${unreadCount})` },
      { key: 'logout', label: 'Выйти', icon: <LogoutOutlined /> },
    ],
    [cartQty, unreadCount],
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
    if (key === 'orders') {
      navigate('/orders');
      return;
    }
    if (key === 'favorites') {
      navigate('/favorites');
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
        <div className="service-strip">
          <Space size={12} align="center" className="brand-strip">
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
              <Typography.Text className="brand-main">ЗерноРУ</Typography.Text>
              <Typography.Text className="brand-sub">Информационно-торговый портал</Typography.Text>
            </div>
          </Space>

          <Space size={12} className="service-actions" wrap>
            <Input.Search
              allowClear
              placeholder="Поиск по новостям, ценам, лотам, организациям"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onSearch={onSearch}
              className="global-search"
              enterButton={<SearchOutlined />}
            />

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
                    <Tag color={currentUser.role === 'seller' ? 'green' : 'blue'} className="profile-button__tag">
                      {currentUser.role === 'seller' ? 'Продавец' : 'Покупатель'}
                    </Tag>
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
            )}
          </Space>
        </div>

        <div className="main-menu-strip">
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

          {isMobile && (
            <Button
              icon={<BellOutlined />}
              onClick={() => {
                setNotifOpen(true);
                markNotificationsRead();
              }}
            >
              Уведомления ({unreadCount})
            </Button>
          )}
        </div>
      </Header>

      <Content className="portal-content">
        <div className={`content-grid ${showMarketRail ? 'with-rail' : 'without-rail'}`}>
          <main className="content-main">{children}</main>
          {showMarketRail && <MarketRail onNavigate={navigate} catalogs={referenceCatalogs} />}
        </div>
      </Content>

      <Footer className="portal-footer">
        <Row gutter={[24, 24]}>
          {footerColumns.map((column) => (
            <Col xs={24} sm={12} lg={6} key={column.title}>
              <Typography.Title level={5}>{column.title}</Typography.Title>
              <Space direction="vertical" size={6}>
                {column.links.map((link) => (
                  <Typography.Link key={link.path} onClick={() => navigate(link.path)}>
                    {link.label}
                  </Typography.Link>
                ))}
              </Space>
            </Col>
          ))}
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
          <Button block style={{ marginTop: 16 }} onClick={() => navigate('/cabinet')}>
            {currentUser.name}
          </Button>
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
}: {
  onNavigate: (path: string) => void;
  catalogs: Record<string, Array<{ id: string; slug: string; title: string; summary: string; region: string }>>;
}) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const exchanges = catalogs.exchange?.map((item) => `${item.title}${item.summary ? ` · ${item.summary}` : ''}`) ?? marketRailWidgets.exchanges;
  const duties = catalogs.duties?.map((item) => `${item.title}${item.summary ? ` · ${item.summary}` : ''}`) ?? marketRailWidgets.duties;
  const railTariffs = catalogs['rail-tariffs']?.map((item) => `${item.title}${item.summary ? ` · ${item.summary}` : ''}`) ?? marketRailWidgets.quotes;

  if (isMobile) {
    return (
      <aside className="market-rail">
        <Collapse
          items={[
            { key: 'exchanges', label: 'Биржи', children: <RailList items={exchanges} /> },
            { key: 'indices', label: 'Индексы', children: <RailList items={marketRailWidgets.indices} /> },
            { key: 'duties', label: 'Пошлины', children: <RailList items={duties} /> },
            { key: 'quotes', label: 'Котировки', children: <RailList items={railTariffs} /> },
            { key: 'comments', label: 'Комментарии рынка', children: <RailList items={marketRailWidgets.comments} /> },
            { key: 'changes', label: 'Последние изменения цен', children: <RailList items={marketRailWidgets.priceChanges} /> },
            {
              key: 'quick',
              label: 'Быстрые ссылки',
              children: (
                <Space direction="vertical" size={4}>
                  {marketRailWidgets.quickReviews.map((item) => (
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
      <Card title="Биржи" className="rail-card"><RailList items={exchanges} /></Card>
      <Card title="Индексы" className="rail-card"><RailList items={marketRailWidgets.indices} /></Card>
      <Card title="Пошлины" className="rail-card"><RailList items={duties} /></Card>
      <Card title="Котировки" className="rail-card"><RailList items={railTariffs} /></Card>
      <Card title="Комментарии" className="rail-card"><RailList items={marketRailWidgets.comments} /></Card>
      <Card title="Последние изменения цен" className="rail-card"><RailList items={marketRailWidgets.priceChanges} /></Card>
      <Card title="Быстрые ссылки" className="rail-card">
        <Space direction="vertical" size={4}>
          {marketRailWidgets.quickReviews.map((item) => (
            <Typography.Link key={item.path} onClick={() => onNavigate(item.path)}>
              {item.label}
            </Typography.Link>
          ))}
        </Space>
      </Card>
    </aside>
  );
}

function RailList({ items }: { items: string[] }) {
  return (
    <Space direction="vertical" size={6}>
      {items.map((item) => (
        <Typography.Text key={item}>{item}</Typography.Text>
      ))}
    </Space>
  );
}
