import {
  CheckCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Modal, Row, Space, Table, Tag, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lotImageMap } from '../data/mediaAssets';
import { AuctionBidPanel } from '../components/marketplace/AuctionBidPanel';
import { useAppStore } from '../store/appStore';
import { EquipmentLot, GrainLot, ServiceLot } from '../types/domain';

function resolveGallery(lot: GrainLot | EquipmentLot | ServiceLot) {
  return [lot.coverImageUrl, ...(lotImageMap[lot.id] ?? []), '/images/thematic/image_01.jpg'].filter(Boolean) as string[];
}

function downloadDocuments(lot: GrainLot | EquipmentLot | ServiceLot) {
  const lines = [
    `Лот: ${lot.title}`,
    `Продавец: ${lot.sellerName}`,
    `Регион: ${lot.region}`,
    `Описание: ${lot.description}`,
  ];

  if (lot.category === 'grain') {
    lines.push(
      `Сертификат Меркурий: ${lot.mercuryCertificate}`,
      `Декларация соответствия: ${lot.declarationOfConformity}`,
      `Договор хранения: ${lot.storageContract}`,
    );
  } else if (lot.category === 'service') {
    lines.push(`Тип услуги: ${lot.serviceType}`, `Единица: ${lot.unit}`);
  } else {
    lines.push('ПСМ: приложен к карточке', 'Договор купли-продажи: приложен к карточке');
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lot.id}-documents.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function LotDetailPage() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const serviceLots = useAppStore((state) => state.serviceLots);
  const auctionSummaries = useAppStore((state) => state.auctionSummaries);
  const users = useAppStore((state) => state.users);
  const addToCart = useAppStore((state) => state.addToCart);
  const currentUserId = useAppStore((state) => state.currentUserId);

  const lot = useMemo(
    () => grainLots.find((item) => item.id === lotId) ?? equipmentLots.find((item) => item.id === lotId) ?? serviceLots.find((item) => item.id === lotId) ?? grainLots[0],
    [equipmentLots, grainLots, lotId, serviceLots],
  );
  const [contactOpen, setContactOpen] = useState(false);

  if (!lot) {
    return null;
  }

  const isGrain = lot.category === 'grain';
  const isService = lot.category === 'service';
  const grainLot = isGrain ? lot : null;
  const seller = users.find((user) => user.id === lot.sellerId);
  const gallery = resolveGallery(lot);
  const auctionSummary = grainLot?.auctionEnabled ? auctionSummaries.find((item) => item.lotId === lot.id) ?? null : null;
  const currentAuctionBid = auctionSummary?.currentHighestBid ?? grainLot?.pricePerTon ?? 0;

  const contactCards = [
    { label: 'Email', value: seller?.email ?? `${lot.sellerId}@zerno.local` },
    { label: 'Регион', value: seller?.region ?? lot.region },
    { label: 'Статус', value: seller?.sellerVerificationStatus ?? (seller?.isVerifiedSeller ? 'approved' : 'pending') },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Tag color="green">{isGrain ? 'Зерновой лот' : isService ? 'Лот услуги' : 'Лот техники'}</Tag>
                <Tag color={isGrain ? 'processing' : 'blue'}>{isGrain ? 'В продаже' : isService ? 'Услуга' : 'На витрине'}</Tag>
                <Tag color="success" icon={<CheckCircleOutlined />}>Проверенный продавец</Tag>
              </Space>
              <Typography.Title level={1}>{lot.title}</Typography.Title>
              <Typography.Paragraph className="lead-text">
                {isGrain
                  ? 'Карточка лота сделана как в макете: главный визуал, характеристики, документы, сделки и продавец.'
                  : isService
                    ? 'Карточка услуги показывает файлы, условия и контакт для согласования заявки.'
                    : 'Карточка техники показывает состояние, характеристики, документы и быстрый переход к сделке.'}
              </Typography.Paragraph>

              <div>
                <img src={gallery[0]} alt={lot.title} className="lot-image-main" />
              </div>
            </Space>
          </Card>

          <Card title="Ключевые характеристики" style={{ marginTop: 16 }}>
            {isGrain ? (
              <Descriptions column={2} bordered>
                <Descriptions.Item label={grainLot?.auctionEnabled ? 'Начальная ставка' : 'Цена'}>{lot.pricePerTon.toLocaleString('ru-RU')} ₽/т</Descriptions.Item>
                <Descriptions.Item label="Объем">{lot.volumeTons} т</Descriptions.Item>
                <Descriptions.Item label="Регион">{lot.region}</Descriptions.Item>
                <Descriptions.Item label="Точка отгрузки">Элеватор продавца</Descriptions.Item>
                <Descriptions.Item label="Протеин">14,1%</Descriptions.Item>
                <Descriptions.Item label="Клейковина">25%</Descriptions.Item>
                <Descriptions.Item label="Влажность">12,5%</Descriptions.Item>
                <Descriptions.Item label="Натура">770 г/л</Descriptions.Item>
                <Descriptions.Item label="Условия оплаты">Безналичный расчет, отсрочка 5 дней</Descriptions.Item>
                <Descriptions.Item label="Место хранения">Элеватор, крытое хранение</Descriptions.Item>
              </Descriptions>
            ) : isService ? (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Цена">{lot.price.toLocaleString('ru-RU')} ₽</Descriptions.Item>
                <Descriptions.Item label="Тип услуги">{lot.serviceType}</Descriptions.Item>
                <Descriptions.Item label="Единица">{lot.unit}</Descriptions.Item>
                <Descriptions.Item label="Регион">{lot.region}</Descriptions.Item>
                <Descriptions.Item label="Файлы">{lot.attachments?.length ? `${lot.attachments.length} шт.` : 'Загружены'}</Descriptions.Item>
                <Descriptions.Item label="Формат">По заявке</Descriptions.Item>
              </Descriptions>
            ) : (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Цена">{lot.price.toLocaleString('ru-RU')} ₽</Descriptions.Item>
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
                { key: 'quality', label: 'Показатели качества', children: <Typography.Paragraph>Показатели и документы доступны для скачивания и проверки перед сделкой.</Typography.Paragraph> },
                {
                  key: 'docs',
                  label: 'Документы',
                  children: (
                    <Space wrap>
                      <Tag icon={<FileTextOutlined />}>Сертификаты</Tag>
                      <Tag icon={<FileTextOutlined />}>Договор поставки</Tag>
                      <Tag icon={<FileTextOutlined />}>Лабораторный акт</Tag>
                    </Space>
                  ),
                },
                { key: 'payment', label: 'Условия оплаты', children: <Typography.Paragraph>Безналичный расчет, отсрочка до 5 дней для проверенных покупателей.</Typography.Paragraph> },
                { key: 'shipment', label: 'Условия отгрузки', children: <Typography.Paragraph>Окно отгрузки: 10:00–16:00, возможность погрузки в авто и ж/д.</Typography.Paragraph> },
                {
                  key: 'seller',
                  label: 'Продавец',
                  children: (
                    <Space direction="vertical">
                      <Typography.Paragraph>Рейтинг 4,8 / 5. Статус проверки: одобрено.</Typography.Paragraph>
                      <Button onClick={() => setContactOpen(true)}>Связаться с продавцом</Button>
                    </Space>
                  ),
                },
                { key: 'logistics', label: 'Логистика', children: <Typography.Paragraph>Оценка перевозки: 2 480 ₽/т, срок 2,3 дня.</Typography.Paragraph> },
                { key: 'history', label: 'История обновлений', children: <Typography.Paragraph>Последнее обновление: сегодня в 10:15. Изменена цена и условия отгрузки.</Typography.Paragraph> },
                {
                  key: 'similar',
                  label: 'Похожие лоты',
                  children: (
                    <Space direction="vertical">
                      {(isGrain ? grainLots : isService ? serviceLots : equipmentLots)
                        .filter((item) => item.id !== lot.id)
                        .slice(0, 3)
                        .map((item) => <Typography.Link key={item.id} onClick={() => navigate(`/marketplace/lot/${item.id}`)}>{item.title}</Typography.Link>)}
                    </Space>
                  ),
                },
              ]}
            />
          </Card>

          <Card title="История цены и ставок" style={{ marginTop: 16 }}>
            <Table
              rowKey="period"
              pagination={false}
              dataSource={[
                { period: 'Сегодня', price: isGrain ? lot.pricePerTon : lot.price, change: '+1,3%' },
                { period: 'Неделя', price: isGrain ? Math.max(1, lot.pricePerTon - 280) : Math.max(1, lot.price - 120000), change: '+3,1%' },
                { period: 'Месяц', price: isGrain ? Math.max(1, lot.pricePerTon - 640) : Math.max(1, lot.price - 260000), change: '+4,8%' },
              ]}
              columns={[
                { title: 'Период', dataIndex: 'period', key: 'period' },
                { title: 'Цена', dataIndex: 'price', key: 'price', render: (value: number) => `${value.toLocaleString('ru-RU')} ₽${isGrain ? '/т' : ''}` },
                { title: 'Изменение', dataIndex: 'change', key: 'change' },
              ]}
            />
            {grainLot?.auctionEnabled && (
              <Card className="auction-card" style={{ marginTop: 12 }}>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Typography.Text strong>Аукционный блок</Typography.Text>
                  <Typography.Text>
                    Текущая ставка: {currentAuctionBid.toLocaleString('ru-RU')} ₽/т
                  </Typography.Text>
                  <Typography.Text>Количество ставок: {auctionSummary?.bidsCount ?? 0}</Typography.Text>
                  <AuctionBidPanel
                    lotId={lot.id}
                    basePrice={grainLot?.pricePerTon ?? 0}
                    sellerName={lot.sellerName}
                    lotTitle={lot.title}
                    auction={auctionSummary}
                  />
                </Space>
              </Card>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="sticky-actions-card" title="Действия по лоту">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Title level={2}>{isGrain ? `${lot.pricePerTon.toLocaleString('ru-RU')} ₽/т` : `${lot.price.toLocaleString('ru-RU')} ₽`}</Typography.Title>
              {!isService && (
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={async () => {
                    try {
                      if (lot.sellerId === currentUserId) return;
                      await addToCart(lot);
                      navigate('/cart');
                    } catch {
                      // handled by the store on the next render cycle
                    }
                  }}
                  block
                  disabled={lot.sellerId === currentUserId}
                >
                  {lot.sellerId === currentUserId ? 'Ваш лот' : 'Начать сделку'}
                </Button>
              )}
              <Button icon={<PhoneOutlined />} block onClick={() => setContactOpen(true)}>Связаться с продавцом</Button>
              <Button icon={<DownloadOutlined />} block onClick={() => downloadDocuments(lot)}>Скачать документы</Button>
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

      <Modal
        title="Контакт продавца"
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        footer={[
          <Button key="close" onClick={() => setContactOpen(false)}>Закрыть</Button>,
          <Button
            key="mail"
            type="primary"
            onClick={() => {
              window.location.href = `mailto:${seller?.email ?? ''}`;
            }}
          >
            Написать email
          </Button>,
        ]}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Text>{lot.sellerName}</Typography.Text>
          {contactCards.map((item) => (
            <Descriptions key={item.label} bordered size="small" column={1}>
              <Descriptions.Item label={item.label}>{item.value}</Descriptions.Item>
            </Descriptions>
          ))}
          <Typography.Text type="secondary">Email доступен из backend snapshot, поэтому контакт реальный для этого демо-пользователя.</Typography.Text>
        </Space>
      </Modal>
    </Space>
  );
}
