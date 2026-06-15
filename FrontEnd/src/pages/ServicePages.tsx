/* eslint-disable react-refresh/only-export-components */
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
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  List,
  Modal,
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
import { useAppStore } from '../store/appStore';
import { PriceRecord } from '../types/domain';
import { buildPriceArchiveSeries, priceSlugForRecord } from '../utils/price';
import { z } from 'zod';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function CartPage() {
  const navigate = useNavigate();
  const cart = useAppStore((state) => state.cart);
  const removeCartItem = useAppStore((state) => state.removeCartItem);

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
              {
                title: 'Действие',
                key: 'action',
                render: (_, item) => <Button danger type="link" onClick={async () => void removeCartItem(item.id)}>Удалить</Button>,
              },
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
  const checkout = useAppStore((state) => state.checkout);
  const cart = useAppStore((state) => state.cart);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();

  const currentUser = users.find((user) => user.id === currentUserId);

  const checkoutSchema = z.object({
    organizationName: z.string().trim().min(2, 'Укажите организацию'),
    contactName: z.string().trim().min(2, 'Укажите контактное лицо'),
    phone: z.string().trim().min(10, 'Укажите телефон'),
    email: z.string().trim().email('Укажите корректный email'),
    deliveryMode: z.enum(['pickup', 'seller_delivery', 'partner_delivery']),
    deliveryAddress: z.string().trim().optional().default(''),
    deliveryDate: z.any().optional(),
    paymentMethod: z.enum(['card', 'sbp', 'invoice']),
    payerInn: z.string().trim().optional().default(''),
    payerKpp: z.string().trim().optional().default(''),
    payerAccount: z.string().trim().optional().default(''),
    payerBank: z.string().trim().optional().default(''),
    payerBik: z.string().trim().optional().default(''),
    cardNumber: z.string().trim().optional().default(''),
    cardHolder: z.string().trim().optional().default(''),
    cardExpiry: z.string().trim().optional().default(''),
    sbpPhone: z.string().trim().optional().default(''),
    comment: z.string().trim().optional().default(''),
  });

  const stepTitles = ['Покупатель', 'Доставка', 'Оплата', 'Проверка'];

  const deliveryMode = Form.useWatch('deliveryMode', form) ?? 'pickup';
  const organizationName = Form.useWatch('organizationName', form) ?? '';
  const contactName = Form.useWatch('contactName', form) ?? '';
  const phone = Form.useWatch('phone', form) ?? '';
  const email = Form.useWatch('email', form) ?? '';
  const deliveryAddress = Form.useWatch('deliveryAddress', form) ?? '';
  const deliveryDate = Form.useWatch('deliveryDate', form);
  const paymentMethod = Form.useWatch('paymentMethod', form) ?? 'invoice';
  const payerInn = Form.useWatch('payerInn', form) ?? '';
  const payerKpp = Form.useWatch('payerKpp', form) ?? '';
  const payerAccount = Form.useWatch('payerAccount', form) ?? '';
  const payerBank = Form.useWatch('payerBank', form) ?? '';
  const payerBik = Form.useWatch('payerBik', form) ?? '';
  const cardNumber = Form.useWatch('cardNumber', form) ?? '';
  const cardHolder = Form.useWatch('cardHolder', form) ?? '';
  const cardExpiry = Form.useWatch('cardExpiry', form) ?? '';
  const sbpPhone = Form.useWatch('sbpPhone', form) ?? '';
  const comment = Form.useWatch('comment', form) ?? '';
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  const deliveryLabels: Record<string, string> = {
    pickup: 'Самовывоз',
    seller_delivery: 'Доставка продавцом',
    partner_delivery: 'Через перевозчика',
  };
  const paymentLabels: Record<string, string> = {
    invoice: 'Счет для юрлица',
    card: 'Банковская карта',
    sbp: 'СБП',
  };

  const normalizePhone = (value: string) => {
    const digits = value.replace(/\D/g, '').replace(/^8/, '7');
    const withCountry = digits.startsWith('7') ? digits : `7${digits}`;
    const cut = withCountry.slice(0, 11);
    const part1 = cut.slice(1, 4);
    const part2 = cut.slice(4, 7);
    const part3 = cut.slice(7, 9);
    const part4 = cut.slice(9, 11);
    return [
      '+7',
      part1 ? ` (${part1}` : '',
      part1.length === 3 ? ')' : '',
      part2 ? ` ${part2}` : '',
      part3 ? `-${part3}` : '',
      part4 ? `-${part4}` : '',
    ].join('');
  };

  const onlyDigits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);

  useEffect(() => {
    if (!currentUser) return;
    form.setFieldsValue({
      organizationName: form.getFieldValue('organizationName') || currentUser.name,
      contactName: form.getFieldValue('contactName') || currentUser.name,
      email: form.getFieldValue('email') || currentUser.email,
      payerInn: form.getFieldValue('payerInn') || currentUser.inn || '',
    });
  }, [currentUser, form]);

  const paymentFields = () => {
    if (paymentMethod === 'invoice') {
      return ['paymentMethod', 'payerInn', 'payerAccount', 'payerBank', 'payerBik'];
    }
    if (paymentMethod === 'card') {
      return ['paymentMethod', 'cardNumber', 'cardHolder', 'cardExpiry'];
    }
    return ['paymentMethod', 'sbpPhone'];
  };

  const goNext = async () => {
    try {
      const fields = step === 0
        ? ['organizationName', 'contactName', 'phone', 'email']
        : step === 1
          ? (deliveryMode === 'pickup' ? ['deliveryMode', 'deliveryDate'] : ['deliveryMode', 'deliveryAddress', 'deliveryDate'])
          : step === 2
            ? [...paymentFields(), 'comment']
            : [];
      await form.validateFields(fields);
      setStep((current) => Math.min(3, current + 1));
    } catch {
      message.error('Проверьте заполнение текущего шага');
    }
  };

  const submitOrder = async () => {
    try {
      if (!cart.length) {
        message.warning('Корзина пуста');
        return;
      }
      const values = checkoutSchema.parse(form.getFieldsValue(true));
      if (values.deliveryMode !== 'pickup' && !values.deliveryAddress) {
        message.error('Укажите адрес доставки');
        return;
      }
      if (values.paymentMethod === 'invoice' && (!values.payerInn || !values.payerAccount || !values.payerBank || !values.payerBik)) {
        message.error('Заполните ИНН, расчетный счет, банк и БИК');
        return;
      }
      if (values.paymentMethod === 'card' && (!values.cardNumber || !values.cardHolder || !values.cardExpiry)) {
        message.error('Заполните данные карты');
        return;
      }
      if (values.paymentMethod === 'sbp' && !values.sbpPhone) {
        message.error('Укажите телефон для СБП');
        return;
      }

      const order = await checkout(values.paymentMethod, values.deliveryMode, 0);
      message.success(`Заказ ${order.id.slice(0, 8)} создан. Продавцу отправлено уведомление.`);
      navigate('/orders');
    } catch (error) {
      if (error instanceof z.ZodError) {
        message.error(error.issues[0]?.message ?? 'Проверьте форму');
      } else {
        message.error(error instanceof Error ? error.message : 'Не удалось создать заказ');
      }
    }
  };

  const deliveryDateText = deliveryDate && typeof deliveryDate?.format === 'function'
    ? deliveryDate.format('DD.MM.YYYY')
    : deliveryDate
      ? dayjs(deliveryDate).format('DD.MM.YYYY')
      : 'Не указана';

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Оформление заказа</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Данные покупателя подставляются из профиля, реквизиты разбиты по полям, доставка считается по условиям сделки без отдельной ручной стоимости.
        </Typography.Paragraph>
      </Card>

      <Card>
        <Steps
          current={step}
          items={stepTitles.map((title, index) => ({
            title,
            description: index === 0 ? 'Профиль покупателя' : index === 1 ? 'Способ поставки' : index === 2 ? 'Платежные данные' : 'Финальная проверка',
          }))}
          responsive
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title={stepTitles[step]}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                organizationName: currentUser?.name ?? '',
                contactName: currentUser?.name ?? '',
                phone: '',
                email: currentUser?.email ?? '',
                deliveryMode: 'pickup',
                deliveryAddress: '',
                deliveryDate: null,
                paymentMethod: 'invoice',
                payerInn: currentUser?.inn ?? '',
                payerKpp: '',
                payerAccount: '',
                payerBank: '',
                payerBik: '',
                cardNumber: '',
                cardHolder: '',
                cardExpiry: '',
                sbpPhone: '',
                comment: '',
              }}
            >
              {step === 0 && (
                <Row gutter={12}>
                  <Col xs={24}>
                    <Alert type="info" showIcon message="Организация подставлена из профиля" description="При необходимости можно уточнить название для конкретной сделки." style={{ marginBottom: 12 }} />
                    <Form.Item name="organizationName" label="Организация" rules={[{ required: true, message: 'Укажите организацию' }]}>
                      <Input placeholder="ООО АгроТрейд" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="contactName" label="Контактное лицо" rules={[{ required: true, message: 'Укажите контактное лицо' }]}>
                      <Input placeholder="Иван Петров" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label="Телефон" rules={[{ required: true, message: 'Укажите телефон' }]}>
                      <Input placeholder="+7 (900) 000-00-00" onChange={(event) => form.setFieldValue('phone', normalizePhone(event.target.value))} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Укажите корректный email' }]}>
                      <Input placeholder="buyer@company.ru" onBlur={(event) => form.setFieldValue('email', event.target.value.trim().toLowerCase())} />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {step === 1 && (
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="deliveryMode" label="Способ поставки" rules={[{ required: true, message: 'Выберите способ поставки' }]}>
                      <Select
                        options={[
                          { value: 'pickup', label: 'Самовывоз' },
                          { value: 'seller_delivery', label: 'Доставка продавцом' },
                          { value: 'partner_delivery', label: 'Через перевозчика' },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="deliveryDate" label="Желаемая дата">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  {deliveryMode !== 'pickup' && (
                    <Col xs={24}>
                      <Form.Item name="deliveryAddress" label="Адрес доставки" rules={[{ required: true, message: 'Укажите адрес доставки' }]}>
                        <Input placeholder="Город, улица, склад, контакт на приемке" />
                      </Form.Item>
                    </Col>
                  )}
                  <Col xs={24}>
                    <Alert
                      type="success"
                      showIcon
                      message="Стоимость доставки убрана из оформления"
                      description="Логистика согласуется с продавцом/перевозчиком после создания сделки и не смешивается с суммой товара."
                    />
                  </Col>
                </Row>
              )}

              {step === 2 && (
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="paymentMethod" label="Способ оплаты" rules={[{ required: true, message: 'Выберите оплату' }]}>
                      <Select
                        options={[
                          { value: 'invoice', label: 'Счет для юрлица' },
                          { value: 'card', label: 'Банковская карта' },
                          { value: 'sbp', label: 'СБП' },
                        ]}
                      />
                    </Form.Item>
                  </Col>

                  {paymentMethod === 'invoice' && (
                    <>
                      <Col xs={24} md={12}>
                        <Form.Item name="payerInn" label="ИНН плательщика" rules={[{ required: true, message: 'Укажите ИНН' }]}>
                          <Input placeholder="10 или 12 цифр" onChange={(event) => form.setFieldValue('payerInn', onlyDigits(event.target.value, 12))} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="payerKpp" label="КПП">
                          <Input placeholder="9 цифр, если есть" onChange={(event) => form.setFieldValue('payerKpp', onlyDigits(event.target.value, 9))} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="payerAccount" label="Расчетный счет" rules={[{ required: true, message: 'Укажите расчетный счет' }]}>
                          <Input placeholder="20 цифр" onChange={(event) => form.setFieldValue('payerAccount', onlyDigits(event.target.value, 20))} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="payerBank" label="Банк" rules={[{ required: true, message: 'Укажите банк' }]}>
                          <Input placeholder="Наименование банка" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="payerBik" label="БИК" rules={[{ required: true, message: 'Укажите БИК' }]}>
                          <Input placeholder="9 цифр" onChange={(event) => form.setFieldValue('payerBik', onlyDigits(event.target.value, 9))} />
                        </Form.Item>
                      </Col>
                    </>
                  )}

                  {paymentMethod === 'card' && (
                    <>
                      <Col xs={24} md={12}>
                        <Form.Item name="cardNumber" label="Номер карты" rules={[{ required: true, message: 'Укажите номер карты' }]}>
                          <Input placeholder="0000 0000 0000 0000" onChange={(event) => form.setFieldValue('cardNumber', onlyDigits(event.target.value, 16).replace(/(.{4})/g, '$1 ').trim())} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="cardHolder" label="Владелец карты" rules={[{ required: true, message: 'Укажите владельца карты' }]}>
                          <Input placeholder="IVAN PETROV" onBlur={(event) => form.setFieldValue('cardHolder', event.target.value.trim().toUpperCase())} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item name="cardExpiry" label="Срок действия" rules={[{ required: true, message: 'Укажите срок действия' }]}>
                          <Input placeholder="MM/YY" />
                        </Form.Item>
                      </Col>
                    </>
                  )}

                  {paymentMethod === 'sbp' && (
                    <Col xs={24} md={12}>
                      <Form.Item name="sbpPhone" label="Телефон для СБП" rules={[{ required: true, message: 'Укажите телефон СБП' }]}>
                        <Input placeholder="+7 (900) 000-00-00" onChange={(event) => form.setFieldValue('sbpPhone', normalizePhone(event.target.value))} />
                      </Form.Item>
                    </Col>
                  )}

                  <Col xs={24}>
                    <Form.Item name="comment" label="Комментарий к сделке">
                      <Input.TextArea rows={4} placeholder="Особые условия, пожелания по отгрузке, контактный слот" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {step === 3 && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {cart.length === 0 ? <Alert type="warning" showIcon message="Корзина пуста" description="Добавьте лоты перед оформлением." /> : null}
                  <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Организация">{organizationName}</Descriptions.Item>
                    <Descriptions.Item label="Контакт">{contactName}</Descriptions.Item>
                    <Descriptions.Item label="Телефон">{phone}</Descriptions.Item>
                    <Descriptions.Item label="Email">{email}</Descriptions.Item>
                    <Descriptions.Item label="Поставка">{deliveryLabels[String(deliveryMode)] ?? String(deliveryMode)}</Descriptions.Item>
                    <Descriptions.Item label="Дата поставки">{deliveryDateText}</Descriptions.Item>
                    <Descriptions.Item label="Адрес">{deliveryAddress || 'Не требуется'}</Descriptions.Item>
                    <Descriptions.Item label="Оплата">{paymentLabels[String(paymentMethod)] ?? String(paymentMethod)}</Descriptions.Item>
                    {paymentMethod === 'invoice' && <Descriptions.Item label="ИНН / КПП">{payerInn}{payerKpp ? ` / ${payerKpp}` : ''}</Descriptions.Item>}
                    {paymentMethod === 'invoice' && <Descriptions.Item label="Банк и счет">{payerBank}, БИК {payerBik}, р/с {payerAccount}</Descriptions.Item>}
                    {paymentMethod === 'card' && <Descriptions.Item label="Карта">{cardNumber ? `**** ${cardNumber.slice(-4)}` : 'Не указана'} · {cardHolder} · {cardExpiry}</Descriptions.Item>}
                    {paymentMethod === 'sbp' && <Descriptions.Item label="Телефон СБП">{sbpPhone}</Descriptions.Item>}
                    <Descriptions.Item label="Комментарий">{comment || 'Нет'}</Descriptions.Item>
                  </Descriptions>

                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={cart}
                    columns={[
                      { title: 'Лот', dataIndex: 'lotTitle', key: 'lotTitle' },
                      { title: 'Продавец', dataIndex: 'sellerName', key: 'sellerName' },
                      { title: 'Кол-во', dataIndex: 'quantity', key: 'quantity' },
                      { title: 'Цена', dataIndex: 'unitPrice', key: 'unitPrice', render: (value: number) => `${value.toLocaleString('ru-RU')} ₽` },
                      { title: 'Сумма', dataIndex: 'subtotal', key: 'subtotal', render: (value: number) => `${value.toLocaleString('ru-RU')} ₽` },
                    ]}
                  />

                  <Alert
                    type="info"
                    showIcon
                    message={`Итого по товарам: ${total.toLocaleString('ru-RU')} ₽`}
                    description="После отправки заказ появится у покупателя и у продавца, а продавец получит уведомление."
                  />
                </Space>
              )}

              <Space style={{ marginTop: 16 }}>
                <Button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Назад</Button>
                {step < 3 ? <Button type="primary" onClick={() => void goNext()}>Далее</Button> : <Button type="primary" onClick={() => void submitOrder()}>Отправить заявку</Button>}
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Сводка заказа">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text>Позиций: {cart.length}</Typography.Text>
              <Typography.Text strong>Товары: {total.toLocaleString('ru-RU')} ₽</Typography.Text>
              <Typography.Text type="secondary">Доставка: согласуется отдельно</Typography.Text>
              <Typography.Title level={4} style={{ margin: 0 }}>
                Итого: {total.toLocaleString('ru-RU')} ₽
              </Typography.Title>
            </Space>
          </Card>
        </Col>
      </Row>
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
          <Card title="Документы сделки" style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/documents')}>Центр документов</Button>
              <Button onClick={() => navigate('/deals')}>Открыть сделку</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Параметры заказа">
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Способ оплаты">{order.paymentMethod === 'card' ? 'Банковская карта' : order.paymentMethod === 'sbp' ? 'СБП' : 'Счет для юрлица'}</Descriptions.Item>
              <Descriptions.Item label="Доставка">{order.deliveryMode === 'pickup' ? 'Самовывоз' : order.deliveryMode === 'seller_delivery' ? 'Доставка продавцом' : 'Через перевозчика'}</Descriptions.Item>
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

export function DocumentsPage() {
  const orders = useAppStore((state) => state.orders);
  const sellerApplications = useAppStore((state) => state.sellerApplications);
  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const [type, setType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [query, setQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const currentUser = users.find((user) => user.id === currentUserId);
  const documentRows = useMemo(() => {
    const orderDocs = orders.flatMap((order) => [
      {
        id: `contract-${order.id}`,
        type: 'Договор поставки',
        counterparty: order.items.map((item) => item.sellerName).join(', '),
        status: order.status === 'created' ? 'Ожидает согласования' : 'Подписан',
        date: dayjs(order.createdAt).format('DD.MM.YYYY'),
        source: 'order',
        order,
        text: `Договор поставки по заказу ${order.id.slice(0, 8)}. Покупатель: ${currentUser?.name ?? 'Пользователь'}. Продавцы: ${order.items.map((item) => item.sellerName).join(', ')}. Сумма: ${order.total.toLocaleString('ru-RU')} ₽.`,
      },
      {
        id: `invoice-${order.id}`,
        type: 'Счет на оплату',
        counterparty: order.items.map((item) => item.sellerName).join(', '),
        status: order.status === 'created' ? 'Сформирован' : 'Оплачен',
        date: dayjs(order.createdAt).format('DD.MM.YYYY'),
        source: 'order',
        order,
        text: `Счет на оплату по заказу ${order.id.slice(0, 8)}. Итого: ${order.total.toLocaleString('ru-RU')} ₽. Способ оплаты: ${order.paymentMethod}.`,
      },
    ]);

    const applicationDocs = sellerApplications
      .filter((application) => application.userId === currentUserId)
      .map((application) => ({
        id: `seller-${application.id}`,
        type: 'Подтверждение продавца',
        counterparty: application.companyName,
        status: application.status === 'approved' ? 'Подтверждено' : application.status === 'rejected' ? 'Отклонено' : 'На проверке',
        date: dayjs(application.submittedAt).format('DD.MM.YYYY'),
        source: 'verification',
        application,
        text: `Заявка на подтверждение документов. Компания: ${application.companyName}. ИНН: ${application.inn}. ОГРН: ${application.ogrn}. Статус: ${application.status}.`,
      }));

    return [...orderDocs, ...applicationDocs];
  }, [currentUser?.name, currentUserId, orders, sellerApplications]);

  const filteredRows = useMemo(
    () => documentRows.filter((row) => {
      if (type && row.source !== type) return false;
      if (status && !row.status.toLowerCase().includes(status.toLowerCase())) return false;
      if (query && !`${row.type} ${row.counterparty} ${row.status}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    }),
    [documentRows, query, status, type],
  );

  const downloadDocument = (row: any) => {
    const blob = new Blob([row.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${row.id}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Центр документов</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Документы формируются из реальных заказов и заявок профиля. Их можно открыть, проверить и скачать.
        </Typography.Paragraph>
      </Card>
      <Card title="Фильтры">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={6}><Select allowClear value={type} onChange={setType} placeholder="Тип документа" options={[{ value: 'verification', label: 'Проверка продавца' }, { value: 'order', label: 'Заказы и сделки' }]} style={{ width: '100%' }} /></Col>
          <Col xs={24} md={6}><Select allowClear value={status} onChange={setStatus} placeholder="Статус" options={[{ value: 'ожидает', label: 'Ожидает' }, { value: 'подписан', label: 'Подписан' }, { value: 'подтверждено', label: 'Подтверждено' }, { value: 'проверке', label: 'На проверке' }]} style={{ width: '100%' }} /></Col>
          <Col xs={24} md={8}><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Документ, контрагент, статус" /></Col>
          <Col xs={24} md={4}><Button block onClick={() => { setType(undefined); setStatus(undefined); setQuery(''); }}>Сбросить</Button></Col>
        </Row>
      </Card>
      <Card title="Документы">
        <Table
          rowKey="id"
          dataSource={filteredRows}
          locale={{ emptyText: 'Документы появятся после создания заказа или отправки заявки продавца' }}
          columns={[
            { title: 'Документ', dataIndex: 'type', key: 'type' },
            { title: 'Контрагент', dataIndex: 'counterparty', key: 'counterparty' },
            { title: 'Статус', dataIndex: 'status', key: 'status', render: (value: string) => <Tag color={value.includes('Отклон') ? 'red' : value.includes('Ожида') || value.includes('провер') ? 'gold' : 'green'}>{value}</Tag> },
            { title: 'Дата', dataIndex: 'date', key: 'date' },
            { title: 'Действие', key: 'action', render: (_, row) => <Space><Button type="link" onClick={() => setSelectedDoc(row)}>Открыть</Button><Button type="link" onClick={() => downloadDocument(row)}>Скачать</Button></Space> },
          ]}
        />
      </Card>
      <Modal
        title={selectedDoc?.type ?? 'Документ'}
        open={Boolean(selectedDoc)}
        onCancel={() => setSelectedDoc(null)}
        footer={[
          <Button key="download" onClick={() => selectedDoc && downloadDocument(selectedDoc)}>Скачать</Button>,
          <Button key="close" type="primary" onClick={() => setSelectedDoc(null)}>Закрыть</Button>,
        ]}
      >
        {selectedDoc && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Контрагент">{selectedDoc.counterparty}</Descriptions.Item>
              <Descriptions.Item label="Статус">{selectedDoc.status}</Descriptions.Item>
              <Descriptions.Item label="Дата">{selectedDoc.date}</Descriptions.Item>
            </Descriptions>
            <Alert type="info" showIcon message="Содержимое документа" description={selectedDoc.text} />
          </Space>
        )}
      </Modal>
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

export function AuctionInfoPage() {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="auction-info-hero section-card">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={12}>
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <Tag color="purple">Что такое аукцион</Tag>
              <Typography.Title level={1}>Торги, где цена растет по шагу и время решает исход</Typography.Title>
              <Typography.Paragraph className="lead-text">
                Аукцион на ZernoRU помогает продавцу получить лучшую цену за партию, а покупателю видеть реальную конкуренцию.
                Ставка мгновенно уходит на сервер, таймер показывает оставшееся время, а победитель определяется автоматически.
              </Typography.Paragraph>
              <Space wrap>
                <Tag color="green">Ставка по шагу</Tag>
                <Tag color="blue">Обратный отсчет</Tag>
                <Tag color="gold">История ставок</Tag>
                <Tag color="purple">Итог по завершении</Tag>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={12}>
            <div className="auction-info-hero__media">
              <img src="/images/thematic/image_24.jpg" alt="Зерновой аукцион" className="auction-info-hero__image" />
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card title="Как это работает">
            <Steps
              direction="vertical"
              current={3}
              items={[
                { title: 'Лот публикуется', description: 'Продавец включает аукцион и задает время завершения торгов.' },
                { title: 'Покупатели делают ставки', description: 'Каждая новая ставка должна быть не ниже шага.' },
                { title: 'Таймер идет вниз', description: 'Пока время не вышло, аукцион продолжается и обновляется.' },
                { title: 'Система определяет победителя', description: 'После окончания торгов сервер фиксирует лучшую ставку.' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Почему это удобно">
            <List
              dataSource={[
                'Видно, кто сейчас лидирует и на сколько выросла цена',
                'Не нужно обновлять страницу вручную',
                'История ставок помогает оценить конкуренцию',
                'После завершения видно, выиграли вы или нет',
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Правила торгов">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message="Минимальный шаг"
                description="Новая ставка должна быть выше текущей минимум на шаг аукциона."
              />
              <Alert
                type="success"
                showIcon
                message="Победитель"
                description="Когда таймер заканчивается, победителем становится последний лидер."
              />
              <Alert
                type="warning"
                showIcon
                message="Что делать после победы"
                description="Свяжитесь с продавцом, согласуйте документы и завершите сделку."
              />
            </Space>
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

export interface PriceArchiveRow {
  id: string;
  year: string;
  culture: string;
  region: string;
  currentPrice: number;
  previousPrice: number;
  archiveTrend: Array<{ step: string; price: number }>;
  source: PriceRecord;
}

export function buildArchiveRows(prices: PriceRecord[]): PriceArchiveRow[] {
  return prices.flatMap((record, index) => {
    const yearlyShift = index % 2 === 0 ? 0.91 : 0.94;
    const years = ['2026', '2025'];

    return years.map((year, yearIndex) => {
      const adjustedRecord = {
        ...record,
        day: Math.round(record.day * (yearIndex === 0 ? 1 : yearlyShift)),
        weekChange: Math.round(record.weekChange * (yearIndex === 0 ? 1 : 0.85) * 10) / 10,
      };
      const currentPrice = adjustedRecord.day;
      const previousPrice = Math.max(1, Math.round(currentPrice - adjustedRecord.weekChange * 2.2));

      return {
        id: `${record.id}-${year}`,
        year,
        culture: adjustedRecord.culture,
        region: adjustedRecord.region,
        currentPrice,
        previousPrice,
        archiveTrend: buildPriceArchiveSeries(adjustedRecord, year === '2026' ? 'month' : 'quarter'),
        source: record,
      };
    });
  });
}

export function PriceArchivePage() {
  const navigate = useNavigate();
  const prices = useAppStore((state) => state.prices);
  const [year, setYear] = useState<string | undefined>('2026');
  const [culture, setCulture] = useState<string | undefined>();
  const [region, setRegion] = useState<string | undefined>();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const archiveRows = useMemo(() => buildArchiveRows(prices), [prices]);

  const filteredRows = useMemo(() => {
    return archiveRows.filter((row) => {
      if (year && row.year !== year) return false;
      if (culture && row.culture !== culture) return false;
      if (region && row.region !== region) return false;
      return true;
    });
  }, [archiveRows, culture, region, year]);

  const selectedRow = filteredRows[0] ?? archiveRows[0];
  const chartData = selectedRow ? buildPriceArchiveSeries(selectedRow.source, period) : [];

  const cultureOptions = [...new Set(archiveRows.map((row) => row.culture))];
  const regionOptions = [...new Set(archiveRows.map((row) => row.region))];
  const yearOptions = [...new Set(archiveRows.map((row) => row.year))];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Архив цен</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Архив строится из тех же рыночных записей, что и основная страница цен, поэтому фильтры и карточка детализации остаются согласованными.
        </Typography.Paragraph>
      </Card>

      <Card title="Параметры архива">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={6}>
            <Select
              allowClear
              placeholder="Год"
              value={year}
              onChange={setYear}
              options={yearOptions.map((value) => ({ value, label: value }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              allowClear
              placeholder="Культура"
              value={culture}
              onChange={setCulture}
              options={cultureOptions.map((value) => ({ value, label: value }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              allowClear
              placeholder="Регион"
              value={region}
              onChange={setRegion}
              options={regionOptions.map((value) => ({ value, label: value }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'week', label: 'Недели' },
                { value: 'month', label: 'Месяцы' },
                { value: 'quarter', label: 'Кварталы' },
              ]}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
        <Typography.Text type="secondary">Найдено записей: {filteredRows.length}</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Исторические значения">
            {selectedRow ? (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" />
                    <YAxis width={80} />
                    <Tooltip formatter={(value: unknown) => `${Number(value ?? 0).toLocaleString('ru-RU')} ₽/т`} />
                    <Legend />
                    <Line type="monotone" dataKey="price" stroke="#2f6f3e" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="Нет данных по выбранным фильтрам" />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Выбранная запись">
            {selectedRow ? (
              <Space direction="vertical" size={8}>
                <Typography.Title level={3} style={{ margin: 0 }}>{selectedRow.culture}</Typography.Title>
                <Typography.Text type="secondary">{selectedRow.region} · {selectedRow.year}</Typography.Text>
                <Typography.Text strong>{selectedRow.currentPrice.toLocaleString('ru-RU')} ₽/т</Typography.Text>
                <Typography.Text type="secondary">
                  Предыдущий период: {selectedRow.previousPrice.toLocaleString('ru-RU')} ₽/т
                </Typography.Text>
                <Button type="link" onClick={() => navigate(`/prices/${priceSlugForRecord(selectedRow.source)}`)} style={{ padding: 0, height: 'auto' }}>
                  Открыть детальную цену
                </Button>
              </Space>
            ) : (
              <Empty description="Нет выбранной записи" />
            )}
          </Card>

          <Card title="Сводка" style={{ marginTop: 16 }}>
            <Table
              rowKey="id"
              pagination={{ pageSize: 6 }}
              dataSource={filteredRows}
              columns={[
                { title: 'Культура', dataIndex: 'culture', key: 'culture' },
                { title: 'Год', dataIndex: 'year', key: 'year' },
                {
                  title: 'Цена',
                  dataIndex: 'currentPrice',
                  key: 'currentPrice',
                  render: (value: number) => `${value.toLocaleString('ru-RU')} ₽/т`,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
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
