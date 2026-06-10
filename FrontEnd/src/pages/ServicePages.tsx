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
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

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
  const [step, setStep] = useState(0);

  const stepItems = ['Данные покупателя', 'Условия поставки', 'Документы и реквизиты', 'Подтверждение', 'Отправка заявки'];

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
        <Form layout="vertical">
          {step === 0 && (
            <>
              <Form.Item label="Название организации"><Input placeholder="ООО АгроТрейд" /></Form.Item>
              <Row gutter={12}>
                <Col span={12}><Form.Item label="Контакт"><Input placeholder="ФИО" /></Form.Item></Col>
                <Col span={12}><Form.Item label="Телефон"><Input placeholder="+7 ..." /></Form.Item></Col>
              </Row>
            </>
          )}
          {step === 1 && (
            <>
              <Form.Item label="Способ поставки"><Select options={[{ value: 'Самовывоз', label: 'Самовывоз' }, { value: 'Доставка продавцом', label: 'Доставка продавцом' }, { value: 'Перевозчик', label: 'Через перевозчика' }]} /></Form.Item>
              <Form.Item label="Ожидаемая дата"><DatePicker style={{ width: '100%' }} /></Form.Item>
            </>
          )}
          {step === 2 && (
            <>
              <Form.Item label="Реквизиты"><Input.TextArea rows={4} placeholder="ИНН, КПП, расчетный счет" /></Form.Item>
              <Form.Item label="Документы"><Input placeholder="Ссылка на пакет документов" /></Form.Item>
            </>
          )}
          {step === 3 && (
            <Alert type="info" message="Проверьте итоговые условия" description="После подтверждения заявка уйдет продавцу и появится в заказах и сделках." showIcon />
          )}
          {step === 4 && (
            <Alert type="success" message="Готово к отправке" description="Нажмите «Отправить заявку», чтобы создать заказ и открыть сделку." showIcon />
          )}

          <Space style={{ marginTop: 16 }}>
            <Button disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>Назад</Button>
            {step < 4 && <Button type="primary" onClick={() => setStep(step + 1)}>Далее</Button>}
            {step === 4 && <Button type="primary" onClick={() => navigate('/orders')}>Отправить заявку</Button>}
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
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Сделки</Typography.Title>
        <Typography.Paragraph className="lead-text">Отдельный контур сделок: календарь этапов, ответственные, дедлайны, оплата, отгрузка и журнал событий.</Typography.Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Календарь этапов сделки">
            <Table
              rowKey="stage"
              pagination={false}
              dataSource={[
                { stage: 'Подтверждение объема', owner: 'Покупатель', due: '18.04.2026', status: 'В работе' },
                { stage: 'Подписание договора', owner: 'Обе стороны', due: '19.04.2026', status: 'Ожидается' },
                { stage: 'Подача транспорта', owner: 'Перевозчик', due: '20.04.2026', status: 'Ожидается' },
              ]}
              columns={[
                { title: 'Этап', dataIndex: 'stage', key: 'stage' },
                { title: 'Ответственный', dataIndex: 'owner', key: 'owner' },
                { title: 'Срок', dataIndex: 'due', key: 'due' },
                { title: 'Статус', dataIndex: 'status', key: 'status' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Журнал событий">
            <Timeline
              items={[
                { color: 'green', children: '17.04 09:10 · Сделка создана' },
                { color: 'blue', children: '17.04 10:20 · Загружен проект договора' },
                { color: 'gold', children: '17.04 12:05 · Запрошено подтверждение объема' },
              ]}
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
  const [active, setActive] = useState('d1');
  const dialogs = [
    { id: 'd1', title: 'Сделка по пшенице 3 класса', unread: 2 },
    { id: 'd2', title: 'Уточнение документов', unread: 0 },
    { id: 'd3', title: 'Логистика Новороссийск', unread: 1 },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Центр сообщений</Typography.Title></Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card title="Диалоги" extra={<Input size="small" placeholder="Поиск" prefix={<SearchOutlined />} />}>
            <List
              dataSource={dialogs}
              renderItem={(item) => (
                <List.Item onClick={() => setActive(item.id)} style={{ cursor: 'pointer' }}>
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
          <Card title="Диалог" extra={<Tag>Системные статусы включены</Tag>}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Alert type="info" showIcon message="Продавец подтвердил наличие документов" />
              <Card className="nested-card">Покупатель: Просьба уточнить условия отгрузки на 22 апреля.</Card>
              <Card className="nested-card">Продавец: Готовы отгрузить 120 т, окно подачи транспорта с 10:00 до 16:00.</Card>
              <Input.TextArea rows={4} placeholder="Введите сообщение" />
              <Space>
                <Button type="primary">Отправить</Button>
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
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Центр документов</Typography.Title></Card>
      <Card title="Фильтры">
        <Row gutter={12}>
          <Col xs={24} md={6}><Select placeholder="Тип документа" options={[{ value: 'verification', label: 'Проверка продавца' }, { value: 'order', label: 'Заказы' }, { value: 'deal', label: 'Сделки' }]} /></Col>
          <Col xs={24} md={6}><Select placeholder="Статус подписи" options={[{ value: 'pending', label: 'Ожидает подписи' }, { value: 'signed', label: 'Подписан' }]} /></Col>
          <Col xs={24} md={6}><Input placeholder="Контрагент" /></Col>
          <Col xs={24} md={6}><Button block>Применить</Button></Col>
        </Row>
      </Card>
      <Card title="Документы">
        <Table
          rowKey="id"
          dataSource={[
            { id: 'doc-1', type: 'Договор поставки', counterparty: 'КФХ Вяземские Поля', status: 'Ожидает подписи', date: '17.04.2026' },
            { id: 'doc-2', type: 'Счет на оплату', counterparty: 'ООО ТрансЗерно', status: 'Подписан', date: '16.04.2026' },
          ]}
          columns={[
            { title: 'Документ', dataIndex: 'type', key: 'type' },
            { title: 'Контрагент', dataIndex: 'counterparty', key: 'counterparty' },
            { title: 'Статус', dataIndex: 'status', key: 'status' },
            { title: 'Дата', dataIndex: 'date', key: 'date' },
            { title: 'Действие', key: 'action', render: () => <Button type="link">Открыть</Button> },
          ]}
        />
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
  const [tab, setTab] = useState('market');

  const mockByTab: Record<string, string[]> = {
    market: ['Пшеница 3 класса выросла на 220 ₽/т', 'Обновлены котировки в порту Новороссийск'],
    system: ['Проверка продавца: требуется уточнение документа'],
    orders: ['Заказ ord-1 перешел в статус «В обработке»'],
    messages: ['Новое сообщение по сделке от продавца'],
    forum: ['Эксперт ответил в теме «Сроки поставки»'],
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Уведомления</Typography.Title></Card>
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
      <Card>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {mockByTab[tab].map((line) => (
            <Alert key={line} message={line} type="info" showIcon icon={<BellOutlined />} />
          ))}
          {!!notifications.length && <Typography.Text type="secondary">Личных уведомлений в системе: {notifications.length}</Typography.Text>}
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
  const prices = useAppStore((state) => state.prices);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Архив цен</Typography.Title></Card>
      <Card title="Параметры архива">
        <Row gutter={12}>
          <Col xs={24} md={6}><Select placeholder="Год" options={[{ value: '2026', label: '2026' }, { value: '2025', label: '2025' }]} /></Col>
          <Col xs={24} md={6}><Select placeholder="Культура" options={prices.map((item) => ({ value: item.id, label: item.culture }))} /></Col>
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
