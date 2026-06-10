import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Card, Col, Descriptions, Row, Space, Table, Tag, Tabs, Typography } from 'antd';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lotImageMap } from '../data/mediaAssets';
import { useAppStore } from '../store/appStore';
import { formatRubles, formatRublesPerTon } from '../utils/format';

export function LotDetailPage() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const addToCart = useAppStore((state) => state.addToCart);

  const lot = useMemo(() => grainLots.find((item) => item.id === lotId) ?? equipmentLots.find((item) => item.id === lotId) ?? grainLots[0], [equipmentLots, grainLots, lotId]);
  const isGrain = lot.category === 'grain';
  const gallery = [lot.coverImageUrl ?? lotImageMap[lot.id]?.[0] ?? '/images/thematic/image_01.jpg', ...(lotImageMap[lot.id] ?? []).slice(1)];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Breadcrumb items={[{ title: <Typography.Link onClick={() => navigate('/')}>Главная</Typography.Link> }, { title: <Typography.Link onClick={() => navigate('/marketplace')}>Торговая площадка</Typography.Link> }, { title: lot.title }]} />

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Tag color="green">{isGrain ? 'Зерновой лот' : 'Лот техники'}</Tag>
                <Tag color={isGrain ? 'processing' : 'blue'}>{isGrain ? 'В продаже' : 'На аукционе'}</Tag>
                <Tag color="success" icon={<CheckCircleOutlined />}>Проверенный участник</Tag>
              </Space>
              <Typography.Title level={1}>{lot.title}</Typography.Title>
              <Typography.Paragraph className="lead-text">{isGrain ? 'Партия доступна для прямой продажи или участия в торгах. Условия поставки и оплаты доступны в карточке.' : 'Техника доступна для осмотра, возможна доставка и лизинг по согласованию.'}</Typography.Paragraph>

              <Row gutter={[10, 10]}>
                <Col xs={24} md={15}><img src={gallery[0]} alt={lot.title} className="lot-image-main" /></Col>
                <Col xs={24} md={9}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {gallery.slice(1).map((src) => <img key={src} src={src} alt="документ или фото" className="lot-image-thumb" />)}
                  </Space>
                </Col>
              </Row>
            </Space>
          </Card>

          <Card title="Ключевые характеристики" style={{ marginTop: 16 }}>
            {isGrain ? (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Цена">{formatRublesPerTon(lot.pricePerTon)}</Descriptions.Item>
                <Descriptions.Item label="Объем">{lot.volumeTons} т</Descriptions.Item>
                <Descriptions.Item label="Регион">{lot.region}</Descriptions.Item>
                <Descriptions.Item label="Точка отгрузки">Элеватор участника</Descriptions.Item>
                <Descriptions.Item label="Протеин">14,1%</Descriptions.Item>
                <Descriptions.Item label="Клейковина">25%</Descriptions.Item>
                <Descriptions.Item label="Влажность">12,5%</Descriptions.Item>
                <Descriptions.Item label="Натура">770 г/л</Descriptions.Item>
                <Descriptions.Item label="Условия оплаты">Безналичный расчет, отсрочка 5 дней</Descriptions.Item>
                <Descriptions.Item label="Место хранения">Элеватор, крытое хранение</Descriptions.Item>
              </Descriptions>
            ) : (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Цена">{formatRubles(lot.price)}</Descriptions.Item>
                <Descriptions.Item label="Марка">{lot.brand}</Descriptions.Item>
                <Descriptions.Item label="Год">{lot.year}</Descriptions.Item>
                <Descriptions.Item label="Состояние">{lot.condition === 'new' ? 'Новая' : 'Б/у'}</Descriptions.Item>
                <Descriptions.Item label="Наработка">1100 м/ч</Descriptions.Item>
                <Descriptions.Item label="Комплектация">Базовая + жатка</Descriptions.Item>
                <Descriptions.Item label="История обслуживания">Регламентное ТО подтверждено</Descriptions.Item>
                <Descriptions.Item label="Документы">ПСМ, договор купли-продажи</Descriptions.Item>
                <Descriptions.Item label="Условия осмотра">По записи, рабочие дни</Descriptions.Item>
                <Descriptions.Item label="Способ оплаты">Безналичный расчет, лизинг</Descriptions.Item>
              </Descriptions>
            )}
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Tabs
              items={[
                { key: 'desc', label: 'Описание партии', children: <Typography.Paragraph>{lot.description}</Typography.Paragraph> },
                { key: 'quality', label: 'Показатели качества', children: <Typography.Paragraph>Протеин, клейковина, влажность, натура и лабораторные показатели доступны в документах.</Typography.Paragraph> },
                { key: 'docs', label: 'Документы', children: <Space wrap><Tag icon={<FileTextOutlined />}>Сертификаты</Tag><Tag icon={<FileTextOutlined />}>Договор поставки</Tag><Tag icon={<FileTextOutlined />}>Лабораторный акт</Tag></Space> },
                { key: 'payment', label: 'Условия оплаты', children: <Typography.Paragraph>Безналичный расчет, отсрочка до 5 дней для проверенных покупателей.</Typography.Paragraph> },
                { key: 'shipment', label: 'Условия отгрузки', children: <Typography.Paragraph>Окно отгрузки: 10:00–16:00, возможность погрузки в авто и ж/д.</Typography.Paragraph> },
                { key: 'seller', label: 'Продавец', children: <Typography.Paragraph>Рейтинг 4,8 / 5. Статус проверки: одобрено.</Typography.Paragraph> },
                { key: 'logistics', label: 'Логистика', children: <Typography.Paragraph>Оценка перевозки: 2 480 ₽/т, срок 2,3 дня.</Typography.Paragraph> },
                { key: 'history', label: 'История обновлений', children: <Typography.Paragraph>Последнее обновление: сегодня в 10:15. Изменена цена и условия отгрузки.</Typography.Paragraph> },
                { key: 'similar', label: 'Похожие лоты', children: <Space direction="vertical">{(isGrain ? grainLots : equipmentLots).filter((item) => item.id !== lot.id).slice(0, 3).map((item) => <Typography.Link key={item.id} onClick={() => navigate(`/marketplace/lot/${item.id}`)}>{item.title}</Typography.Link>)}</Space> },
              ]}
            />
          </Card>

          <Card title="История цены и ставок" style={{ marginTop: 16 }}>
            <Table rowKey="period" pagination={false} dataSource={[{ period: 'Сегодня', price: isGrain ? lot.pricePerTon : lot.price, change: '+1,3%' }, { period: 'Неделя', price: isGrain ? Math.max(1, lot.pricePerTon - 280) : Math.max(1, lot.price - 120000), change: '+3,1%' }, { period: 'Месяц', price: isGrain ? Math.max(1, lot.pricePerTon - 640) : Math.max(1, lot.price - 260000), change: '+4,8%' }]} columns={[{ title: 'Период', dataIndex: 'period', key: 'period' }, { title: 'Цена', dataIndex: 'price', key: 'price', render: (value: number) => isGrain ? formatRublesPerTon(value) : formatRubles(value) }, { title: 'Изменение', dataIndex: 'change', key: 'change' }]} />
            <Card className="auction-card" style={{ marginTop: 12 }}>
              <Space direction="vertical" size={6}>
                <Typography.Text strong>Аукционный блок</Typography.Text>
                <Typography.Text>Текущая ставка: {isGrain ? formatRublesPerTon(lot.pricePerTon + 300) : formatRubles(lot.price + 90000)}</Typography.Text>
                <Typography.Text>Шаг торгов: {isGrain ? '50 ₽/т' : '10 000 ₽'}</Typography.Text>
                <Typography.Text>До окончания: 04:21:14</Typography.Text>
                <Typography.Text>Количество ставок: 12</Typography.Text>
                <Button type="primary" icon={<ClockCircleOutlined />}>Сделать ставку</Button>
              </Space>
            </Card>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="sticky-actions-card" title="Действия по лоту">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Title level={2}>{isGrain ? formatRublesPerTon(lot.pricePerTon) : formatRubles(lot.price)}</Typography.Title>
              <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => addToCart(lot)} block>Начать сделку</Button>
              <Button icon={<MessageOutlined />} block onClick={() => navigate('/messages')}>Запросить условия</Button>
              <Button icon={<PhoneOutlined />} block onClick={() => navigate('/messages')}>Связаться с продавцом</Button>
              <Button block onClick={() => navigate('/logistics')}>Рассчитать доставку</Button>
              <Button block onClick={() => navigate('/favorites')}>Добавить в избранное</Button>
            </Space>
          </Card>

          <Card title="Продавец" style={{ marginTop: 16 }}>
            <Space direction="vertical" size={6}>
              <Typography.Text strong>{lot.sellerName}</Typography.Text>
              <Typography.Text>Рейтинг: 4,8 / 5</Typography.Text>
              <Typography.Text>Статус проверки: Одобрено</Typography.Text>
              <Typography.Link onClick={() => navigate('/organizations')}>Открыть профиль организации</Typography.Link>
            </Space>
          </Card>

          <Card title="Логистический расчет" style={{ marginTop: 16 }}>
            <Typography.Paragraph>Оценка перевозки до пункта назначения: 2 480 ₽/т, срок 2,3 дня. Включены погрузка, страхование и оформление документов.</Typography.Paragraph>
            <Button block onClick={() => navigate('/logistics')}>Открыть логистику</Button>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
