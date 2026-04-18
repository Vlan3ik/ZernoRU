import { CalculatorOutlined, CarOutlined, EnvironmentOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { logisticsService } from '../services/logisticsService';
import { DeliveryMode } from '../types/domain';

const deliveryModes: { value: DeliveryMode; label: string }[] = [
  { value: 'pickup', label: 'Самовывоз' },
  { value: 'seller_delivery', label: 'Доставка продавцом' },
  { value: 'partner_delivery', label: 'Партнерская перевозка' },
];

export function LogisticsPage() {
  const { sub } = useParams();
  const [distance, setDistance] = useState(620);
  const [volume, setVolume] = useState(120);
  const [mode, setMode] = useState<DeliveryMode>('seller_delivery');
  const [fromPoint, setFromPoint] = useState('Смоленская область');
  const [toPoint, setToPoint] = useState('Порт Новороссийск');
  const [cargoType, setCargoType] = useState('Пшеница 3 класса');
  const [deadline, setDeadline] = useState('До 3 суток');
  const [insurance, setInsurance] = useState('Да');
  const [quoteReady, setQuoteReady] = useState(false);

  const quote = useMemo(() => logisticsService.calculate(distance, volume, mode), [distance, mode, volume]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Логистика</Typography.Title>
        {sub && <Tag color="blue">Подраздел: {sub}</Tag>}
        <Typography.Paragraph className="lead-text">
          Расчет стоимости и ETA, структура тарифа, риски и ограничения. Поддерживаются самовывоз, автодоставка,
          ж/д перевозка, доставка продавцом и партнерская перевозка.
        </Typography.Paragraph>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={11}>
          <Card title="Расчет перевозки" extra={<CalculatorOutlined />}>
            <Form layout="vertical" onFinish={() => setQuoteReady(true)}>
              <Form.Item label="Место отправления">
                <Select
                  value={fromPoint}
                  onChange={setFromPoint}
                  options={['Смоленская область', 'Белгородская область', 'Ростовская область'].map((value) => ({ value, label: value }))}
                />
              </Form.Item>
              <Form.Item label="Место назначения">
                <Select
                  value={toPoint}
                  onChange={setToPoint}
                  options={['Порт Новороссийск', 'Порт Тамань', 'Элеватор Воронеж'].map((value) => ({ value, label: value }))}
                />
              </Form.Item>
              <Form.Item label="Тип груза">
                <Select
                  value={cargoType}
                  onChange={setCargoType}
                  options={['Пшеница 3 класса', 'Пшеница 4 класса', 'Кукуруза', 'Ячмень'].map((value) => ({ value, label: value }))}
                />
              </Form.Item>
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Form.Item label="Объем, т">
                    <InputNumber min={1} max={5000} value={volume} onChange={(value) => setVolume(Number(value ?? 1))} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Расстояние, км">
                    <InputNumber min={1} max={5000} value={distance} onChange={(value) => setDistance(Number(value ?? 1))} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Способ перевозки">
                <Select value={mode} onChange={setMode} options={deliveryModes} />
              </Form.Item>
              <Form.Item label="Требования к сроку">
                <Select
                  value={deadline}
                  onChange={setDeadline}
                  options={['До 2 суток', 'До 3 суток', 'До 5 суток'].map((value) => ({ value, label: value }))}
                />
              </Form.Item>
              <Form.Item label="Страховка">
                <Select value={insurance} onChange={setInsurance} options={['Да', 'Нет'].map((value) => ({ value, label: value }))} />
              </Form.Item>
              <Button htmlType="submit" type="primary" block>
                Рассчитать
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={13}>
          <Card title="Результат расчета" extra={quoteReady ? <Tag color="green">Расчет готов</Tag> : <Tag>Предпросмотр</Tag>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic title="Итоговая стоимость" value={quote.price} formatter={(value) => `${Number(value).toLocaleString('ru-RU')} ?`} />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="Ориентировочный срок" value={quote.etaDays} suffix="дня" />
              </Col>
              <Col xs={24} md={8}>
                <Statistic title="Цена за тонну" value={Math.round(quote.price / Math.max(1, volume))} formatter={(value) => `${Number(value).toLocaleString('ru-RU')} ?/т`} />
              </Col>
            </Row>

            <Card className="nested-card" style={{ marginTop: 16 }}>
              <Space direction="vertical" size={8}>
                <Typography.Text strong>Структура тарифа</Typography.Text>
                <Typography.Text>Базовая перевозка: {(quote.price * 0.74).toLocaleString('ru-RU')} ?</Typography.Text>
                <Typography.Text>Погрузка/разгрузка: {(quote.price * 0.12).toLocaleString('ru-RU')} ?</Typography.Text>
                <Typography.Text>Страхование: {(quote.price * 0.06).toLocaleString('ru-RU')} ?</Typography.Text>
                <Typography.Text>Оформление и сопровождение: {(quote.price * 0.08).toLocaleString('ru-RU')} ?</Typography.Text>
              </Space>
            </Card>

            <Card className="nested-card" style={{ marginTop: 12 }}>
              <Space direction="vertical" size={8}>
                <Typography.Text strong>Риски и ограничения</Typography.Text>
                <Typography.Text>Возможная очередь на терминале: до 12 часов.</Typography.Text>
                <Typography.Text>Ограничение по осевой нагрузке на участке маршрута.</Typography.Text>
                <Typography.Text>Рекомендуется резервирование слотов за 48 часов.</Typography.Text>
              </Space>
            </Card>
          </Card>

          <Card title="Этапы сделки" style={{ marginTop: 16 }}>
            <Steps
              direction="vertical"
              current={2}
              items={[
                { title: 'Запрос расчета', description: `${fromPoint} > ${toPoint}` },
                { title: 'Подтверждение тарифа', description: 'Согласование условий' },
                { title: 'Подача транспорта', description: 'Плановый выход на маршрут' },
                { title: 'Отгрузка и контроль', description: 'Мониторинг статусов' },
                { title: 'Закрытие сделки', description: 'Документы и оплата' },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <Card title="Типовые маршруты" extra={<EnvironmentOutlined />}>
            <Table
              rowKey="route"
              pagination={false}
              dataSource={[
                { route: 'Смоленск > Новороссийск', mode: 'Ж/д + авто', eta: '2,6 дня', price: '2 480 ?/т' },
                { route: 'Воронеж > Тамань', mode: 'Автодоставка', eta: '1,9 дня', price: '2 120 ?/т' },
                { route: 'Курск > Азов', mode: 'Ж/д', eta: '2,1 дня', price: '2 240 ?/т' },
              ]}
              columns={[
                { title: 'Маршрут', dataIndex: 'route', key: 'route' },
                { title: 'Тип перевозки', dataIndex: 'mode', key: 'mode' },
                { title: 'Срок', dataIndex: 'eta', key: 'eta' },
                { title: 'Тариф', dataIndex: 'price', key: 'price' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Перевозчики и действия" extra={<CarOutlined />}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Card className="nested-card">ООО ТрансЗерно · 14 машин · Рейтинг 4,7</Card>
              <Card className="nested-card">ЛогистикСервис · Ж/д экспедирование · Рейтинг 4,6</Card>
              <Card className="nested-card">АгроМаршрут · Портовая доставка · Рейтинг 4,8</Card>
              <Button type="primary" icon={<SafetyCertificateOutlined />}>Отправить запрос перевозчикам</Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

