import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  FilterOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import {
  AutoComplete,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  InputNumber,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuctionBidPanel } from '../components/marketplace/AuctionBidPanel';
import { lotImageMap, serviceImageMap } from '../data/mediaAssets';
import { useAppStore } from '../store/appStore';
import { EquipmentLot, GrainLot, UserProfile } from '../types/domain';

type MarketplaceTab = 'grain' | 'equipment' | 'services';
type ListingMode = 'all' | 'direct' | 'auction' | 'urgent' | 'verified';

interface ServiceCardData {
  id: string;
  title: string;
  description: string;
  region: string;
  priceFrom: number;
}

const serviceOffers: ServiceCardData[] = [
  { id: 'srv-1', title: 'Перевозка зерна автотранспортом', description: 'Маршруты по ЦФО и ЮФО, подача в течение 24 часов.', region: 'ЦФО', priceFrom: 940 },
  { id: 'srv-2', title: 'Хранение на элеваторе', description: 'Партии от 50 тонн, контроль влажности и температуры.', region: 'ЮФО', priceFrom: 210 },
  { id: 'srv-3', title: 'Лабораторный анализ качества', description: 'Протеин, клейковина, натура, зараженность и микотоксины.', region: 'ПФО', priceFrom: 1800 },
  { id: 'srv-4', title: 'Страхование поставки', description: 'Защита от рисков по перевозке и хранению партии.', region: 'Россия', priceFrom: 3200 },
  { id: 'srv-5', title: 'Сопровождение сделки', description: 'Юридическая проверка документов и договоров поставки.', region: 'Россия', priceFrom: 6500 },
];

export function MarketplacePage() {
  const grainLots = useAppStore((state) => state.grainLots);
  const equipmentLots = useAppStore((state) => state.equipmentLots);
  const users = useAppStore((state) => state.users);
  const addToCart = useAppStore((state) => state.addToCart);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as MarketplaceTab) ?? 'grain';
  const [tab, setTab] = useState<MarketplaceTab>(initialTab);
  const [mode, setMode] = useState<ListingMode>('all');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<string | undefined>();
  const [district, setDistrict] = useState<string | undefined>();
  const [culture, setCulture] = useState<string | undefined>();
  const [grade, setGrade] = useState<string | undefined>();
  const [delivery, setDelivery] = useState<string | undefined>();
  const [saleFormat, setSaleFormat] = useState<string | undefined>();
  const [documents, setDocuments] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceFrom, setPriceFrom] = useState<number | undefined>();
  const [priceTo, setPriceTo] = useState<number | undefined>();

  const sellerMap = useMemo(() => users.reduce<Record<string, UserProfile>>((acc, user) => ({ ...acc, [user.id]: user }), {}), [users]);

  const searchOptions = useMemo(() => {
    const sellers = users.map((user) => ({ value: user.name, label: `Продавец: ${user.name}` }));
    const cultures = [...new Set(grainLots.map((lot) => lot.grainType))].map((item) => ({ value: item, label: `Культура: ${item}` }));
    const regions = [...new Set([...grainLots.map((lot) => lot.region), ...equipmentLots.map((lot) => lot.region)])].map((item) => ({ value: item, label: `Регион: ${item}` }));
    return [...sellers, ...cultures, ...regions];
  }, [users, grainLots, equipmentLots]);

  const filteredGrain = useMemo(
    () =>
      grainLots.filter((lot) => {
        const seller = sellerMap[lot.sellerId];
        const text = `${lot.title} ${lot.description} ${lot.sellerName} ${lot.region}`.toLowerCase();

        if (query && !text.includes(query.toLowerCase())) return false;
        if (culture && lot.grainType !== culture) return false;
        if (grade && lot.grade !== grade) return false;
        if (region && !lot.region.includes(region)) return false;
        if (district && !lot.region.toLowerCase().includes(district.toLowerCase())) return false;
        if (verifiedOnly && !seller?.isVerifiedSeller) return false;
        if (documents && !(lot.mercuryCertificate && lot.declarationOfConformity && lot.storageContract)) return false;
        if (priceFrom !== undefined && lot.pricePerTon < priceFrom) return false;
        if (priceTo !== undefined && lot.pricePerTon > priceTo) return false;
        if (mode === 'direct' && lot.auctionEnabled) return false;
        if (mode === 'auction' && !lot.auctionEnabled) return false;
        if (mode === 'urgent' && lot.volumeTons > 100) return false;
        if (mode === 'verified' && !seller?.isVerifiedSeller) return false;
        if (saleFormat === 'Прямая продажа' && lot.auctionEnabled) return false;
        if (saleFormat === 'Аукцион' && !lot.auctionEnabled) return false;
        return true;
      }),
    [culture, district, documents, grade, grainLots, mode, priceFrom, priceTo, query, region, saleFormat, sellerMap, verifiedOnly],
  );

  const filteredEquipment = useMemo(
    () =>
      equipmentLots.filter((lot) => {
        const seller = sellerMap[lot.sellerId];
        const text = `${lot.title} ${lot.description} ${lot.sellerName} ${lot.region} ${lot.brand}`.toLowerCase();

        if (query && !text.includes(query.toLowerCase())) return false;
        if (region && !lot.region.includes(region)) return false;
        if (priceFrom !== undefined && lot.price < priceFrom) return false;
        if (priceTo !== undefined && lot.price > priceTo) return false;
        if (verifiedOnly && !seller?.isVerifiedSeller) return false;
        if (mode === 'verified' && !seller?.isVerifiedSeller) return false;
        return true;
      }),
    [equipmentLots, mode, priceFrom, priceTo, query, region, sellerMap, verifiedOnly],
  );

  const filteredServices = useMemo(
    () =>
      serviceOffers.filter((service) => {
        if (query && !`${service.title} ${service.description} ${service.region}`.toLowerCase().includes(query.toLowerCase())) return false;
        if (region && !service.region.includes(region)) return false;
        return true;
      }),
    [query, region],
  );

  const resetFilters = () => {
    setQuery('');
    setRegion(undefined);
    setDistrict(undefined);
    setCulture(undefined);
    setGrade(undefined);
    setDelivery(undefined);
    setSaleFormat(undefined);
    setDocuments(false);
    setVerifiedOnly(false);
    setPriceFrom(undefined);
    setPriceTo(undefined);
    setMode('all');
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Торговая площадка</Typography.Title>
        <Typography.Paragraph className="lead-text">Покупка и продажа зерна, техники и услуг с гибкими режимами выдачи и фильтрами по качеству, документам и надежности продавца.</Typography.Paragraph>
      </Card>

      <Tabs
        activeKey={tab}
        onChange={(value) => {
          const next = value as MarketplaceTab;
          setTab(next);
          setSearchParams({ tab: next });
        }}
        items={[{ key: 'grain', label: 'Зерно' }, { key: 'equipment', label: 'Техника' }, { key: 'services', label: 'Услуги' }]}
      />

      <Card title="Режимы выдачи">
        <Segmented
          value={mode}
          onChange={(value) => setMode(value as ListingMode)}
          options={[
            { label: 'Все лоты', value: 'all' },
            { label: 'Прямые продажи', value: 'direct' },
            { label: 'Аукционы', value: 'auction' },
            { label: 'Срочные', value: 'urgent' },
            { label: 'Проверенные продавцы', value: 'verified' },
          ]}
          block
        />
      </Card>

      <Card title="Поиск и фильтры" extra={<Button onClick={resetFilters}>Сбросить фильтры</Button>}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <AutoComplete value={query} options={searchOptions} onChange={setQuery} style={{ width: '100%' }} placeholder="Поиск по культурам, регионам, продавцам и типам лотов" />

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12} xl={6}><Select allowClear value={region} onChange={setRegion} placeholder="Регион" style={{ width: '100%' }} options={[...new Set([...grainLots.map((lot) => lot.region), ...equipmentLots.map((lot) => lot.region), ...serviceOffers.map((item) => item.region)])].map((value) => ({ value, label: value }))} /></Col>
            <Col xs={24} md={12} xl={6}><Select allowClear value={district} onChange={setDistrict} placeholder="Район" style={{ width: '100%' }} options={[{ value: 'Вяземский', label: 'Вяземский' }, { value: 'Гагарин', label: 'Гагарин' }, { value: 'Смоленск', label: 'Смоленск' }]} /></Col>
            <Col xs={24} md={12} xl={6}><InputNumber value={priceFrom} min={0} placeholder="Цена от" style={{ width: '100%' }} onChange={(value) => setPriceFrom(value === null ? undefined : Number(value))} /></Col>
            <Col xs={24} md={12} xl={6}><InputNumber value={priceTo} min={0} placeholder="Цена до" style={{ width: '100%' }} onChange={(value) => setPriceTo(value === null ? undefined : Number(value))} /></Col>
          </Row>

          {tab === 'grain' && (
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12} xl={6}><Select allowClear value={culture} onChange={setCulture} placeholder="Культура" style={{ width: '100%' }} options={[...new Set(grainLots.map((lot) => lot.grainType))].map((value) => ({ value, label: value }))} /></Col>
              <Col xs={24} md={12} xl={6}><Select allowClear value={grade} onChange={setGrade} placeholder="Класс" style={{ width: '100%' }} options={[...new Set(grainLots.map((lot) => lot.grade))].map((value) => ({ value, label: value }))} /></Col>
              <Col xs={24} md={12} xl={6}><Select allowClear value={delivery} onChange={setDelivery} placeholder="Вид поставки" style={{ width: '100%' }} options={[{ value: 'Самовывоз', label: 'Самовывоз' }, { value: 'Доставка продавцом', label: 'Доставка продавцом' }, { value: 'Партнерская перевозка', label: 'Партнерская перевозка' }]} /></Col>
              <Col xs={24} md={12} xl={6}><Select allowClear value={saleFormat} onChange={setSaleFormat} placeholder="Формат продажи" style={{ width: '100%' }} options={[{ value: 'Прямая продажа', label: 'Прямая продажа' }, { value: 'Аукцион', label: 'Аукцион' }]} /></Col>
            </Row>
          )}

          <Space size={24} wrap>
            <Space><Switch checked={documents} onChange={setDocuments} /><Typography.Text>Только с документами</Typography.Text></Space>
            <Space><Switch checked={verifiedOnly} onChange={setVerifiedOnly} /><Typography.Text>Только проверенные продавцы</Typography.Text></Space>
          </Space>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={6}>
          <Card title={<Space><FilterOutlined />Боковая панель фильтров</Space>}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Segmented value={tab} onChange={(value) => setTab(value as MarketplaceTab)} options={[{ label: 'Зерно', value: 'grain' }, { label: 'Техника', value: 'equipment' }, { label: 'Услуги', value: 'services' }]} block />
              <Typography.Text type="secondary">Панель дублирует фильтры и режимы выдачи для быстрого уточнения списка.</Typography.Text>
              <Button block onClick={resetFilters}>Очистить параметры</Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={18}>
          {tab === 'grain' && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {filteredGrain.map((lot) => <GrainLotCard key={lot.id} lot={lot} isVerified={Boolean(sellerMap[lot.sellerId]?.isVerifiedSeller)} onAdd={() => addToCart(lot)} />)}
              {!filteredGrain.length && <EmptyState title="Лоты зерна не найдены" actionLabel="Сбросить фильтры" onAction={resetFilters} />}
            </Space>
          )}

          {tab === 'equipment' && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {filteredEquipment.map((lot) => <EquipmentLotCard key={lot.id} lot={lot} isVerified={Boolean(sellerMap[lot.sellerId]?.isVerifiedSeller)} onAdd={() => addToCart(lot)} />)}
              {!filteredEquipment.length && <EmptyState title="Лоты техники не найдены" actionLabel="Сбросить фильтры" onAction={resetFilters} />}
            </Space>
          )}

          {tab === 'services' && (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {filteredServices.map((item) => (
                <Card key={item.id} className="lot-card">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}><img src={serviceImageMap[item.id]} alt={item.title} className="lot-image-thumb" /></Col>
                    <Col xs={24} md={16}>
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Typography.Title level={4}>{item.title}</Typography.Title>
                        <Typography.Paragraph>{item.description}</Typography.Paragraph>
                        <Space><Tag>{item.region}</Tag><Tag color="green">От {item.priceFrom.toLocaleString('ru-RU')} ₽</Tag></Space>
                        <Space><Button type="primary">Запросить условия</Button><Button>Добавить в избранное</Button></Space>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              ))}
              {!filteredServices.length && <EmptyState title="Услуги не найдены" actionLabel="Сбросить фильтры" onAction={resetFilters} />}
            </Space>
          )}
        </Col>
      </Row>
    </Space>
  );
}

function GrainLotCard({ lot, isVerified, onAdd }: { lot: GrainLot; isVerified: boolean; onAdd: () => void }) {
  const navigate = useNavigate();
  const hasDocs = Boolean(lot.mercuryCertificate && lot.declarationOfConformity && lot.storageContract);

  return (
    <Card className="lot-card">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={6}><img src={lotImageMap[lot.id]?.[0]} alt={lot.title} className="lot-image-thumb" /></Col>
        <Col xs={24} xl={11}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color="green">{lot.grainType}</Tag>
              <Tag color="blue">{lot.grade}</Tag>
              <Tag color={isVerified ? 'success' : 'warning'} icon={<SafetyCertificateOutlined />}>{isVerified ? 'Проверенный продавец' : 'Продавец без проверки'}</Tag>
              {lot.auctionEnabled && <Tag color="purple" icon={<ClockCircleOutlined />}>Аукционный лот</Tag>}
            </Space>
            <Typography.Title level={3}>{lot.title}</Typography.Title>
            <div className="grain-grid">
              <InfoCell label="Цена за тонну" value={`${lot.pricePerTon.toLocaleString('ru-RU')} ₽/т`} strong />
              <InfoCell label="Объем партии" value={`${lot.volumeTons} т`} />
              <InfoCell label="Регион и отгрузка" value={lot.region} />
              <InfoCell label="Продавец" value={lot.sellerName} />
              <InfoCell label="Качество" value={`Оценка ${lot.qualityScore}/100`} />
              <InfoCell label="Дата обновления" value="Сегодня, 10:15" />
            </div>
            <Typography.Paragraph>{lot.description}</Typography.Paragraph>
            <Space wrap>
              <Tag color={hasDocs ? 'processing' : 'error'} icon={<FileTextOutlined />}>{hasDocs ? 'Документы подтверждены' : 'Документы требуют дополнения'}</Tag>
              <Tag>{lot.hasOwnTransport ? 'Доставка продавцом' : 'Самовывоз'}</Tag>
              <Tag>Оплата: безналичный расчет</Tag>
            </Space>
            <Divider />
            <Space wrap>
              <Button type="primary" icon={<ShoppingCartOutlined />} onClick={onAdd}>Купить</Button>
              <Button onClick={() => navigate(`/marketplace/lot/${lot.id}`)}>Запросить условия</Button>
              <Button icon={<HeartOutlined />}>Добавить в избранное</Button>
              <Button>Сравнить</Button>
            </Space>
          </Space>
        </Col>

        <Col xs={24} xl={7}>
          <Card className="auction-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Typography.Text strong>Аукционный блок</Typography.Text>
              {lot.auctionEnabled ? (
                <>
                  <Typography.Text>Текущая ставка: {(lot.pricePerTon + 300).toLocaleString('ru-RU')} ₽/т</Typography.Text>
                  <Typography.Text>Шаг торгов: 50 ₽</Typography.Text>
                  <Typography.Text>До окончания: 04:21:14</Typography.Text>
                  <Typography.Text>Ставок: 12</Typography.Text>
                  <AuctionBidPanel lotId={lot.id} basePrice={lot.pricePerTon} />
                </>
              ) : (
                <Typography.Text type="secondary">Лот размещен в формате прямой продажи.</Typography.Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

function EquipmentLotCard({ lot, isVerified, onAdd }: { lot: EquipmentLot; isVerified: boolean; onAdd: () => void }) {
  const navigate = useNavigate();

  return (
    <Card className="lot-card">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}><img src={lotImageMap[lot.id]?.[0]} alt={lot.title} className="lot-image-thumb" /></Col>
        <Col xs={24} xl={16}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color="blue">{lot.brand}</Tag>
              <Tag>{lot.year} г.</Tag>
              <Tag color={lot.condition === 'new' ? 'gold' : 'default'}>{lot.condition === 'new' ? 'Новая' : 'Б/у'}</Tag>
              <Tag color={isVerified ? 'success' : 'warning'} icon={<CheckCircleOutlined />}>{isVerified ? 'Проверенный продавец' : 'Без проверки'}</Tag>
            </Space>
            <Typography.Title level={3}>{lot.title}</Typography.Title>
            <div className="grain-grid">
              <InfoCell label="Цена" value={`${lot.price.toLocaleString('ru-RU')} ₽`} strong />
              <InfoCell label="Регион" value={lot.region} />
              <InfoCell label="Продавец" value={lot.sellerName} />
              <InfoCell label="Документы" value="ПСМ и договор в наличии" />
              <InfoCell label="Лизинг" value="Доступен" />
              <InfoCell label="Доставка" value="По согласованию" />
            </div>
            <Typography.Paragraph>{lot.description}</Typography.Paragraph>
            <Space wrap>
              <Button type="primary" onClick={onAdd}>Запросить предложение</Button>
              <Button onClick={() => navigate(`/marketplace/lot/${lot.id}`)}>Открыть карточку</Button>
              <Button icon={<HeartOutlined />}>В избранное</Button>
            </Space>
          </Space>
        </Col>
      </Row>
    </Card>
  );
}

function InfoCell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="info-cell">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <Typography.Text strong={strong}>{value}</Typography.Text>
    </div>
  );
}

function EmptyState({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <Card>
      <Empty description={title}><Button type="primary" onClick={onAction}>{actionLabel}</Button></Empty>
    </Card>
  );
}
