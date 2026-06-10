import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  List,
  Progress,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { priceRows } from '../data/portalContent';
import { useAppStore } from '../store/appStore';
import { DeliveryMode } from '../types/domain';

export function CartPage() {
  const navigate = useNavigate();
  const cart = useAppStore((state) => state.cart);

  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Корзина</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Проверка выбранных лотов, продавцов, условий и документов перед оформлением заявки.
        </Typography.Paragraph>
      </Card>

      <Card title="Выбранные позиции" extra={<Button type="primary" onClick={() => navigate('/checkout')}>Перейти к оформлению</Button>}>
        {cart.length ? (
          <Table
            rowKey="id"
            dataSource={cart}
            pagination={false}
            columns={[
              { title: 'Лот', dataIndex: 'lotTitle', key: 'lotTitle' },
              { title: 'Продавец', dataIndex: 'sellerName', key: 'sellerName' },
              { title: 'Количество', dataIndex: 'quantity', key: 'quantity' },
              { title: 'Цена за единицу', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => `${v.toLocaleString('ru-RU')} ₽` },
              { title: 'Сумма', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `${v.toLocaleString('ru-RU')} ₽` },
            ]}
          />
        ) : (
          <Empty description="Корзина пуста">
            <Button type="primary" onClick={() => navigate('/marketplace')}>Перейти в торговую площадку</Button>
          </Empty>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Условия сделки">
            <Space direction="vertical" size={8}>
              <Typography.Text>Способ расчета: безналичный</Typography.Text>
              <Typography.Text>Документы: счет, договор, спецификация</Typography.Text>
              <Typography.Text>Проверка продавца: обязательна для всех позиций</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Сводка заказа">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text>Позиций: {cart.length}</Typography.Text>
              <Typography.Text strong>Итого: {total.toLocaleString('ru-RU')} ₽</Typography.Text>
              <Button type="primary" block icon={<ShoppingCartOutlined />} onClick={() => navigate('/checkout')}>
                Оформить заказ
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const currentUser = useAppStore((state) => state.users.find((user) => user.id === state.currentUserId));
  const cart = useAppStore((state) => state.cart);
  const checkout = useAppStore((state) => state.checkout);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp' | 'invoice'>('invoice');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('partner_delivery');
  const [distanceKm, setDistanceKm] = useState(212);
  const [shipDate, setShipDate] = useState<string>('');

  const orderTotal = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);
  const estimatedDelivery = useMemo(() => {
    const volume = Math.max(110, cart.reduce((sum, item) => sum + item.quantity, 0) * 12);
    if (deliveryMode === 'pickup') {
      return 0;
    }

    const base = distanceKm * 22 + volume * 8;
    return Math.round(base * (deliveryMode === 'partner_delivery' ? 1.18 : 1));
  }, [cart, deliveryMode, distanceKm]);
  const deliveryPrice = estimatedDelivery;
  const stepItems = ['Данные покупателя', 'Условия поставки', 'Документы и реквизиты', 'Подтверждение', 'Отправка заявки'];

  useEffect(() => {
    form.setFieldsValue({
      companyName: currentUser?.name ?? '',
      contactName: currentUser?.name ?? '',
      phone: '+7 ',
      deliveryMode,
      paymentMethod,
      shipmentDate: shipDate ? dayjs(shipDate) : undefined,
      distanceKm,
    });
  }, [currentUser, deliveryMode, distanceKm, form, paymentMethod, shipDate]);

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const values = await form.validateFields();
      const nextPayment = values.paymentMethod as 'card' | 'sbp' | 'invoice';
      const nextMode = values.deliveryMode as DeliveryMode;
      const nextDistance = Number(values.distanceKm ?? distanceKm);
      const nextDate = values.shipmentDate ? dayjs(values.shipmentDate).format('DD.MM.YYYY') : shipDate;

      setPaymentMethod(nextPayment);
      setDeliveryMode(nextMode);
      setDistanceKm(nextDistance);
      setShipDate(nextDate);

      const volume = Math.max(110, cart.reduce((sum, item) => sum + item.quantity, 0) * 12);
      const delivery = nextMode === 'pickup' ? 0 : Math.round((nextDistance * 22 + volume * 8) * (nextMode === 'partner_delivery' ? 1.18 : 1));
      const created = await checkout(nextPayment, nextMode, delivery);
      message.success('Заявка создана');
      navigate(`/orders/${created.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Оформление заказа</Typography.Title>
        <Typography.Paragraph className="lead-text">Пошаговый сценарий оформления заявки на покупку с проверкой данных по этапам.</Typography.Paragraph>
      </Card>

      <Card>
        <Steps current={step} items={stepItems.map((title) => ({ title }))} responsive />
      </Card>

      <Card title={stepItems[step]}>
        <Form layout="vertical" form={form}>
          {step === 0 && (
            <>
              <Form.Item name="companyName" label="Название организации" rules={[{ required: true, message: 'Введите название организации' }]}>
                <Input placeholder="ООО АгроТрейд" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}><Form.Item name="contactName" label="Контакт" rules={[{ required: true, message: 'Введите контактное лицо' }]}><Input placeholder="ФИО" /></Form.Item></Col>
                <Col span={12}><Form.Item name="phone" label="Телефон" rules={[{ required: true, message: 'Введите номер телефона' }]}><Input placeholder="+7 ..." /></Form.Item></Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}><Form.Item name="distanceKm" label="Дистанция, км"><Input type="number" min={0} onChange={(event) => setDistanceKm(Number(event.target.value))} /></Form.Item></Col>
                <Col span={12}><Form.Item name="shipmentDate" label="Ожидаемая дата"><DatePicker style={{ width: '100%' }} onChange={(value) => setShipDate(value ? value.format('DD.MM.YYYY') : '')} /></Form.Item></Col>
              </Row>
            </>
          )}
          {step === 1 && (
            <>
              <Form.Item name="deliveryMode" label="Способ поставки">
                <Select
                  options={[
                    { value: 'pickup', label: 'Самовывоз' },
                    { value: 'seller_delivery', label: 'Доставка продавцом' },
                    { value: 'partner_delivery', label: 'Через перевозчика' },
                  ]}
                  onChange={(value) => setDeliveryMode(value)}
                />
              </Form.Item>
              <Alert
                type="info"
                showIcon
                message={`Предварительная доставка: ${deliveryPrice.toLocaleString('ru-RU')} ₽`}
                description="Сумма считается от маршрута, объёма и выбранного режима доставки."
              />
            </>
          )}
          {step === 2 && (
            <>
              <Form.Item name="paymentMethod" label="Способ оплаты">
                <Select
                  options={[
                    { value: 'invoice', label: 'По счету' },
                    { value: 'card', label: 'Банковская карта' },
                    { value: 'sbp', label: 'СБП' },
                  ]}
                  onChange={(value) => setPaymentMethod(value)}
                />
              </Form.Item>
              <Form.Item label="Реквизиты"><Input.TextArea rows={4} placeholder="ИНН, КПП, расчетный счет" defaultValue={`${currentUser?.inn ?? ''}\n${currentUser?.ogrn ?? ''}`} /></Form.Item>
              <Form.Item label="Документы"><Input placeholder="Ссылка на пакет документов" /></Form.Item>
            </>
          )}
          {step === 3 && (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Alert type="info" message="Проверьте итоговые условия" description="После подтверждения заявка уйдет продавцу и появится в заказах и сделках." showIcon />
              <Card className="nested-card">
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Организация">{currentUser?.name ?? '—'}</Descriptions.Item>
                  <Descriptions.Item label="Способ доставки">{deliveryMode}</Descriptions.Item>
                  <Descriptions.Item label="Способ оплаты">{paymentMethod}</Descriptions.Item>
                  <Descriptions.Item label="Доставка">{deliveryPrice.toLocaleString('ru-RU')} ₽</Descriptions.Item>
                  <Descriptions.Item label="Дата отгрузки">{shipDate || 'не указана'}</Descriptions.Item>
                  <Descriptions.Item label="Сумма заказа">{(orderTotal + deliveryPrice).toLocaleString('ru-RU')} ₽</Descriptions.Item>
                </Descriptions>
              </Card>
            </Space>
          )}
          {step === 4 && (
            <Alert type="success" message="Готово к отправке" description="Нажмите «Отправить заявку», чтобы создать заказ и открыть сделку." showIcon />
          )}

          <Space style={{ marginTop: 16 }}>
            <Button disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>Назад</Button>
            {step < 4 && <Button type="primary" onClick={() => setStep(step + 1)}>Далее</Button>}
            {step === 4 && <Button type="primary" loading={submitting} onClick={() => void submitOrder()}>Отправить заявку</Button>}
          </Space>
        </Form>
      </Card>
    </Space>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const orders = useAppStore((state) => state.orders);
  const [status, setStatus] = useState<string | undefined>();

  const data = useMemo(() => orders.filter((item) => !status || item.status === status), [orders, status]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Заказы</Typography.Title>
        <Typography.Paragraph className="lead-text">Список заказов с фильтрами по статусу, дате и контрагенту.</Typography.Paragraph>
      </Card>

      <Card title="Фильтры заказов">
        <Row gutter={12}>
          <Col xs={24} md={6}><Select allowClear placeholder="Статус" value={status} onChange={setStatus} style={{ width: '100%' }} options={[{ value: 'created', label: 'Создан' }, { value: 'paid', label: 'Оплачен' }, { value: 'processing', label: 'В обработке' }]} /></Col>
          <Col xs={24} md={6}><DatePicker.RangePicker style={{ width: '100%' }} /></Col>
          <Col xs={24} md={6}><Input placeholder="Контрагент" /></Col>
          <Col xs={24} md={6}><Button block onClick={() => setStatus(undefined)}>Сбросить</Button></Col>
        </Row>
      </Card>

      <Card title="Список заказов">
        {data.length ? (
          <Table
            rowKey="id"
            dataSource={data}
            columns={[
              { title: 'Номер', dataIndex: 'id', key: 'id' },
              { title: 'Дата', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => dayjs(v).format('DD.MM.YYYY HH:mm') },
              { title: 'Сумма', dataIndex: 'total', key: 'total', render: (v: number) => `${v.toLocaleString('ru-RU')} ₽` },
              {
                title: 'Статус',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => <Tag color={v === 'paid' ? 'green' : v === 'processing' ? 'blue' : 'gold'}>{v === 'paid' ? 'Оплачен' : v === 'processing' ? 'В обработке' : 'Создан'}</Tag>,
              },
              { title: 'Действие', key: 'action', render: (_, r) => <Button type="link" onClick={() => navigate(`/orders/${r.id}`)}>Открыть</Button> },
            ]}
          />
        ) : (
          <Empty description="Заказов пока нет">
            <Button type="primary" onClick={() => navigate('/marketplace')}>Найти лоты</Button>
          </Empty>
        )}
      </Card>
    </Space>
  );
}

export function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const orders = useAppStore((state) => state.orders);
  const order = orders.find((item) => item.id === orderId) ?? orders[0];

  if (!order) {
    return (
      <Card>
        <Empty description="Заказ не найден">
          <Button type="primary" onClick={() => navigate('/orders')}>Вернуться к заказам</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Заказ {order.id}</Typography.Title>
        <Space>
          <Tag color="blue">Статус: {order.status === 'paid' ? 'Оплачен' : order.status === 'processing' ? 'В обработке' : 'Создан'}</Tag>
          <Tag>Сумма: {order.total.toLocaleString('ru-RU')} ₽</Tag>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Этапы сделки">
            <Timeline
              items={[
                { color: 'green', children: 'Заявка создана' },
                { color: order.status !== 'created' ? 'green' : 'gray', children: 'Подтверждение продавца' },
                { color: order.status === 'paid' ? 'green' : 'blue', children: 'Оплата' },
                { color: 'gray', children: 'Отгрузка и закрытие документов' },
              ]}
            />
          </Card>
          <Card title="Документы и сообщения" style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/documents')}>Центр документов</Button>
              <Button onClick={() => navigate('/messages')}>Центр сообщений</Button>
              <Button onClick={() => navigate('/deals')}>Открыть сделку</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Параметры заказа">
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Способ оплаты">{order.paymentMethod}</Descriptions.Item>
              <Descriptions.Item label="Доставка">{order.deliveryMode}</Descriptions.Item>
              <Descriptions.Item label="Стоимость доставки">{order.deliveryPrice.toLocaleString('ru-RU')} ₽</Descriptions.Item>
              <Descriptions.Item label="Количество позиций">{order.items.length}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function DealsPage() {
  const navigate = useNavigate();
  const orders = useAppStore((state) => state.orders);
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);

  const dealRows = useMemo(() => orders.map((order) => {
    const itemTitles = order.items.map((item) => item.lotTitle).join(', ');
    const relatedLot = [...grainLots, ...equipmentLots].find((lot) => order.items.some((item) => item.lotId === lot.id));

    return {
      id: order.id,
      stage: order.status === 'created' ? 'Подтверждение объема' : order.status === 'paid' ? 'Оплата завершена' : 'Отгрузка и закрытие документов',
      owner: relatedLot ? relatedLot.sellerName : 'Поставщик',
      due: dayjs(order.createdAt).add(3, 'day').format('DD.MM.YYYY'),
      status: order.status === 'created' ? 'В работе' : order.status === 'paid' ? 'Оплачено' : 'Выполняется',
      title: itemTitles,
      total: order.total,
    };
  }), [equipmentLots, grainLots, orders]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Сделки</Typography.Title>
        <Typography.Paragraph className="lead-text">Контур сделок строится на реальных заказах. Видны этапы, ответственные, дедлайны и переходы к карточке заказа.</Typography.Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Календарь этапов сделки">
            <Table
              rowKey="id"
              pagination={false}
              dataSource={dealRows.length ? dealRows : [{ id: 'empty', stage: 'Нет сделок', owner: '—', due: '—', status: 'Пусто', title: '', total: 0 }]}
              columns={[
                { title: 'Этап', dataIndex: 'stage', key: 'stage' },
                { title: 'Ответственный', dataIndex: 'owner', key: 'owner' },
                { title: 'Срок', dataIndex: 'due', key: 'due' },
                { title: 'Статус', dataIndex: 'status', key: 'status' },
                {
                  title: 'Действие',
                  key: 'action',
                  render: (_, record) => record.id !== 'empty' ? <Button type="link" onClick={() => navigate(`/orders/${record.id}`)}>Открыть</Button> : null,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Журнал событий">
            <Timeline
              items={dealRows.slice(0, 3).map((deal) => ({
                color: deal.status === 'Выполняется' ? 'blue' : deal.status === 'Оплачено' ? 'green' : 'gold',
                children: `${deal.due} · ${deal.title || 'Сделка'} · ${deal.status}`,
              }))}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function FavoritesPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Избранное</Typography.Title></Card>
      <Tabs
        items={[
          { key: 'lots', label: 'Лоты', children: <Card className="nested-card">Пшеница 3 класса · 16 800 ₽/т</Card> },
          { key: 'news', label: 'Новости', children: <Card className="nested-card">Экспорт пшеницы ускорился</Card> },
          { key: 'forum', label: 'Темы форума', children: <Card className="nested-card">Сроки поставки в ЦФО</Card> },
          { key: 'org', label: 'Организации', children: <Card className="nested-card">ООО АгроЭкспорт Логистика</Card> },
        ]}
      />
    </Space>
  );
}

export function ComparePage() {
  const grainLots = useAppStore((state) => state.grainLots);
  const rows = grainLots.slice(0, 2);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Сравнение лотов</Typography.Title></Card>
      <Card>
        {rows.length >= 2 ? (
          <Table
            rowKey="metric"
            pagination={false}
            dataSource={[
              { metric: 'Цена', a: `${rows[0].pricePerTon.toLocaleString('ru-RU')} ₽/т`, b: `${rows[1].pricePerTon.toLocaleString('ru-RU')} ₽/т` },
              { metric: 'Объем', a: `${rows[0].volumeTons} т`, b: `${rows[1].volumeTons} т` },
              { metric: 'Качество', a: `${rows[0].qualityScore}/100`, b: `${rows[1].qualityScore}/100` },
              { metric: 'Регион', a: rows[0].region, b: rows[1].region },
              { metric: 'Документы', a: 'Полный комплект', b: 'Полный комплект' },
            ]}
            columns={[
              { title: 'Параметр', dataIndex: 'metric', key: 'metric' },
              { title: rows[0].title, dataIndex: 'a', key: 'a' },
              { title: rows[1].title, dataIndex: 'b', key: 'b' },
            ]}
          />
        ) : (
          <Empty description="Добавьте минимум два лота для сравнения" />
        )}
      </Card>
    </Space>
  );
}

export function MessagesPage() {
  const navigate = useNavigate();
  const orders = useAppStore((state) => state.orders);
  const posts = useAppStore((state) => state.posts);
  const replies = useAppStore((state) => state.replies);
  const notifications = useAppStore((state) => state.notifications);
  const [active, setActive] = useState('');
  const [draft, setDraft] = useState('');
  const [sentMessages, setSentMessages] = useState<Record<string, string[]>>({});

  const dialogs = useMemo(
    () => [
      ...orders.slice(0, 3).map((order) => ({
        id: `order:${order.id}`,
        title: `Заказ ${order.id}`,
        unread: order.status === 'created' ? 1 : 0,
        kind: 'order' as const,
        route: `/orders/${order.id}`,
        messages: [
          `Сделка по заказу ${order.id} создана и ожидает подтверждения.`,
          `Сумма заказа: ${order.total.toLocaleString('ru-RU')} ₽.`,
          `Статус сейчас: ${order.status}.`,
        ],
      })),
      ...posts.slice(0, 2).map((post) => ({
        id: `forum:${post.id}`,
        title: post.title,
        unread: replies.filter((reply) => reply.postId === post.id).length,
        kind: 'forum' as const,
        route: `/forum/topic/${post.id}`,
        messages: [
          `Тема форума: ${post.title}`,
          post.content,
          ...replies.filter((reply) => reply.postId === post.id).map((reply) => `${reply.authorName}: ${reply.content}`),
        ],
      })),
      {
        id: 'system:notifications',
        title: 'Системные уведомления',
        unread: notifications.filter((item) => !item.viewed).length,
        kind: 'system' as const,
        route: '/notifications',
        messages: notifications.slice(0, 5).map((item) => item.message),
      },
    ],
    [notifications, orders, posts, replies],
  );

  useEffect(() => {
    if (!dialogs.length) {
      return;
    }
    if (!active || !dialogs.some((dialog) => dialog.id === active)) {
      setActive(dialogs[0].id);
    }
  }, [active, dialogs]);

  const currentDialog = dialogs.find((item) => item.id === active) ?? dialogs[0];
  const visibleMessages = [...(currentDialog?.messages ?? []), ...(sentMessages[currentDialog?.id ?? ''] ?? [])];

  const sendMessage = () => {
    if (!currentDialog || !draft.trim()) {
      return;
    }

    setSentMessages((state) => ({
      ...state,
      [currentDialog.id]: [...(state[currentDialog.id] ?? []), `Вы: ${draft.trim()}`],
    }));
    setDraft('');
    message.success('Сообщение добавлено в диалог');
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Центр сообщений</Typography.Title></Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card title="Диалоги" extra={<Input size="small" placeholder="Поиск" prefix={<SearchOutlined />} />}>
            <List
              dataSource={dialogs}
              renderItem={(item) => (
                <List.Item
                  onClick={() => setActive(item.id)}
                  style={{ cursor: 'pointer' }}
                  actions={[<Button key="open" type="link" onClick={() => navigate(item.route)}>Открыть</Button>]}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text strong={item.id === active}>{item.title}</Typography.Text>
                    <Badge count={item.unread} size="small" />
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={16}>
          <Card
            title="Диалог"
            extra={<Space><Tag>Реальные данные</Tag><Button type="link" onClick={() => currentDialog?.route && navigate(currentDialog.route)}>Открыть карточку</Button></Space>}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {currentDialog?.kind === 'system' && <Alert type="info" showIcon message="Системные уведомления портала" description="Лента собрана из реальных событий по заказам, подпискам и активности." />}
              {visibleMessages.map((line) => (
                <Card key={line} className="nested-card">{line}</Card>
              ))}
              <Input.TextArea rows={4} placeholder="Введите сообщение" value={draft} onChange={(event) => setDraft(event.target.value)} />
              <Space>
                <Button type="primary" onClick={sendMessage}>Отправить</Button>
                <Button>Прикрепить файл</Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function DocumentsPage() {
  const navigate = useNavigate();
  const orders = useAppStore((state) => state.orders);
  const sellerApplications = useAppStore((state) => state.sellerApplications);
  const currentUser = useAppStore((state) => state.users.find((user) => user.id === state.currentUserId));
  const [kind, setKind] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [query, setQuery] = useState('');

  const docs = useMemo(() => {
    const orderDocs = orders.map((order) => ({
      id: `order-${order.id}`,
      type: 'order',
      title: `Заказ ${order.id}`,
      counterparty: order.items[0]?.sellerName ?? 'Поставщик',
      status: order.status === 'paid' ? 'signed' : order.status === 'processing' ? 'processing' : 'pending',
      date: order.createdAt,
      route: `/orders/${order.id}`,
      description: `${order.items.length} позиций · ${order.total.toLocaleString('ru-RU')} ₽`,
    }));

    const verificationDocs = sellerApplications.map((application) => ({
      id: `verify-${application.id}`,
      type: 'verification',
      title: 'Проверка компании',
      counterparty: application.companyName,
      status: application.status,
      date: application.submittedAt,
      route: '/seller-verification',
      description: `ИНН ${application.inn} · ОГРН ${application.ogrn}`,
    }));

    return [...verificationDocs, ...orderDocs].sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, sellerApplications]);

  const filteredDocs = useMemo(() => docs.filter((doc) => {
    if (kind && doc.type !== kind) return false;
    if (status && doc.status !== status) return false;
    if (query && !`${doc.title} ${doc.counterparty} ${doc.description}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [docs, kind, query, status]);

  const downloadDocument = (title: string, body: string) => {
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Центр документов</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Документы собираются из реальных заказов и заявок на верификацию. Здесь можно открыть карточку, скачать текстовую копию или перейти в связанный раздел.
        </Typography.Paragraph>
      </Card>
      <Card title="Фильтры">
        <Row gutter={12}>
          <Col xs={24} md={6}><Select allowClear placeholder="Тип документа" value={kind} onChange={setKind} options={[{ value: 'verification', label: 'Проверка компании' }, { value: 'order', label: 'Заказы' }]} /></Col>
          <Col xs={24} md={6}><Select allowClear placeholder="Статус подписи" value={status} onChange={setStatus} options={[{ value: 'pending', label: 'Ожидает подписи' }, { value: 'processing', label: 'В работе' }, { value: 'signed', label: 'Подписан' }, { value: 'approved', label: 'Подтверждено' }]} /></Col>
          <Col xs={24} md={6}><Input placeholder="Поиск по документам" value={query} onChange={(event) => setQuery(event.target.value)} /></Col>
          <Col xs={24} md={6}><Button block onClick={() => { setKind(undefined); setStatus(undefined); setQuery(''); }}>Сбросить</Button></Col>
        </Row>
      </Card>
      <Card title="Документы">
        {filteredDocs.length ? (
          <Table
            rowKey="id"
            dataSource={filteredDocs}
            columns={[
              { title: 'Документ', dataIndex: 'title', key: 'title' },
              { title: 'Контрагент', dataIndex: 'counterparty', key: 'counterparty' },
              { title: 'Статус', dataIndex: 'status', key: 'status' },
              { title: 'Дата', dataIndex: 'date', key: 'date', render: (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm') },
              { title: 'Описание', dataIndex: 'description', key: 'description' },
              {
                title: 'Действие',
                key: 'action',
                render: (_, record) => (
                  <Space>
                    <Button type="link" onClick={() => navigate(record.route)}>Открыть</Button>
                    <Button type="link" onClick={() => downloadDocument(record.title, `${record.title}\n${record.counterparty}\n${record.description}\nСтатус: ${record.status}`)}>Скачать</Button>
                  </Space>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="Документы не найдены">
            <Button type="primary" onClick={() => navigate(currentUser?.role === 'seller' ? '/seller-verification' : '/orders')}>Перейти в связанный раздел</Button>
          </Empty>
        )}
      </Card>
    </Space>
  );
}

export function BillingPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Оплата и тарифы</Typography.Title></Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card title="Текущий тариф">
            <Typography.Title level={3}>Аналитика Профессиональный</Typography.Title>
            <Typography.Text>Следующее списание: 12.05.2026</Typography.Text>
            <Progress percent={64} style={{ marginTop: 12 }} />
            <Button type="primary" block style={{ marginTop: 12 }}>Продлить подписку</Button>
          </Card>
        </Col>
        <Col xs={24} xl={16}>
          <Card title="История платежей">
            <Table
              rowKey="id"
              dataSource={[
                { id: 'pay-1', date: '12.04.2026', item: 'Подписка аналитики', amount: '12 900 ₽', status: 'Оплачен' },
                { id: 'pay-2', date: '12.03.2026', item: 'Подписка аналитики', amount: '12 900 ₽', status: 'Оплачен' },
              ]}
              columns={[
                { title: 'Дата', dataIndex: 'date', key: 'date' },
                { title: 'Назначение', dataIndex: 'item', key: 'item' },
                { title: 'Сумма', dataIndex: 'amount', key: 'amount' },
                { title: 'Статус', dataIndex: 'status', key: 'status' },
                { title: 'Действие', key: 'action', render: () => <Button type="link">Скачать акт</Button> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function NotificationsPage() {
  const notifications = useAppStore((state) => state.notifications);
  const markNotificationsRead = useAppStore((state) => state.markNotificationsRead);
  const [tab, setTab] = useState('market');

  const grouped = useMemo(() => ({
    market: notifications.filter((item) => /цен|котиров|рынк|спрос|предлож/i.test(item.message)),
    system: notifications.filter((item) => /провер|документ|профил|подпис/i.test(item.message)),
    orders: notifications.filter((item) => /заказ|сделк|отгруз|оплат/i.test(item.message)),
    messages: notifications.filter((item) => /сообщен|диалог|ответ/i.test(item.message)),
    forum: notifications.filter((item) => /форум|тема|обсужден/i.test(item.message)),
  }), [notifications]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Уведомления</Typography.Title>
        <Typography.Paragraph className="lead-text">
          События подтягиваются из backend и группируются по типам. Можно быстро увидеть рыночные сигналы, статус заказов и системные изменения.
        </Typography.Paragraph>
      </Card>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'market', label: 'Рыночные' },
          { key: 'system', label: 'Системные' },
          { key: 'orders', label: 'По заказам' },
          { key: 'messages', label: 'По сообщениям' },
          { key: 'forum', label: 'По форуму' },
        ]}
      />
      <Card title="Лента уведомлений" extra={<Button onClick={() => void markNotificationsRead()}>Отметить все прочитанными</Button>}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {(grouped[tab as keyof typeof grouped] ?? []).length ? (grouped[tab as keyof typeof grouped] ?? []).map((item) => (
            <Alert
              key={item.id}
              message={item.message}
              type={item.viewed ? 'success' : 'info'}
              showIcon
              icon={<BellOutlined />}
            />
          )) : (
            <Empty description="В этой категории пока нет уведомлений" />
          )}
          {!!notifications.length && <Typography.Text type="secondary">Всего уведомлений в системе: {notifications.length}</Typography.Text>}
        </Space>
      </Card>
    </Space>
  );
}

export function HelpPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Помощь и поддержка</Typography.Title>
        <Input prefix={<SearchOutlined />} placeholder="Поиск по базе знаний" />
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card title="Популярные статьи">
            <List
              dataSource={[
                'Как создать лот и пройти модерацию',
                'Как оформить заказ и запустить сделку',
                'Как подключить подписку на аналитику',
              ]}
              renderItem={(item) => <List.Item><Typography.Link>{item}</Typography.Link></List.Item>}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card title="Форма обращения">
            <Form layout="vertical">
              <Form.Item label="Тема"><Input /></Form.Item>
              <Form.Item label="Описание"><Input.TextArea rows={4} /></Form.Item>
              <Button type="primary" block>Отправить запрос</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

interface ContentArticlePageProps {
  title: string;
  sections: { heading: string; body: string }[];
}

export function ContentArticlePage({ title, sections }: ContentArticlePageProps) {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">Обновлено: 17.04.2026</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={18}>
          <Card>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              {sections.map((section) => (
                <div key={section.heading}>
                  <Typography.Title level={3}>{section.heading}</Typography.Title>
                  <Typography.Paragraph>{section.body}</Typography.Paragraph>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={6}>
          <Card title="Оглавление">
            <Space direction="vertical" size={8}>
              {sections.map((section) => (
                <Typography.Link key={section.heading}>{section.heading}</Typography.Link>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function PriceArchivePage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Архив цен</Typography.Title></Card>
      <Card title="Параметры архива">
        <Row gutter={12}>
          <Col xs={24} md={6}><Select placeholder="Год" options={[{ value: '2026', label: '2026' }, { value: '2025', label: '2025' }]} /></Col>
          <Col xs={24} md={6}><Select placeholder="Культура" options={priceRows.map((item) => ({ value: item.key, label: item.culture }))} /></Col>
          <Col xs={24} md={6}><Select placeholder="Период" options={[{ value: 'week', label: 'Недели' }, { value: 'month', label: 'Месяцы' }]} /></Col>
          <Col xs={24} md={6}><Button block>Сравнить периоды</Button></Col>
        </Row>
      </Card>
      <Card title="Исторические значения">
        <Table
          rowKey="month"
          dataSource={[
            { month: 'Январь', pw3: 15820, pw4: 14960, barley: 13210 },
            { month: 'Февраль', pw3: 16040, pw4: 15120, barley: 13480 },
            { month: 'Март', pw3: 16410, pw4: 15410, barley: 13720 },
            { month: 'Апрель', pw3: 16800, pw4: 15620, barley: 13950 },
          ]}
          columns={[
            { title: 'Период', dataIndex: 'month', key: 'month' },
            { title: 'Пшеница 3 класса', dataIndex: 'pw3', key: 'pw3', render: (v: number) => `${v.toLocaleString('ru-RU')} ₽/т` },
            { title: 'Пшеница 4 класса', dataIndex: 'pw4', key: 'pw4', render: (v: number) => `${v.toLocaleString('ru-RU')} ₽/т` },
            { title: 'Ячмень', dataIndex: 'barley', key: 'barley', render: (v: number) => `${v.toLocaleString('ru-RU')} ₽/т` },
          ]}
        />
      </Card>
    </Space>
  );
}

export function AnalyticsTariffsPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Тарифы аналитики</Typography.Title></Card>
      <Row gutter={[16, 16]}>
        {[
          { title: 'Базовый', price: '4 900 ₽/мес', features: ['Ежедневная сводка цен', '2 культуры', 'Уведомления по почте'] },
          { title: 'Профессиональный', price: '12 900 ₽/мес', features: ['Все культуры', 'Индексы и сигналы', 'Экспорт отчетов'] },
          { title: 'Корпоративный', price: 'По запросу', features: ['Командный доступ', 'API выгрузки', 'Персональный аналитик'] },
        ].map((plan) => (
          <Col xs={24} md={12} xl={8} key={plan.title}>
            <Card className="metric-card" title={plan.title}>
              <Typography.Title level={2}>{plan.price}</Typography.Title>
              <List dataSource={plan.features} renderItem={(item) => <List.Item>{item}</List.Item>} />
              <Button type="primary" block>Выбрать тариф</Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

export function AnalyticsDemoPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Демо-аналитика</Typography.Title></Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Пример графиков и индексов">
            <Space direction="vertical" size={10}>
              <Typography.Text>NDVI: 0,63 · Индекс активности посевов</Typography.Text>
              <Typography.Text>SSI: 0,41 · Индекс стрессовых состояний</Typography.Text>
              <Typography.Text>Прогноз цены пшеницы 3 класса: 17 120 ₽/т через 30 дней</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Как использовать">
            <List
              dataSource={[
                'Выбор культуры и региона',
                'Сравнение сценариев сезона',
                'Получение сигналов по рискам',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function AnalyticsSubscriptionPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Управление подпиской</Typography.Title></Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Текущий статус">
            <Space direction="vertical" size={8}>
              <Tag color="green" icon={<CheckCircleOutlined />}>Подписка активна</Tag>
              <Typography.Text>Тариф: Профессиональный</Typography.Text>
              <Typography.Text>Срок действия: до 12.05.2026</Typography.Text>
              <Typography.Text>Автопродление: включено</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Настройки уведомлений">
            <Space direction="vertical" size={8}>
              <Tag icon={<ClockCircleOutlined />}>Ежедневная сводка в 08:00</Tag>
              <Tag icon={<BellOutlined />}>Сигнал по отклонению цены &gt; 2%</Tag>
              <Tag icon={<FileDoneOutlined />}>Еженедельный отчет по регионам</Tag>
            </Space>
            <Button type="primary" block style={{ marginTop: 12 }}>Сохранить настройки</Button>
          </Card>
        </Col>
      </Row>
      <Card title="История продления">
        <Table
          rowKey="id"
          dataSource={[
            { id: 'sub-1', date: '12.04.2026', period: '1 месяц', amount: '12 900 ₽', status: 'Оплачено' },
            { id: 'sub-2', date: '12.03.2026', period: '1 месяц', amount: '12 900 ₽', status: 'Оплачено' },
          ]}
          columns={[
            { title: 'Дата', dataIndex: 'date', key: 'date' },
            { title: 'Период', dataIndex: 'period', key: 'period' },
            { title: 'Сумма', dataIndex: 'amount', key: 'amount' },
            { title: 'Статус', dataIndex: 'status', key: 'status' },
          ]}
        />
      </Card>
    </Space>
  );
}

export function SystemStatesDemoPage() {
  return (
    <Card title="Системные состояния">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert message="Загрузка" description="Данные загружаются, подождите." type="info" />
        <Alert message="Пустой список" description="Список пока пуст. Добавьте первый элемент." type="warning" />
        <Alert message="Нет результата" description="Измените фильтры или поисковый запрос." type="warning" />
        <Alert message="Ошибка сервера" description="Сервис временно недоступен. Повторите позже." type="error" />
        <Alert message="Нет доступа" description="Раздел доступен после проверки компании." type="error" />
        <Space wrap>
          <Tag>Черновик</Tag>
          <Tag color="gold">На модерации</Tag>
          <Tag color="red">Отклонено</Tag>
          <Tag color="green">Опубликовано</Tag>
          <Tag>Архив</Tag>
        </Space>
      </Space>
    </Card>
  );
}

export function buildStaticSections(title: string): { heading: string; body: string }[] {
  return [
    {
      heading: 'Назначение раздела',
      body: `${title} оформлен как полноценная контентная страница с оглавлением, датой обновления и структурированными блоками текста.`,
    },
    {
      heading: 'Правила и порядок',
      body: 'Здесь описаны требования, регламенты и ответственность сторон для прозрачной работы на площадке.',
    },
    {
      heading: 'Как это влияет на пользователя',
      body: 'Раздел помогает быстрее принимать решения, снижать риски и корректно оформлять сделки и публикации.',
    },
  ];
}
