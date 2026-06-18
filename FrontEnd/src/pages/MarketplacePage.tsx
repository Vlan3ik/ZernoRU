import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  LoginOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { AutoComplete, Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Tag, Typography, message } from 'antd';
import { ReactNode, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { portalApi } from '../services/portalApi';
import { AuctionSummary, EquipmentLot, GrainLot, UserProfile } from '../types/domain';
import { lotImageMap, serviceImageMap } from '../data/mediaAssets';

type MarketplaceTab = 'grain' | 'equipment' | 'services';
type ListingMode = 'all' | 'direct' | 'auction';

interface ServiceCardData {
  id: string;
  title: string;
  description: string;
  region: string;
  priceFrom: number;
  sellerName?: string;
  sellerId?: string;
  coverImageUrl?: string;
  unit?: string;
  source: 'static' | 'custom';
}

const serviceOffers: ServiceCardData[] = [
  { id: 'srv-1', title: 'Перевозка зерна автотранспортом', description: 'Маршруты по ЦФО и ЮФО, подача в течение 24 часов.', region: 'ЦФО', priceFrom: 940, source: 'static' },
  { id: 'srv-2', title: 'Хранение на элеваторе', description: 'Партии от 50 тонн, контроль влажности и температуры.', region: 'ЮФО', priceFrom: 210, source: 'static' },
  { id: 'srv-3', title: 'Лабораторный анализ качества', description: 'Протеин, клейковина, натура, зараженность и микотоксины.', region: 'ПФО', priceFrom: 1800, source: 'static' },
  { id: 'srv-4', title: 'Страхование поставки', description: 'Защита от рисков по перевозке и хранению партии.', region: 'Россия', priceFrom: 3200, source: 'static' },
  { id: 'srv-5', title: 'Сопровождение сделки', description: 'Юридическая проверка документов и договоров поставки.', region: 'Россия', priceFrom: 6500, source: 'static' },
];

const categoryTabs: Array<{ key: MarketplaceTab; label: string; icon: ReactNode }> = [
  { key: 'grain', label: 'Зерно', icon: <WheatIcon /> },
  { key: 'equipment', label: 'Техника', icon: <TractorIcon /> },
  { key: 'services', label: 'Услуги', icon: <HandshakeIcon /> },
];

function resolveLotImage(lot: GrainLot | EquipmentLot) {
  return lot.coverImageUrl ?? lotImageMap[lot.id]?.[0] ?? '/images/thematic/image_01.jpg';
}

function resolveServiceImage(serviceId: string) {
  return serviceImageMap[serviceId] ?? '/images/thematic/image_13.jpg';
}

function formatMoney(value: number) {
  return value.toLocaleString('ru-RU');
}

function splitRegion(region: string) {
  const parts = region.split(',').map((item) => item.trim()).filter(Boolean);
  return {
    main: parts[0] ?? region,
    sub: parts[1] ?? '',
  };
}

function downloadDocs(lot: GrainLot | EquipmentLot) {
  const payload = [
    `Лот: ${lot.title}`,
    `Продавец: ${lot.sellerName}`,
    `Регион: ${lot.region}`,
    `Описание: ${lot.description}`,
    lot.category === 'grain'
      ? `Документы: ${lot.mercuryCertificate}; ${lot.declarationOfConformity}; ${lot.storageContract}`
      : 'Документы: ПСМ; договор купли-продажи',
  ].join('\n');

  const blob = new Blob([payload], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${lot.id}-documents.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function MarketplacePage() {
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const serviceLots = useAppStore((state) => state.serviceLots);
  const auctionSummaries = useAppStore((state) => state.auctionSummaries);
  const users = useAppStore((state) => state.users);
  const addToCart = useAppStore((state) => state.addToCart);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const referenceCatalogs = useAppStore((state) => state.referenceCatalogs);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = (searchParams.get('tab') as MarketplaceTab) ?? 'grain';
  const [tab, setTab] = useState<MarketplaceTab>(initialTab);
  const [mode, setMode] = useState<ListingMode>('all');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string | undefined>();
  const [culture, setCulture] = useState<string | undefined>();
  const [grade, setGrade] = useState<string | undefined>();
  const [documentsOnly, setDocumentsOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [stockOnly, setStockOnly] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState(false);
  const [priceFrom, setPriceFrom] = useState<number | undefined>();
  const [priceTo, setPriceTo] = useState<number | undefined>();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSeller, setContactSeller] = useState<UserProfile | null>(null);
  const [serviceRequestOpen, setServiceRequestOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCardData | null>(null);
  const [serviceForm] = Form.useForm();

  const currentUser = users.find((item) => item.id === currentUserId) ?? null;

  const sellerMap = useMemo(() => users.reduce<Record<string, UserProfile>>((acc, user) => ({ ...acc, [user.id]: user }), {}), [users]);

  const searchOptions = useMemo(() => {
    const sellers = users.map((user) => ({ value: user.name, label: `Продавец: ${user.name}` }));
    const cultures = [...new Set(grainLots.map((lot) => lot.grainType))].map((item) => ({ value: item, label: `Культура: ${item}` }));
    const refRegions = (referenceCatalogs['regions'] ?? []).map((r) => r.title);
    const lotRegions = [...grainLots.map((lot) => lot.region), ...equipmentLots.map((lot) => lot.region), ...serviceOffers.map((item) => item.region), ...serviceLots.map((item) => item.region)];
    const regions = [...new Set([...refRegions, ...lotRegions])].map((item) => ({ value: item, label: `Регион: ${item}` }));
    return [...sellers, ...cultures, ...regions];
  }, [users, grainLots, equipmentLots, serviceLots, referenceCatalogs]);

  const filteredGrain = useMemo(
    () =>
      grainLots.filter((lot) => {
        const seller = sellerMap[lot.sellerId];
        const text = `${lot.title} ${lot.description} ${lot.sellerName} ${lot.region}`.toLowerCase();
        if (query && !text.includes(query.toLowerCase())) return false;
        if (culture && lot.grainType !== culture) return false;
        if (grade && lot.grade !== grade) return false;
        if (region && !lot.region.includes(region)) return false;
        if (verifiedOnly && !seller?.isVerifiedSeller) return false;
        if (documentsOnly && !(lot.mercuryCertificate && lot.declarationOfConformity && lot.storageContract)) return false;
        if (stockOnly && lot.volumeTons <= 0) return false;
        if (priceFrom !== undefined && lot.pricePerTon < priceFrom) return false;
        if (priceTo !== undefined && lot.pricePerTon > priceTo) return false;
        const auction = auctionSummaries.find((item) => item.lotId === lot.id);
        if (lot.auctionEnabled && auction?.isEnded) return false;
        if (mode === 'direct' && lot.auctionEnabled) return false;
        if (mode === 'auction' && !lot.auctionEnabled) return false;
        return true;
      }),
    [auctionSummaries, culture, documentsOnly, grade, grainLots, mode, priceFrom, priceTo, query, region, sellerMap, stockOnly, verifiedOnly],
  );

  const filteredEquipment = useMemo(
    () =>
      equipmentLots.filter((lot) => {
        const seller = sellerMap[lot.sellerId];
        const text = `${lot.title} ${lot.description} ${lot.sellerName} ${lot.region} ${lot.brand}`.toLowerCase();
        if (query && !text.includes(query.toLowerCase())) return false;
        if (region && !lot.region.includes(region)) return false;
        if (verifiedOnly && !seller?.isVerifiedSeller) return false;
        if (priceFrom !== undefined && lot.price < priceFrom) return false;
        if (priceTo !== undefined && lot.price > priceTo) return false;
        return true;
      }),
    [equipmentLots, priceFrom, priceTo, query, region, sellerMap, verifiedOnly],
  );

  const marketplaceServices = useMemo<ServiceCardData[]>(
    () => [
      ...serviceOffers,
      ...serviceLots.map((lot) => ({
        id: lot.id,
        title: lot.title,
        description: `${lot.description}${lot.attachments?.length ? ` · ${lot.attachments.length} файлов` : ''}`,
        region: lot.region,
        priceFrom: lot.price,
        sellerName: lot.sellerName,
        sellerId: lot.sellerId,
        coverImageUrl: lot.coverImageUrl,
        unit: lot.unit,
        source: 'custom' as const,
      })),
    ],
    [serviceLots],
  );

  const filteredServices = useMemo(
    () =>
      marketplaceServices.filter((service) => {
        if (query && !`${service.title} ${service.description} ${service.region} ${service.sellerName ?? ''}`.toLowerCase().includes(query.toLowerCase())) return false;
        if (region && !service.region.includes(region)) return false;
        return true;
      }),
    [marketplaceServices, query, region],
  );

  const activeResults = tab === 'grain' ? filteredGrain : tab === 'equipment' ? filteredEquipment : filteredServices;

  const resetFilters = () => {
    setQuery('');
    setRegion(undefined);
    setCulture(undefined);
    setGrade(undefined);
    setMode('all');
    setDocumentsOnly(false);
    setVerifiedOnly(false);
    setStockOnly(false);
    setPriceFrom(undefined);
    setPriceTo(undefined);
  };

  const openContact = (sellerId: string) => {
    setContactSeller(sellerMap[sellerId] ?? null);
    setContactOpen(true);
  };

  const startDeal = async (lot: GrainLot | EquipmentLot) => {
    try {
      if (lot.sellerId === currentUserId) {
        message.warning('Нельзя купить собственный лот');
        return;
      }
      await addToCart(lot);
      navigate('/cart');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось добавить лот в корзину');
    }
  };

  const topFilters = [
    { label: 'Пшеница', active: tab === 'grain' && !culture, onClick: () => { setTab('grain'); setSearchParams({ tab: 'grain' }); setCulture(undefined); } },
    { label: 'Ячмень', active: tab === 'grain' && culture === 'Ячмень', onClick: () => { setTab('grain'); setSearchParams({ tab: 'grain' }); setCulture('Ячмень'); } },
    { label: 'Смоленская область', active: Boolean(region?.includes('Смолен')), onClick: () => setRegion('Смоленская область') },
    { label: 'Документы подтверждены', active: documentsOnly, onClick: () => setDocumentsOnly((value) => !value) },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card marketplace-hero">
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} xl={12}>
            <Space direction="vertical" size={18} className="marketplace-hero__copy">
              <Typography.Title level={1} className="marketplace-title">
                Торговая площадка
              </Typography.Title>
              <Typography.Paragraph className="lead-text marketplace-lead">
                Лоты проверенных продавцов: зерно, документы, логистика и сделки в одном экране.
              </Typography.Paragraph>
              <Space wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => {
                    if (!currentUser) {
                      navigate('/auth');
                      return;
                    }
                    navigate('/marketplace/create-lot');
                  }}
                >
                  Разместить лот
                </Button>
                {!currentUser && (
                  <Button size="large" onClick={() => navigate('/auth')} icon={<LoginOutlined />}>
                    Вход
                  </Button>
                )}
              </Space>
            </Space>
          </Col>

          <Col xs={24} xl={12}>
            <Row gutter={[16, 16]} className="marketplace-hero__features">
              <Col xs={12} xl={12}>
                <FeatureCard icon={<ShieldIcon />} title="Проверенные продавцы" text="Мы проверяем продавцов для вашей уверенности" variant="verified" />
              </Col>
              <Col xs={12} xl={12}>
                <FeatureCard icon={<DocumentIcon />} title="С документами" text="Только лоты с полным пакетом документов" variant="documents" />
              </Col>
              <Col xs={12} xl={12}>
                <FeatureCard icon={<SearchGlyph />} title="Быстрый поиск" text="Удобные фильтры помогают найти лучшее предложение" variant="search" />
              </Col>
              <Col xs={12} xl={12}>
                <FeatureCard icon={<WheatTruckIcon />} title="Зерно / Техника / Услуги" text="Широкий выбор категорий для вашего бизнеса" variant="market" />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <div className="marketplace-filter-pills">
        {categoryTabs.map((item) => (
          <Button
            key={item.key}
            className={`marketplace-category-pill ${tab === item.key ? 'is-active' : ''}`}
            onClick={() => {
              setTab(item.key);
              setSearchParams({ tab: item.key });
            }}
            icon={item.icon}
            size="large"
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="marketplace-mode-strip">
        {[
          { label: 'Все лоты', value: 'all' as ListingMode },
          { label: 'Прямые продажи', value: 'direct' as ListingMode },
          { label: 'Аукционы', value: 'auction' as ListingMode },
        ].map((item) => (
          <Button
            key={item.value}
            className={`marketplace-mode-pill ${mode === item.value ? 'is-active' : ''}`}
            onClick={() => setMode(item.value)}
            size="large"
            icon={item.value === 'all' ? <GridIcon /> : item.value === 'direct' ? <HandshakeOutlineIcon /> : <AuctionIcon />}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <Card className="marketplace-filter-panel" title={<Space><FilterOutlined />Поиск и фильтры</Space>} extra={<Button onClick={() => setExpandedFilters((value) => !value)}>{expandedFilters ? 'Скрыть фильтры' : 'Показать ещё фильтры'}</Button>}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} xl={18}>
              <AutoComplete
                value={query}
                options={searchOptions}
                onChange={setQuery}
                style={{ width: '100%' }}
                placeholder="Поиск по культурам, регионам, продавцам и типам лотов"
              />
            </Col>
            <Col xs={24} xl={6}>
              <Button block onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12} xl={6}>
              <Select allowClear value={region} onChange={setRegion} placeholder="Регион" style={{ width: '100%' }} options={(() => { const ref = (referenceCatalogs['regions'] ?? []).map((r) => r.title); const lots = [...grainLots.map((l) => l.region), ...equipmentLots.map((l) => l.region), ...serviceOffers.map((it) => it.region)]; return [...new Set([...ref, ...lots])].map((v) => ({ value: v, label: v })); })()} />
            </Col>
            {tab === 'grain' && (
              <>
                <Col xs={24} md={12} xl={6}>
                  <Select allowClear value={culture} onChange={setCulture} placeholder="Культура" style={{ width: '100%' }} options={[...new Set(grainLots.map((lot) => lot.grainType))].map((value) => ({ value, label: value }))} />
                </Col>
                <Col xs={24} md={12} xl={6}>
                  <Select allowClear value={grade} onChange={setGrade} placeholder="Класс" style={{ width: '100%' }} options={[...new Set(grainLots.map((lot) => lot.grade))].map((value) => ({ value, label: value }))} />
                </Col>
              </>
            )}
            <Col xs={24} md={12} xl={6}>
              <InputNumber value={priceFrom} min={0} placeholder="Цена от" style={{ width: '100%' }} onChange={(value) => setPriceFrom(value === null ? undefined : Number(value))} />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <InputNumber value={priceTo} min={0} placeholder="Цена до" style={{ width: '100%' }} onChange={(value) => setPriceTo(value === null ? undefined : Number(value))} />
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} lg={8}>
              <FilterSwitch checked={documentsOnly} onChange={setDocumentsOnly} label="Только с документами" />
            </Col>
            <Col xs={24} lg={8}>
              <FilterSwitch checked={verifiedOnly} onChange={setVerifiedOnly} label="Проверенные продавцы" />
            </Col>
            <Col xs={24} lg={8}>
              <FilterSwitch checked={stockOnly} onChange={setStockOnly} label="Только в наличии" />
            </Col>
          </Row>

          {expandedFilters && (
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} xl={6}>
                <Select
                  allowClear
                  placeholder="Формат сделки"
                  style={{ width: '100%' }}
                  value={undefined}
                  options={[
                    { value: 'direct', label: 'Прямые продажи' },
                    { value: 'auction', label: 'Аукционы' },
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Select
                  allowClear
                  placeholder="Поставка"
                  style={{ width: '100%' }}
                  value={undefined}
                  options={[
                    { value: 'pickup', label: 'Самовывоз' },
                    { value: 'delivery', label: 'Доставка' },
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Select
                  allowClear
                  placeholder="Логистика"
                  style={{ width: '100%' }}
                  value={undefined}
                  options={[
                    { value: 'own', label: 'Собственная' },
                    { value: 'partner', label: 'Партнерская' },
                  ]}
                />
              </Col>
              <Col xs={24} md={12} xl={6}>
                <Select
                  allowClear
                  placeholder="Склад / элеватор"
                  style={{ width: '100%' }}
                  value={undefined}
                  options={[
                    { value: 'yes', label: 'Есть' },
                    { value: 'no', label: 'Нет' },
                  ]}
                />
              </Col>
            </Row>
          )}
        </Space>
      </Card>

      <div className="marketplace-top-tags">
        {topFilters.map((item) => (
          <Tag key={item.label} color={item.active ? 'green' : 'default'} className="marketplace-top-tag" onClick={item.onClick}>
            {item.label}
          </Tag>
        ))}
      </div>

      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {tab === 'grain' && (
      <Row gutter={[24, 24]} align="top">
            {filteredGrain.map((lot) => (
              <Col key={lot.id} xs={24} xl={12}>
                <GrainLotCard
                  lot={lot}
                  isVerified={Boolean(sellerMap[lot.sellerId]?.isVerifiedSeller)}
                  isOwnLot={lot.sellerId === currentUserId}
                  auctionSummary={auctionSummaries.find((item) => item.lotId === lot.id) ?? null}
                  onContact={() => openContact(lot.sellerId)}
                  onDownload={() => downloadDocs(lot)}
                  onStartDeal={() => void startDeal(lot)}
                />
              </Col>
            ))}
          </Row>
        )}

        {tab === 'equipment' && (
          <Row gutter={[24, 24]}>
            {filteredEquipment.map((lot) => (
              <Col key={lot.id} xs={24} xl={12}>
                <EquipmentLotCard
                  lot={lot}
                  isVerified={Boolean(sellerMap[lot.sellerId]?.isVerifiedSeller)}
                  isOwnLot={lot.sellerId === currentUserId}
                  onContact={() => openContact(lot.sellerId)}
                  onDownload={() => downloadDocs(lot)}
                  onStartDeal={() => void startDeal(lot)}
                />
              </Col>
            ))}
          </Row>
        )}

        {tab === 'services' && (
          <Row gutter={[24, 24]}>
            {filteredServices.map((service) => (
              <Col key={service.id} xs={24} xl={12}>
                <ServiceLotCard
                  service={service}
                  onContact={() => { if (!currentUser) { navigate('/auth'); return; } setSelectedService(service); serviceForm.setFieldsValue({ serviceTitle: service.title, region: service.region, organization: currentUser.name, email: currentUser.email }); setServiceRequestOpen(true); }}
                  onOpen={service.source === 'custom' ? () => navigate(`/marketplace/lot/${service.id}`) : undefined}
                />
              </Col>
            ))}
          </Row>
        )}

        {!activeResults.length && (
          <Card>
            <Empty description="Ничего не найдено по выбранным фильтрам">
              <Button type="primary" onClick={resetFilters}>
                Сбросить фильтры
              </Button>
            </Empty>
          </Card>
        )}
      </Space>

      <Modal
        title="Связаться с продавцом"
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        footer={[
          <Button key="close" onClick={() => setContactOpen(false)}>
            Закрыть
          </Button>,
        ]}
      >
        {contactSeller ? (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text strong>{contactSeller.name}</Typography.Text>
            <Typography.Text>{contactSeller.email}</Typography.Text>
            <Typography.Text>{contactSeller.region}</Typography.Text>
            <Typography.Text type="secondary">
              Контакты подставлены из backend snapshot. Для продавца можно переключать каналы связи в профиле поставщика.
            </Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">Продавец не найден.</Typography.Text>
        )}
      </Modal>

      <Modal
        title="Заявка на услугу"
        open={serviceRequestOpen}
        onCancel={() => setServiceRequestOpen(false)}
        okText="Отправить заявку"
        cancelText="Отмена"
        onOk={async () => {
          try {
            const values = await serviceForm.validateFields();
            await portalApi.createServiceRequest({
              ...values,
              sellerId: selectedService?.sellerId,
              serviceTitle: selectedService?.title ?? values.serviceTitle,
            });
            message.success('Заявка по услуге создана. Уведомление отправлено.');
            setServiceRequestOpen(false);
            serviceForm.resetFields();
          } catch {
            message.error('Заполните обязательные поля заявки');
          }
        }}
      >
        <Form form={serviceForm} layout="vertical" initialValues={{ serviceTitle: selectedService?.title, region: selectedService?.region }}>
          <Form.Item name="serviceTitle" label="Услуга">
            <Input disabled />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="organization" label="Организация" rules={[{ required: true, message: 'Укажите организацию' }]}>
                <Input placeholder="Название компании" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="region" label="Регион" rules={[{ required: true, message: 'Укажите регион' }]}>
                <Select showSearch placeholder="Регион выполнения" options={(() => { const ref = (referenceCatalogs['regions'] ?? []).map((r) => r.title); return ref.length ? ref.map((v) => ({ value: v, label: v })) : []; })()} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="Телефон" rules={[{ required: true, message: 'Укажите телефон' }]}>
                <Input placeholder="+7 (900) 000-00-00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Укажите email' }]}>
                <Input placeholder="mail@company.ru" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="date" label="Желаемая дата">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="details" label="Что нужно сделать" rules={[{ required: true, message: 'Опишите задачу' }]}>
                <Input.TextArea rows={4} placeholder="Маршрут, объем, сроки, требования к документам" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
}

function GrainLotCard({
  lot,
  isVerified,
  isOwnLot,
  auctionSummary,
  onContact,
  onDownload,
  onStartDeal,
}: {
  lot: GrainLot;
  isVerified: boolean;
  isOwnLot: boolean;
  auctionSummary: AuctionSummary | null;
  onContact: () => void;
  onDownload: () => void;
  onStartDeal: () => void;
}) {
  const navigate = useNavigate();
  const hasDocs = Boolean(lot.mercuryCertificate && lot.declarationOfConformity && lot.storageContract);
  const region = splitRegion(lot.region);
  const total = lot.volumeTons * lot.pricePerTon;
  const auctionBid = lot.auctionEnabled ? Math.max(lot.pricePerTon, auctionSummary?.currentHighestBid ?? 0) : null;

  return (
      <Card
      className="lot-card marketplace-lot-card marketplace-lot-card--clickable"
      onClick={() => navigate(`/marketplace/lot/${lot.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/marketplace/lot/${lot.id}`);
        }
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div className="marketplace-lot-card__header">
          <div className="marketplace-lot-card__media">
            <img src={resolveLotImage(lot)} alt={lot.title} className="marketplace-lot-card__image" />
            <div className="marketplace-lot-card__media-caption">
              <Typography.Text type="secondary">{lot.auctionEnabled ? 'Начальная ставка' : 'Цена за тонну'}</Typography.Text>
              <Typography.Text strong>{formatMoney(lot.pricePerTon)} ₽/т</Typography.Text>
            </div>
          </div>

          <div className="marketplace-lot-card__intro">
            <Space wrap size={8} className="marketplace-lot-card__badges">
              <Tag color="green">{lot.grainType}</Tag>
              <Tag color="blue">{lot.grade}</Tag>
              <Tag color={isVerified ? 'green' : 'gold'} icon={<CheckCircleOutlined />}>
                {isVerified ? 'Проверенный продавец' : 'Будьте осторожны, продавец не проверен'}
              </Tag>
              {lot.auctionEnabled && <Tag color="purple" icon={<ClockCircleOutlined />}>Аукцион</Tag>}
              <Tag color="default">{lot.hasOwnTransport ? 'Собственная логистика' : 'Логистика по согласованию'}</Tag>
            </Space>

            <Typography.Title level={3} className="marketplace-lot-card__title">
              {lot.title}
            </Typography.Title>
            <Typography.Paragraph className="marketplace-lot-card__description">{lot.description}</Typography.Paragraph>
          </div>
        </div>

        <div className="marketplace-lot-card__metrics">
          <MetricBox label="Объем партии" value={`${formatMoney(lot.volumeTons)} т`} />
          <MetricBox label="Итого ориентир" value={`${formatMoney(total)} ₽`} accent="green" />
          <MetricBox label="Регион и отгрузка" value={region.main} subValue={region.sub || 'Взять из карточки продавца'} accent="blue" />
          <MetricBox label="Продавец" value={lot.sellerName} />
          <MetricBox label="Качество" value={`${lot.qualityScore}/100`} subValue="высокий показатель" />
          <MetricBox label="Документы" value={hasDocs ? 'Подтверждены' : 'Требуют проверки'} subValue={hasDocs ? 'ИНН · декларация · хранение' : 'Неполный пакет'} accent={hasDocs ? 'blue' : 'gold'} />
        </div>

        <Space wrap size={8} className="marketplace-lot-card__chips">
          <Tag color="green">Натура {lot.qualityScore + 678}</Tag>
          <Tag color="gold">Влажн. 12.5%</Tag>
          <Tag color="blue">Протеин 14.1%</Tag>
          <Tag>СБП / счёт</Tag>
        </Space>

        <div className="marketplace-lot-card__panels">
          <InfoPanel title="Документы и сделка" text={hasDocs ? 'Сертификаты, декларация и договор хранения готовы.' : 'Документы загружены частично и доступны на проверку.'} />
          <InfoPanel title="Логистика" text={lot.hasOwnTransport ? 'Самовывоз или расчёт доставки партнёром.' : 'Доставка обсуждается с продавцом и перевозчиком.'} />
          <InfoPanel
            title={lot.auctionEnabled ? 'Аукцион' : 'Формат сделки'}
            text={lot.auctionEnabled ? `Шаг ${formatMoney(auctionSummary?.minimumStep ?? Math.max(100, Math.round(lot.pricePerTon * 0.005)))} ₽ · торги идут на сервере` : 'Прямая продажа без ожидания торгов.'}
            highlight={lot.auctionEnabled ? `${formatMoney(auctionBid ?? lot.pricePerTon)} ₽` : undefined}
          />
        </div>

        <Space wrap className="marketplace-lot-card__actions">
          <Button type="primary" icon={<ShoppingCartOutlined />} disabled={isOwnLot} onClick={(event) => { event.stopPropagation(); onStartDeal(); }}>
            {isOwnLot ? 'Ваш лот' : 'Начать сделку'}
          </Button>
          <Button icon={<PhoneOutlined />} onClick={(event) => { event.stopPropagation(); onContact(); }}>
            Связаться с продавцом
          </Button>
          <Button icon={<DownloadOutlined />} onClick={(event) => { event.stopPropagation(); onDownload(); }}>
            Документы
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

function EquipmentLotCard({
  lot,
  isVerified,
  isOwnLot,
  onContact,
  onDownload,
  onStartDeal,
}: {
  lot: EquipmentLot;
  isVerified: boolean;
  isOwnLot: boolean;
  onContact: () => void;
  onDownload: () => void;
  onStartDeal: () => void;
}) {
  const navigate = useNavigate();
  const region = splitRegion(lot.region);

  return (
    <Card
      className="lot-card marketplace-lot-card marketplace-lot-card--clickable"
      onClick={() => navigate(`/marketplace/lot/${lot.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigate(`/marketplace/lot/${lot.id}`);
        }
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div className="marketplace-lot-card__header">
          <div className="marketplace-lot-card__media">
            <img src={resolveLotImage(lot)} alt={lot.title} className="marketplace-lot-card__image" />
            <div className="marketplace-lot-card__media-caption">
              <Typography.Text type="secondary">Цена</Typography.Text>
              <Typography.Text strong>{formatMoney(lot.price)} ₽</Typography.Text>
            </div>
          </div>

          <div className="marketplace-lot-card__intro">
            <Space wrap size={8} className="marketplace-lot-card__badges">
              <Tag color="blue">{lot.brand}</Tag>
              <Tag>{lot.year} г.</Tag>
              <Tag color={lot.condition === 'new' ? 'gold' : 'default'}>{lot.condition === 'new' ? 'Новая' : 'Б/у'}</Tag>
              <Tag color={isVerified ? 'green' : 'gold'} icon={<CheckCircleOutlined />}>
                {isVerified ? 'Проверенный продавец' : 'Будьте осторожны, продавец не проверен'}
              </Tag>
            </Space>

            <Typography.Title level={3} className="marketplace-lot-card__title">
              {lot.title}
            </Typography.Title>
            <Typography.Paragraph className="marketplace-lot-card__description">{lot.description}</Typography.Paragraph>
          </div>
        </div>

        <div className="marketplace-lot-card__metrics">
          <MetricBox label="Объем партии" value={`1 шт.`} />
          <MetricBox label="Итого ориентир" value={`${formatMoney(lot.price)} ₽`} accent="green" />
          <MetricBox label="Регион и отгрузка" value={region.main} subValue={region.sub || 'По согласованию'} accent="blue" />
          <MetricBox label="Продавец" value={lot.sellerName} />
          <MetricBox label="Качество" value={lot.condition === 'new' ? '100/100' : '87/100'} subValue={lot.condition === 'new' ? 'новая техника' : 'проверенная техника'} />
          <MetricBox label="Документы" value="Подтверждены" subValue="ПСМ · договор" accent="blue" />
        </div>

        <Space wrap size={8} className="marketplace-lot-card__chips">
          <Tag color="green">Гарантия</Tag>
          <Tag color="gold">Предпродажная проверка</Tag>
          <Tag color="blue">Документы</Tag>
          <Tag>Безналичный расчёт</Tag>
        </Space>

        <div className="marketplace-lot-card__panels">
          <InfoPanel title="Документы и сделка" text="ПСМ, договор и спецификация готовы к передаче." />
          <InfoPanel title="Логистика" text="Доставка со склада, цена рассчитывается в сделке." />
          <InfoPanel title="Состояние" text={lot.condition === 'new' ? 'Новая техника с гарантией.' : 'Проверенная техника с обслуживанием.'} />
        </div>

        <Space wrap className="marketplace-lot-card__actions">
          <Button type="primary" icon={<ShoppingCartOutlined />} disabled={isOwnLot} onClick={(event) => { event.stopPropagation(); onStartDeal(); }}>
            {isOwnLot ? 'Ваш лот' : 'Начать сделку'}
          </Button>
          <Button icon={<PhoneOutlined />} onClick={(event) => { event.stopPropagation(); onContact(); }}>
            Связаться с продавцом
          </Button>
          <Button icon={<DownloadOutlined />} onClick={(event) => { event.stopPropagation(); onDownload(); }}>
            Документы
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

function ServiceLotCard({
  service,
  onContact,
  onOpen,
}: {
  service: ServiceCardData;
  onContact: () => void;
  onOpen?: () => void;
}) {
  return (
    <Card className="lot-card marketplace-lot-card marketplace-lot-card--clickable" onClick={onOpen}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div className="marketplace-lot-card__header">
          <div className="marketplace-lot-card__media">
            <img src={service.coverImageUrl ?? resolveServiceImage(service.id)} alt={service.title} className="marketplace-lot-card__image" />
            <div className="marketplace-lot-card__media-caption">
              <Typography.Text type="secondary">{service.source === 'custom' ? 'Моя услуга' : 'Цена от'}</Typography.Text>
              <Typography.Text strong>{formatMoney(service.priceFrom)} ₽</Typography.Text>
            </div>
          </div>
          <div className="marketplace-lot-card__intro">
            <Space wrap size={8} className="marketplace-lot-card__badges">
              <Tag color="green">{service.region}</Tag>
              <Tag color="blue">Услуга</Tag>
              {service.source === 'custom' && <Tag color="gold">Мой лот</Tag>}
            </Space>
            <Typography.Title level={3} className="marketplace-lot-card__title">
              {service.title}
            </Typography.Title>
            <Typography.Paragraph className="marketplace-lot-card__description">{service.description}</Typography.Paragraph>
          </div>
        </div>

        <div className="marketplace-lot-card__metrics">
          <MetricBox label="Цена от" value={`${formatMoney(service.priceFrom)} ₽`} accent="green" />
          <MetricBox label="Регион" value={service.region} subValue="Работаем по заявке" accent="blue" />
          <MetricBox label="Формат" value="Заявка" subValue="Согласование параметров" />
          <MetricBox label="Документы" value="Договор" subValue="После согласования" accent="gold" />
          <MetricBox label="Срок" value="1-2 дня" subValue="В зависимости от маршрута" />
          <MetricBox label="Связь" value="Заявка" subValue="Контакты в уведомлении" />
        </div>

        <Space wrap className="marketplace-lot-card__actions">
          {service.source === 'custom' && service.sellerName && (
            <Button type="default" onClick={(event) => { event.stopPropagation(); onOpen?.(); }}>
              Открыть
            </Button>
          )}
          <Button type="primary" icon={<PhoneOutlined />} onClick={(event) => { event.stopPropagation(); onContact(); }}>
            Оставить заявку
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

function MetricBox({ label, value, subValue, accent }: { label: string; value: string; subValue?: string; accent?: 'green' | 'blue' | 'gold' }) {
  return (
    <div className={`marketplace-metric marketplace-metric--${accent ?? 'default'}`}>
      <Typography.Text type="secondary" className="marketplace-metric__label">
        {label}
      </Typography.Text>
      <Typography.Text strong className="marketplace-metric__value">
        {value}
      </Typography.Text>
      {subValue && (
        <Typography.Text type="secondary" className="marketplace-metric__sub">
          {subValue}
        </Typography.Text>
      )}
    </div>
  );
}

function InfoPanel({ title, text, highlight }: { title: string; text: string; highlight?: string }) {
  return (
    <div className="marketplace-info-panel">
      <Typography.Text className="marketplace-info-panel__title">{title}</Typography.Text>
      {highlight && <Typography.Text className="marketplace-info-panel__highlight">{highlight}</Typography.Text>}
      <Typography.Text type="secondary" className="marketplace-info-panel__text">
        {text}
      </Typography.Text>
    </div>
  );
}

function FilterSwitch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <Space className="marketplace-filter-switch" size={12}>
      <Switch checked={checked} onChange={onChange} />
      <Space direction="vertical" size={0}>
        <Typography.Text>{label}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Активно в фильтрах
        </Typography.Text>
      </Space>
    </Space>
  );
}

function FeatureCard({
  icon,
  title,
  text,
  variant = 'default',
}: {
  icon: ReactNode;
  title: string;
  text: string;
  variant?: 'default' | 'verified' | 'documents' | 'search' | 'market';
}) {
  return (
    <Card className={`marketplace-feature-card marketplace-feature-card--${variant}`}>
      <Space direction="vertical" size={10} align="center" style={{ width: '100%' }}>
        <div className="marketplace-feature-card__icon">{icon}</div>
        <Typography.Text strong className="marketplace-feature-card__title">
          {title}
        </Typography.Text>
        <Typography.Text type="secondary" className="marketplace-feature-card__text">
          {text}
        </Typography.Text>
      </Space>
    </Card>
  );
}

function WheatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 4c-2.2 0-3.6 1.2-4.4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 7c-2.8 0-4.8 1.6-5.7 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 4c2.2 0 3.6 1.2 4.4 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 7c2.8 0 4.8 1.6 5.7 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TractorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 12h7l2-4h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 8V5h3l1 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="14" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="14.5" cy="14" r="1.6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 10l3-3 2 2h4l2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 12l2 2c.8.8 2 .8 2.8 0l.7-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 11.5l1 1c.8.8 2 .8 2.8 0l.7-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 3l8 3v6c0 5.2-3.4 8.9-8 11-4.6-2.1-8-5.8-8-11V6l8-3z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.5 14.3l2.3 2.3 4.8-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M8 4h8l4 4v16H8V4z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 4v4h4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 13h8M10 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M17 17l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WheatTruckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M6 18h11l2-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="20" cy="20" r="1.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 6v12M3 9h4M3 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="12" y="2" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2" y="12" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="12" y="12" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function HandshakeOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9l2.4-2.4 1.6 1.6h3.4l1.6 1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10.5l1.2 1.2c.6.6 1.4.6 2 0l.5-.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AuctionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M10.5 3l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 14l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11.5 11.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
