import { BellOutlined, DownOutlined, MenuOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Collapse,
  Col,
  Dropdown,
  Drawer,
  Grid,
  Input,
  Layout,
  Menu,
  MenuProps,
  Row,
  Segmented,
  Space,
  Timeline,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { footerColumns, mainNavigation, marketRailWidgets } from '../../config/portalNavigation';
import { useAppStore } from '../../store/appStore';

const { Header, Content, Footer } = Layout;

interface Props {
  children: ReactNode;
}

function getActiveTopMenuKey(pathname: string) {
  const found = mainNavigation.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return found?.key ?? 'home';
}

function shouldShowMarketRail(pathname: string) {
  return ['/', '/news', '/prices', '/analytics'].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AppShell({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationsRead = useAppStore((s) => s.markNotificationsRead);
  const cart = useAppStore((s) => s.cart);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeRole, setActiveRole] = useState<'buyer' | 'seller'>('buyer');

  const cartQty = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const unreadCount = useMemo(() => notifications.filter((item) => !item.viewed).length, [notifications]);
  const activeKey = getActiveTopMenuKey(location.pathname);
  const showMarketRail = shouldShowMarketRail(location.pathname);

  const topMenuItems = useMemo(
    () =>
      mainNavigation.map((item) => ({
        key: item.key,
        label: item.label,
        children: item.children.map((child) => ({ key: child.path, label: child.label })),
      })),
    [],
  );

  const buyer = users.find((user) => user.role === 'buyer');
  const seller = users.find((user) => user.role === 'seller');

  useEffect(() => {
    if (buyer?.id === currentUserId) setActiveRole('buyer');
    if (seller?.id === currentUserId) setActiveRole('seller');
  }, [buyer?.id, currentUserId, seller?.id]);

  const onSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const profileMenuItems = useMemo<MenuProps['items']>(
    () => [
      { key: 'sign-in', label: 'Вход' },
      { key: 'cabinet', label: 'Кабинет' },
      { key: 'favorites', label: 'Избранное' },
      { key: 'cart', label: `Корзина (${cartQty})` },
      { key: 'notifications', label: `Уведомления (${unreadCount})` },
    ],
    [cartQty, unreadCount],
  );

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

          <Space size={10} className="service-actions" wrap>
            <Input.Search
              allowClear
              placeholder="Поиск по новостям, ценам, лотам, организациям"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onSearch={onSearch}
              className="global-search"
              enterButton={<SearchOutlined />}
            />
            <Dropdown
              trigger={['click']}
              menu={{
                items: profileMenuItems,
                onClick: ({ key }) => {
                  if (key === 'notifications') {
                    setNotifOpen(true);
                    markNotificationsRead();
                    return;
                  }
                  if (key === 'cart') {
                    navigate('/cart');
                    return;
                  }
                  if (key === 'favorites') {
                    navigate('/favorites');
                    return;
                  }
                  navigate('/cabinet');
                },
              }}
            >
              <Button className="quick-outline-button" icon={<UserOutlined />}>
                Профиль и сервисы <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>

        <div className="main-menu-strip">
          {!isMobile && (
            <Menu
              mode="horizontal"
              selectedKeys={[activeKey]}
              items={topMenuItems}
              onClick={(info) => {
                if (mainNavigation.some((item) => item.key === info.key)) {
                  const top = mainNavigation.find((item) => item.key === info.key);
                  if (top) navigate(top.path);
                  return;
                }
                navigate(info.key);
              }}
              className="main-navigation"
            />
          )}

          <Space size={10} className="role-switcher" wrap>
            <Segmented
              value={activeRole}
              options={[
                { label: 'Покупатель', value: 'buyer' },
                { label: 'Продавец', value: 'seller' },
              ]}
              onChange={(value) => {
                const next = value as 'buyer' | 'seller';
                setActiveRole(next);
                if (next === 'buyer' && buyer) setCurrentUser(buyer.id);
                if (next === 'seller' && seller) setCurrentUser(seller.id);
              }}
            />
            <Button
              icon={<BellOutlined />}
              onClick={() => {
                setNotifOpen(true);
                markNotificationsRead();
              }}
            >
              Уведомления
            </Button>
          </Space>
        </div>
      </Header>

      <Content className="portal-content">
        <div className={`content-grid ${showMarketRail ? 'with-rail' : 'without-rail'}`}>
          <main className="content-main">{children}</main>
          {showMarketRail && <MarketRail onNavigate={navigate} />}
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
          <Button type="text" onClick={() => navigate('/prices')}>Цены</Button>
          <Button type="text" onClick={() => navigate('/marketplace')}>Торговая площадка</Button>
          <Button type="text" onClick={() => navigate('/forum')}>Форум</Button>
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
          items={mainNavigation.map((item) => ({
            key: item.path,
            label: item.label,
            children: item.children.map((child) => ({ key: child.path, label: child.label })),
          }))}
          onClick={(info) => {
            navigate(info.key);
            setMobileNavOpen(false);
          }}
        />
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

function MarketRail({ onNavigate }: { onNavigate: (path: string) => void }) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;

  if (isMobile) {
    return (
      <aside className="market-rail">
        <Collapse
          items={[
            { key: 'exchanges', label: 'Биржи', children: <RailList items={marketRailWidgets.exchanges} /> },
            { key: 'indices', label: 'Индексы', children: <RailList items={marketRailWidgets.indices} /> },
            { key: 'duties', label: 'Пошлины', children: <RailList items={marketRailWidgets.duties} /> },
            { key: 'quotes', label: 'Котировки', children: <RailList items={marketRailWidgets.quotes} /> },
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
      <Card title="Биржи" className="rail-card"><RailList items={marketRailWidgets.exchanges} /></Card>
      <Card title="Индексы" className="rail-card"><RailList items={marketRailWidgets.indices} /></Card>
      <Card title="Пошлины" className="rail-card"><RailList items={marketRailWidgets.duties} /></Card>
      <Card title="Котировки" className="rail-card"><RailList items={marketRailWidgets.quotes} /></Card>
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
