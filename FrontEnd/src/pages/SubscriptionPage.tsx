import {
  AreaChartOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FilterOutlined,
  LineChartOutlined,
  MailOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TableOutlined,
  CreditCardOutlined,
  CrownOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  Modal,
  Result,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { portalApi } from '../services/portalApi';
import { useAppStore } from '../store/appStore';
import type {
  AnalyticsChartPointDto,
  AnalyticsCultureCardDto,
  AnalyticsFiltersDto,
  AnalyticsMarketResponseDto,
  AnalyticsOptionsDto,
  AnalyticsPriceRowDto,
  AnalyticsRegionSignalDto,
  AnalyticsReviewDto,
  AnalyticsSignalImpactDto,
  AnalyticsSignalRowDto,
  AnalyticsSignalsResponseDto,
  AnalyticsTariffPlanDto,
  AnalyticsTariffsResponseDto,
} from '../services/portalApi';

const { RangePicker } = DatePicker;

type Trend = 'up' | 'down' | 'flat' | 'none';

type AnalyticsFilters = Required<Pick<AnalyticsFiltersDto, 'culture' | 'className' | 'region' | 'basis' | 'period' | 'dataType'>>;
type SignalFilters = Required<Pick<AnalyticsFiltersDto, 'culture' | 'region' | 'risk' | 'type' | 'period'>>;

const fallbackOptions: AnalyticsOptionsDto = {
  cultures: ['Все культуры', 'Пшеница', 'Кукуруза', 'Ячмень'],
  classes: ['Любой класс', '3 класс', '4 класс', '5 класс', 'Фуражная'],
  regions: ['Все регионы', 'Россия', 'Центральный ФО', 'Южный ФО', 'Приволжский ФО', 'Сибирский ФО'],
  basis: ['Любой базис', 'EXW', 'CPT', 'FOB', 'Элеватор', 'Порт'],
  periods: ['День', 'Неделя', 'Месяц', 'Сезон'],
  dataTypes: ['Цена', 'Динамика', 'Прогноз', 'Сигнал'],
};

const baseFilters: AnalyticsFilters = {
  culture: 'Все культуры',
  className: 'Любой класс',
  region: 'Все регионы',
  basis: 'Любой базис',
  period: 'Месяц',
  dataType: 'Цена',
};


function analyticsFiltersFromSearch(search: string): AnalyticsFilters {
  const params = new URLSearchParams(search);
  return {
    ...baseFilters,
    culture: params.get('culture') ?? baseFilters.culture,
    region: params.get('region') ?? baseFilters.region,
    className: params.get('className') ?? baseFilters.className,
    basis: params.get('basis') ?? baseFilters.basis,
    period: params.get('period') ?? baseFilters.period,
    dataType: params.get('dataType') ?? baseFilters.dataType,
  };
}

const baseSignalFilters: SignalFilters = {
  culture: 'Все культуры',
  region: 'Все регионы',
  risk: 'Все риски',
  type: 'Все типы',
  period: 'Месяц',
};

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Нет данных';
  return `${Math.round(value).toLocaleString('ru-RU')} ₽/т`;
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value).toLocaleString('ru-RU')} ₽/т`;
}

function formatChangeRub(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '0 ₽/т';
  return `${value > 0 ? '+' : ''}${Math.round(value).toLocaleString('ru-RU')} ₽/т`;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}

function trendLabel(trend: Trend | string) {
  if (trend === 'up') return 'Рост';
  if (trend === 'down') return 'Снижение';
  if (trend === 'flat') return 'Без изменений';
  return 'Нет данных';
}

function trendClass(trend: Trend | string) {
  if (trend === 'up') return 'analytics-trend analytics-trend--up';
  if (trend === 'down') return 'analytics-trend analytics-trend--down';
  if (trend === 'flat') return 'analytics-trend analytics-trend--flat';
  return 'analytics-trend analytics-trend--none';
}

function riskColor(risk: string) {
  if (risk === 'high' || risk === 'Высокий риск') return 'red';
  if (risk === 'medium' || risk === 'Средний риск') return 'gold';
  if (risk === 'low' || risk === 'Низкий риск') return 'green';
  return 'blue';
}

function riskClass(risk: string) {
  if (risk === 'high') return 'analytics-signal-card analytics-signal-card--high';
  if (risk === 'medium') return 'analytics-signal-card analytics-signal-card--medium';
  if (risk === 'low') return 'analytics-signal-card analytics-signal-card--low';
  return 'analytics-signal-card analytics-signal-card--info';
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: AnalyticsPriceRowDto[]) {
  const header = ['Культура', 'Класс', 'Регион', 'Базис', 'Цена, ₽/т', 'Изменение, ₽/т', 'Изменение, %', 'Дата обновления', 'Источник'];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const body = rows.map((row) => [row.culture, row.className, row.region, row.basis, row.price, row.changeRub, row.changePercent, row.updatedAt, row.source].map(escape).join(';'));
  return [header.map(escape).join(';'), ...body].join('\n');
}

function TinySparkline({ values, trend }: { values: number[]; trend: Trend | string }) {
  if (!values.length) {
    return <div className="analytics-sparkline analytics-sparkline--empty">Нет данных</div>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 36 - ((value - min) / range) * 30;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className={`analytics-sparkline analytics-sparkline--${trend}`} viewBox="0 0 100 42" preserveAspectRatio="none" aria-label="Мини-график">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AnalyticsHero({ title, description, icon }: { title: string; description: string; icon: ReactNode }) {
  return (
    <Card className="analytics-hero">
      <div className="analytics-hero__content">
        <Space direction="vertical" size={10}>
          <Tag color="green" className="analytics-hero__tag">Аналитика зернового рынка</Tag>
          <Typography.Title level={1}>{title}</Typography.Title>
          <Typography.Paragraph className="lead-text">{description}</Typography.Paragraph>
        </Space>
        <div className="analytics-hero__visual" aria-hidden="true">
          {icon}
          <span />
          <span />
          <span />
        </div>
      </div>
    </Card>
  );
}

function PageNavActions() {
  const navigate = useNavigate();

  return (
    <Space wrap className="analytics-page-tabs">
      <Button onClick={() => navigate('/analytics')}>Обзоры рынка</Button>
      <Button onClick={() => navigate('/analytics/signals')}>Сигналы по посевам</Button>
      <Button onClick={() => navigate('/analytics/subscription')}>Подписка</Button>
      <Button onClick={() => navigate('/analytics/demo')}>Пример отчета</Button>
      <Button onClick={() => navigate('/analytics/tariffs')}>Тарифы</Button>
    </Space>
  );
}

function AnalyticsFilterPanel({
  filters,
  options,
  onChange,
  onApply,
  onReset,
  loading,
}: {
  filters: AnalyticsFilters;
  options?: AnalyticsOptionsDto;
  onChange: (next: AnalyticsFilters) => void;
  onApply: () => void;
  onReset: () => void;
  loading?: boolean;
}) {
  const opts = options ?? fallbackOptions;
  const setFilter = (key: keyof AnalyticsFilters, value: string) => onChange({ ...filters, [key]: value });

  return (
    <Card className="analytics-filter-card">
      <div className="analytics-filter-card__header">
        <Space size={8}>
          <FilterOutlined />
          <Typography.Text strong>Фильтры</Typography.Text>
        </Space>
        <Button onClick={onReset}>Сбросить</Button>
      </div>
      <div className="analytics-filter-grid">
        <label>
          <span>Культура</span>
          <Select showSearch value={filters.culture} options={opts.cultures.map((value) => ({ value, label: value }))} onChange={(value) => setFilter('culture', value)} />
        </label>
        <label>
          <span>Класс</span>
          <Select showSearch value={filters.className} options={opts.classes.map((value) => ({ value, label: value }))} onChange={(value) => setFilter('className', value)} />
        </label>
        <label>
          <span>Регион</span>
          <Select showSearch value={filters.region} options={opts.regions.map((value) => ({ value, label: value }))} onChange={(value) => setFilter('region', value)} />
        </label>
        <label>
          <span>Базис</span>
          <Select showSearch value={filters.basis} options={opts.basis.map((value) => ({ value, label: value }))} onChange={(value) => setFilter('basis', value)} />
        </label>
        <label>
          <span>Период</span>
          <Select value={filters.period} options={opts.periods.map((value) => ({ value, label: value }))} onChange={(value) => setFilter('period', value)} />
        </label>
        <label>
          <span>Дата</span>
          <RangePicker format="DD.MM.YYYY" placeholder={['Начало', 'Конец']} />
        </label>
        <label>
          <span>Тип данных</span>
          <Select value={filters.dataType} options={opts.dataTypes.map((value) => ({ value, label: value }))} onChange={(value) => setFilter('dataType', value)} />
        </label>
        <Button type="primary" loading={loading} className="analytics-filter-card__apply" onClick={onApply}>Применить фильтры</Button>
      </div>
    </Card>
  );
}

function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (mounted) setData(result);
      })
      .catch((reason: unknown) => {
        if (mounted) setError(reason instanceof Error ? reason.message : 'Не удалось загрузить данные аналитики');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}


function SubscriptionRequired({ title = 'Приобретите подписку' }: { title?: string }) {
  const navigate = useNavigate();
  return (
    <Card className="analytics-locked-card">
      <Result
        icon={<CrownOutlined />}
        title={title}
        subTitle="Эти данные доступны только по подписке на аналитику. После оплаты откроются таблицы, графики, сигналы, экспорт и подробные отчеты."
        extra={[
          <Button key="tariffs" type="primary" onClick={() => navigate('/analytics/tariffs')}>Приобрести подписку</Button>,
          <Button key="example" onClick={() => navigate('/analytics/demo')}>Посмотреть пример отчета</Button>,
        ]}
      />
    </Card>
  );
}

function MarketChart({ data }: { data: AnalyticsChartPointDto[] }) {
  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis width={78} tickFormatter={(value) => `${Number(value) / 1000} тыс.`} />
          <RechartsTooltip formatter={(value: unknown) => `${Number(value).toLocaleString('ru-RU')} ₽/т`} />
          <Legend />
          <Line type="monotone" dataKey="average" name="Средняя цена" stroke="#1f6b3a" strokeWidth={3} dot={false} />
          <Line type="monotone" dataKey="min" name="Минимальная цена" stroke="#9aa29b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="max" name="Максимальная цена" stroke="#d9a52c" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const subscription = useAppStore((state) => state.subscription);
  const location = useLocation();
  const initialFilters = useMemo(() => analyticsFiltersFromSearch(location.search), [location.search]);
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<AnalyticsFilters>(initialFilters);
  const [searchRegion, setSearchRegion] = useState('');
  const [review, setReview] = useState<AnalyticsReviewDto | null>(null);

  useEffect(() => {
    setDraftFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [initialFilters]);
  const { data, loading, error } = useAsyncData<AnalyticsMarketResponseDto>(() => portalApi.getAnalyticsMarket(appliedFilters), [appliedFilters]);

  const tableRows = useMemo(() => {
    const rows = data?.priceRows ?? [];
    const query = searchRegion.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => row.region.toLowerCase().includes(query));
  }, [data, searchRegion]);

  const priceColumns: ColumnsType<AnalyticsPriceRowDto> = [
    { title: 'Культура', dataIndex: 'culture', key: 'culture', fixed: 'left', sorter: (a, b) => a.culture.localeCompare(b.culture) },
    { title: 'Класс', dataIndex: 'className', key: 'className' },
    { title: 'Регион', dataIndex: 'region', key: 'region' },
    { title: 'Базис', dataIndex: 'basis', key: 'basis' },
    { title: 'Цена, ₽/т', dataIndex: 'price', key: 'price', sorter: (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0), render: (value: number | null) => formatPrice(value) },
    { title: 'Изменение, ₽/т', dataIndex: 'changeRub', key: 'changeRub', sorter: (a, b) => Number(a.changeRub ?? 0) - Number(b.changeRub ?? 0), render: (value: number | null) => formatChangeRub(value) },
    { title: 'Изменение, %', dataIndex: 'changePercent', key: 'changePercent', sorter: (a, b) => Number(a.changePercent ?? 0) - Number(b.changePercent ?? 0), render: (value: number | null) => formatPercent(value) },
    { title: 'Тренд', key: 'trend', render: (_, row) => <span className={trendClass(row.trend)}>{trendLabel(row.trend)}</span> },
    { title: 'Дата обновления', dataIndex: 'updatedAt', key: 'updatedAt' },
    { title: 'Источник', dataIndex: 'source', key: 'source' },
  ];

  const regionColumns: ColumnsType<AnalyticsMarketResponseDto['regionRows'][number]> = [
    { title: 'Регион', dataIndex: 'region', key: 'region', fixed: 'left' },
    { title: 'Культура', dataIndex: 'culture', key: 'culture' },
    { title: 'Средняя цена', dataIndex: 'averagePrice', key: 'averagePrice', render: (value: number) => formatMoney(value) },
    { title: 'Минимальная цена', dataIndex: 'minPrice', key: 'minPrice', render: (value: number) => formatMoney(value) },
    { title: 'Максимальная цена', dataIndex: 'maxPrice', key: 'maxPrice', render: (value: number) => formatMoney(value) },
    { title: 'Изменение за период', dataIndex: 'changeRub', key: 'changeRub', render: (value: number) => formatChangeRub(value) },
    { title: 'Активность спроса', dataIndex: 'demandActivity', key: 'demandActivity', render: (value: string) => <Tag color={value === 'Высокая' ? 'green' : value === 'Средняя' ? 'gold' : 'default'}>{value}</Tag> },
    { title: 'Активность предложения', dataIndex: 'supplyActivity', key: 'supplyActivity', render: (value: string) => <Tag color={value === 'Высокая' ? 'blue' : value === 'Средняя' ? 'gold' : 'default'}>{value}</Tag> },
  ];

  const exportExcel = () => {
    downloadFile('zerno-analytics-prices.csv', toCsv(tableRows), 'text/csv;charset=utf-8');
    message.success('Таблица цен выгружена');
  };

  const exportPdf = () => {
    const lines = [
      'Аналитический отчет ЗерноАгроМир',
      `Сформировано: ${data?.generatedAt ?? new Date().toLocaleString('ru-RU')}`,
      '',
      data?.summary.text ?? '',
      ...(data?.summary.items ?? []),
      '',
      ...tableRows.map((row) => `${row.culture}; ${row.className}; ${row.region}; ${row.basis}; ${formatPrice(row.price)}; ${formatChangeRub(row.changeRub)}`),
    ];
    downloadFile('zerno-analytics-report.txt', lines.join('\n'), 'text/plain;charset=utf-8');
    message.success('Отчет сформирован');
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageNavActions />
      <AnalyticsHero
        title="Обзоры рынка"
        description="Аналитические материалы, ценовые тренды и рыночные изменения по основным зерновым культурам. Данные загружаются из backend и пересчитываются по фильтрам."
        icon={<AreaChartOutlined />}
      />
      <AnalyticsFilterPanel
        filters={draftFilters}
        options={data?.options}
        loading={loading}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters(draftFilters)}
        onReset={() => {
          setDraftFilters(baseFilters);
          setAppliedFilters(baseFilters);
        }}
      />
      {error && <Alert type="error" showIcon message="Не удалось загрузить аналитику" description={error} />}
      {!subscription.isActive && <SubscriptionRequired />}
      {subscription.isActive && <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {(data?.cards ?? []).map((card: AnalyticsCultureCardDto) => (
            <Col xs={24} md={12} xl={8} key={card.culture}>
              <Card className="analytics-culture-card">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div className="analytics-culture-card__head">
                    <div>
                      <Typography.Title level={3}>{card.culture}</Typography.Title>
                      <Typography.Text type="secondary">{card.className}</Typography.Text>
                    </div>
                    <span className={`analytics-culture-card__icon analytics-culture-card__icon--${card.trend}`}>🌾</span>
                  </div>
                  <Statistic title="Текущая цена" value={card.price ?? 0} precision={0} suffix="₽/т" valueStyle={{ fontSize: 28 }} formatter={() => formatPrice(card.price)} />
                  <Space wrap>
                    <span className={trendClass(card.trend)}>{card.trendLabel}</span>
                    <Tag>{formatChangeRub(card.changeRub)}</Tag>
                    <Tag>{formatPercent(card.changePercent)}</Tag>
                  </Space>
                  <TinySparkline values={card.series} trend={card.trend} />
                  <Typography.Text type="secondary">Обновлено: {card.updatedAt}</Typography.Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} xl={14}>
            <Card title="График динамики" extra={<Segmented options={fallbackOptions.periods} value={draftFilters.period} onChange={(value) => setDraftFilters({ ...draftFilters, period: String(value) })} />} className="analytics-chart-card">
              <MarketChart data={data?.chartSeries ?? []} />
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card title={data?.summary.title ?? 'Краткий вывод по рынку'} extra={<RiseOutlined />} className="analytics-summary-card">
              {data ? (
                <Space direction="vertical" size={12}>
                  <Typography.Paragraph>{data.summary.text}</Typography.Paragraph>
                  <List size="small" dataSource={data.summary.items} renderItem={(item) => <List.Item>{item}</List.Item>} />
                  <Typography.Text type="secondary">Вывод сформирован: {data.summary.generatedAt}</Typography.Text>
                  <Button type="primary" onClick={() => navigate('/analytics/demo')}>Посмотреть пример отчета</Button>
                </Space>
              ) : <Empty description="Нет данных" />}
            </Card>
          </Col>
        </Row>

        <Card
          title="Цены по культурам"
          extra={<Space wrap><Input.Search placeholder="Поиск по региону" allowClear onSearch={setSearchRegion} onChange={(event) => setSearchRegion(event.target.value)} /><Button icon={<DownloadOutlined />} onClick={exportExcel}>Скачать Excel</Button><Button icon={<FileDoneOutlined />} onClick={exportPdf}>Скачать PDF</Button></Space>}
          style={{ marginTop: 16 }}
        >
          <Table rowKey="id" columns={priceColumns} dataSource={tableRows} scroll={{ x: 1200 }} pagination={{ pageSize: 8 }} />
        </Card>

        <Card title="Динамика по регионам" style={{ marginTop: 16 }}>
          <Table rowKey="id" columns={regionColumns} dataSource={data?.regionRows ?? []} scroll={{ x: 1100 }} pagination={{ pageSize: 6 }} />
        </Card>

        <Card title="Лента аналитических обзоров" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            {(data?.reviews ?? []).map((item) => (
              <Col xs={24} md={12} xl={8} key={item.id}>
                <Card className="analytics-review-card">
                  <Space direction="vertical" size={10}>
                    <Space wrap><Tag>{item.type}</Tag><Tag color={item.access === 'Бесплатно' ? 'green' : 'blue'}>{item.access}</Tag></Space>
                    <Typography.Title level={3}>{item.title}</Typography.Title>
                    <Typography.Text type="secondary">{item.culture} · {item.region} · {item.date}</Typography.Text>
                    <Typography.Paragraph>{item.description}</Typography.Paragraph>
                    <Button onClick={() => setReview(item)}>Читать обзор</Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Spin>}
      <Drawer title={review?.title} open={Boolean(review)} onClose={() => setReview(null)} width={560}>
        {review && (
          <Space direction="vertical" size={14}>
            <Space wrap><Tag>{review.type}</Tag><Tag>{review.culture}</Tag><Tag>{review.region}</Tag><Tag color={review.access === 'Бесплатно' ? 'green' : 'blue'}>{review.access}</Tag></Space>
            <Typography.Paragraph>{review.description}</Typography.Paragraph>
            <Typography.Text type="secondary">Дата публикации: {review.date}</Typography.Text>
            <Button type="primary" onClick={() => navigate('/news?section=analytics')}>Открыть материалы новостей</Button>
          </Space>
        )}
      </Drawer>
    </Space>
  );
}

export function AnalyticsSignalsPage() {
  const [draftFilters, setDraftFilters] = useState<SignalFilters>(baseSignalFilters);
  const [appliedFilters, setAppliedFilters] = useState<SignalFilters>(baseSignalFilters);
  const [selectedSignal, setSelectedSignal] = useState<AnalyticsSignalRowDto | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<AnalyticsRegionSignalDto | null>(null);
  const navigate = useNavigate();
  const subscription = useAppStore((state) => state.subscription);
  const { data, loading, error } = useAsyncData<AnalyticsSignalsResponseDto>(() => portalApi.getAnalyticsSignals(appliedFilters), [appliedFilters]);

  const openSignalDetails = (signal: AnalyticsSignalRowDto) => {
    setSelectedSignal(signal);
    const relatedRegion = data?.regionDetails.find((region) => region.region === signal.region) ?? null;
    if (relatedRegion) {
      setSelectedRegion(relatedRegion);
    }
  };

  const openSignalPrices = (signal: AnalyticsSignalRowDto) => {
    setSelectedSignal(null);
    navigate(`/analytics?culture=${encodeURIComponent(signal.culture)}&region=${encodeURIComponent(signal.region)}`);
  };

  const downloadSignal = (signal: AnalyticsSignalRowDto) => {
    const content = [
      'Сигнал по посевам ЗерноАгроМир',
      `Дата: ${signal.date}`,
      `Регион: ${signal.region}`,
      `Культура: ${signal.culture}`,
      `Фаза: ${signal.phase}`,
      `Тип сигнала: ${signal.type}`,
      `Риск: ${signal.riskLabel}`,
      `Влияние на цену: ${signal.priceImpact}`,
      `Горизонт: ${signal.horizon}`,
      `Уверенность: ${signal.confidence}`,
      `Источник: ${signal.source}`,
      '',
      signal.description,
    ].join('\n');
    downloadFile(`zerno-signal-${signal.id}.txt`, content, 'text/plain;charset=utf-8');
    message.success('Сигнал выгружен');
  };

  const signalColumns: ColumnsType<AnalyticsSignalRowDto> = [
    { title: 'Дата', dataIndex: 'date', key: 'date' },
    { title: 'Регион', dataIndex: 'region', key: 'region' },
    { title: 'Культура', dataIndex: 'culture', key: 'culture' },
    { title: 'Фаза', dataIndex: 'phase', key: 'phase' },
    { title: 'Тип сигнала', dataIndex: 'type', key: 'type' },
    { title: 'Описание', dataIndex: 'description', key: 'description', width: 360 },
    { title: 'Уровень риска', dataIndex: 'riskLabel', key: 'riskLabel', render: (value: string, row) => <Tag color={riskColor(row.risk)}>{value}</Tag> },
    { title: 'Влияние на цену', dataIndex: 'priceImpact', key: 'priceImpact' },
    { title: 'Статус', dataIndex: 'status', key: 'status' },
    { title: 'Источник', dataIndex: 'source', key: 'source' },
    { title: 'Действие', key: 'action', render: (_, row) => <Button type="link" onClick={(event) => { event.stopPropagation(); openSignalDetails(row); }}>Подробнее</Button> },
  ];

  const impactColumns: ColumnsType<AnalyticsSignalImpactDto> = [
    { title: 'Сигнал', dataIndex: 'signal', key: 'signal', width: 360 },
    { title: 'Регион', dataIndex: 'region', key: 'region' },
    { title: 'Культура', dataIndex: 'culture', key: 'culture' },
    { title: 'Предложение', dataIndex: 'supplyImpact', key: 'supplyImpact' },
    { title: 'Качество', dataIndex: 'qualityImpact', key: 'qualityImpact' },
    { title: 'Цена', dataIndex: 'priceImpact', key: 'priceImpact' },
    { title: 'Горизонт влияния', dataIndex: 'horizon', key: 'horizon' },
    { title: 'Уверенность', dataIndex: 'confidence', key: 'confidence' },
    {
      title: 'Действие',
      key: 'action',
      render: (_, row) => {
        const signal = data?.signals.find((item) => item.id === row.id || item.region === row.region && item.culture === row.culture);
        return signal ? <Button type="link" onClick={() => openSignalDetails(signal)}>Подробнее</Button> : <Button type="link" onClick={() => navigate(`/analytics?culture=${encodeURIComponent(row.culture)}&region=${encodeURIComponent(row.region)}`)}>Связанные цены</Button>;
      },
    },
  ];

  const signalOptions = data?.options;
  const setFilter = (key: keyof SignalFilters, value: string) => setDraftFilters({ ...draftFilters, [key]: value });

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageNavActions />
      <AnalyticsHero title="Сигналы по посевам" description="Мониторинг погодных, агрономических и региональных факторов, влияющих на урожайность, качество и рынок зерна." icon={<CloudOutlined />} />
      <Card className="analytics-filter-card">
        <div className="analytics-filter-card__header"><Space><FilterOutlined /><Typography.Text strong>Фильтры</Typography.Text></Space><Button onClick={() => { setDraftFilters(baseSignalFilters); setAppliedFilters(baseSignalFilters); }}>Сбросить</Button></div>
        <div className="analytics-filter-grid">
          <label><span>Культура</span><Select showSearch value={draftFilters.culture} options={(signalOptions?.cultures ?? fallbackOptions.cultures).map((value) => ({ value, label: value }))} onChange={(value) => setFilter('culture', value)} /></label>
          <label><span>Регион</span><Select showSearch value={draftFilters.region} options={(signalOptions?.regions ?? fallbackOptions.regions).map((value) => ({ value, label: value }))} onChange={(value) => setFilter('region', value)} /></label>
          <label><span>Тип сигнала</span><Select value={draftFilters.type} options={(signalOptions?.types ?? ['Все типы', 'Погода', 'Посевы', 'Уборка', 'Качество', 'Логистика']).map((value) => ({ value, label: value }))} onChange={(value) => setFilter('type', value)} /></label>
          <label><span>Уровень риска</span><Select value={draftFilters.risk} options={(signalOptions?.risks ?? ['Все риски', 'Высокий риск', 'Средний риск', 'Низкий риск']).map((value) => ({ value, label: value }))} onChange={(value) => setFilter('risk', value)} /></label>
          <label><span>Период</span><Select value={draftFilters.period} options={fallbackOptions.periods.map((value) => ({ value, label: value }))} onChange={(value) => setFilter('period', value)} /></label>
          <Button type="primary" loading={loading} onClick={() => setAppliedFilters(draftFilters)}>Применить фильтры</Button>
        </div>
      </Card>
      {error && <Alert type="error" showIcon message="Не удалось загрузить сигналы" description={error} />}
      {!subscription.isActive && <SubscriptionRequired />}
      {subscription.isActive && <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {(data?.signals ?? []).slice(0, 8).map((signal) => (
            <Col xs={24} md={12} xl={6} key={signal.id}>
              <Card className={riskClass(signal.risk)}>
                <Space direction="vertical" size={10}>
                  <Space wrap><Tag color={riskColor(signal.risk)}>{signal.riskLabel}</Tag><Tag>{signal.status}</Tag></Space>
                  <Typography.Title level={3}>{signal.region}</Typography.Title>
                  <Typography.Text strong>{signal.culture} · {signal.type}</Typography.Text>
                  <Typography.Paragraph type="secondary">{signal.description}</Typography.Paragraph>
                  <Typography.Text>Влияние: {signal.priceImpact}</Typography.Text>
                  <Typography.Text type="secondary">Обновлено: {signal.date}</Typography.Text>
                  <Button type="primary" onClick={() => openSignalDetails(signal)}>Подробнее</Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} xl={14}>
            <Card title="Карта регионов" extra={<Tag>Клик по региону открывает детали</Tag>}>
              <div className="analytics-map-grid">
                {(data?.regionDetails ?? []).map((region) => (
                  <button key={region.region} className={`analytics-map-region analytics-map-region--${region.risk}`} onClick={() => setSelectedRegion(region)}>
                    <span>{region.region}</span>
                    <strong>{region.risk === 'high' ? 'Высокий риск' : region.risk === 'medium' ? 'Средний риск' : region.risk === 'low' ? 'Низкий риск' : 'Инфо'}</strong>
                  </button>
                ))}
              </div>
            </Card>
          </Col>
          <Col xs={24} xl={10}>
            <Card title="Боковая панель региона" className="analytics-summary-card">
              {selectedRegion ? (
                <Space direction="vertical" size={12}>
                  <Typography.Title level={3}>{selectedRegion.region}</Typography.Title>
                  <Tag color={riskColor(selectedRegion.risk)}>{selectedRegion.risk === 'high' ? 'Высокий риск' : selectedRegion.risk === 'medium' ? 'Средний риск' : selectedRegion.risk === 'low' ? 'Низкий риск' : 'Инфо'}</Tag>
                  <Typography.Text>Основные культуры: {selectedRegion.cultures.join(', ')}.</Typography.Text>
                  <Typography.Text>Последний сигнал: {selectedRegion.lastSignal}</Typography.Text>
                  <Typography.Text>Факторы: {selectedRegion.factors.join(', ')}.</Typography.Text>
                  <Typography.Text>Возможное влияние: {selectedRegion.impact}</Typography.Text>
                  <Button type="primary" onClick={() => navigate(`/analytics?region=${encodeURIComponent(selectedRegion.region)}`)}>Открыть связанные цены</Button>
                </Space>
              ) : <Empty description="Выберите регион на карте" />}
            </Card>
          </Col>
        </Row>

        <Card title="Сигналы" style={{ marginTop: 16 }}>
          <Table
            rowKey="id"
            columns={signalColumns}
            dataSource={data?.signals ?? []}
            scroll={{ x: 1400 }}
            pagination={{ pageSize: 6 }}
            onRow={(record) => ({
              onClick: () => openSignalDetails(record),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>

        <Card title="Влияние сигналов на рынок" style={{ marginTop: 16 }}>
          <Table rowKey="id" columns={impactColumns} dataSource={data?.impacts ?? []} scroll={{ x: 1100 }} pagination={{ pageSize: 6 }} />
        </Card>
      </Spin>}
      <Modal
        title="Подробности сигнала"
        open={Boolean(selectedSignal)}
        onCancel={() => setSelectedSignal(null)}
        width={720}
        footer={selectedSignal ? [
          <Button key="download" icon={<DownloadOutlined />} onClick={() => downloadSignal(selectedSignal)}>Скачать сигнал</Button>,
          <Button key="notify" onClick={() => navigate('/analytics/subscription')}>Настроить уведомления</Button>,
          <Button key="prices" type="primary" onClick={() => openSignalPrices(selectedSignal)}>Открыть связанные цены</Button>,
        ] : null}
      >
        {selectedSignal && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color={riskColor(selectedSignal.risk)}>{selectedSignal.riskLabel}</Tag>
              <Tag>{selectedSignal.status}</Tag>
              <Tag>{selectedSignal.horizon}</Tag>
              <Tag>{selectedSignal.confidence}</Tag>
            </Space>
            <Typography.Title level={3}>{selectedSignal.region} · {selectedSignal.culture}</Typography.Title>
            <Card size="small">
              <Row gutter={[16, 12]}>
                <Col xs={24} md={12}><Typography.Text type="secondary">Фаза</Typography.Text><br /><Typography.Text strong>{selectedSignal.phase}</Typography.Text></Col>
                <Col xs={24} md={12}><Typography.Text type="secondary">Тип сигнала</Typography.Text><br /><Typography.Text strong>{selectedSignal.type}</Typography.Text></Col>
                <Col xs={24} md={12}><Typography.Text type="secondary">Влияние на цену</Typography.Text><br /><Typography.Text strong>{selectedSignal.priceImpact}</Typography.Text></Col>
                <Col xs={24} md={12}><Typography.Text type="secondary">Источник</Typography.Text><br /><Typography.Text strong>{selectedSignal.source}</Typography.Text></Col>
              </Row>
            </Card>
            <Typography.Paragraph>{selectedSignal.description}</Typography.Paragraph>
            <Alert type="info" showIcon message="Что делать дальше" description="Откройте связанные цены по культуре и региону или настройте уведомления, чтобы получать новые сигналы автоматически." />
          </Space>
        )}
      </Modal>
    </Space>
  );
}

export function AnalyticsSubscriptionPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    cultures: ['Пшеница'],
    classes: ['3 класс'],
    regions: ['Центральный ФО'],
    notificationTypes: ['Цена', 'Сигнал'],
    channels: ['Личный кабинет'],
    frequency: 'Ежедневно',
  });
  const features = [
    { icon: <TableOutlined />, title: 'Ценовые данные', text: 'Актуальные цены, динамика и фильтрация по культурам, регионам и базисам.' },
    { icon: <FileTextOutlined />, title: 'Рыночные обзоры', text: 'Краткие выводы аналитиков и система факторов влияния на цену.' },
    { icon: <CloudOutlined />, title: 'Сигналы по посевам', text: 'Риски урожайности, качества и предложения по регионам.' },
    { icon: <LineChartOutlined />, title: 'Прогнозы', text: 'Ожидаемое направление цены и горизонт влияния.' },
    { icon: <BellOutlined />, title: 'Уведомления', text: 'Оповещения по выбранным культурам, регионам и событиям.' },
    { icon: <DownloadOutlined />, title: 'Экспорт данных', text: 'Выгрузка таблиц и отчетов для работы команды.' },
  ];
  const audiences = [
    ['Производитель', 'Понимание, когда и по какой цене продавать урожай.'],
    ['Трейдер', 'Быстрый обзор рынка, региональных изменений и спроса.'],
    ['Закупщик', 'Контроль цен, рисков роста и альтернативных регионов закупки.'],
    ['Экспортер', 'Данные по ценам, логистике и рыночной активности.'],
  ];

  const saveSettings = async () => {
    setSaving(true);
    try {
      await portalApi.saveAnalyticsSubscriptionSettings(settings);
      message.success('Настройки подписки сохранены');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageNavActions />
      <AnalyticsHero title="Подписка на аналитику" description="Доступ к ценовым данным, обзорам, сигналам, прогнозам и уведомлениям по зерновому рынку." icon={<SafetyCertificateOutlined />} />
      <Card><Space wrap><Button type="primary" size="large" onClick={() => navigate('/analytics/tariffs')}>Выбрать тариф</Button><Button size="large" onClick={() => navigate('/analytics/demo')}>Посмотреть пример отчета</Button></Space></Card>
      <Card title="Что входит в подписку"><Row gutter={[16, 16]}>{features.map((feature) => <Col xs={24} md={12} xl={8} key={feature.title}><Card className="analytics-feature-card"><Space direction="vertical" size={10}><span className="analytics-feature-card__icon">{feature.icon}</span><Typography.Title level={3}>{feature.title}</Typography.Title><Typography.Paragraph type="secondary">{feature.text}</Typography.Paragraph></Space></Card></Col>)}</Row></Card>
      <Card title="Для кого подходит"><Row gutter={[16, 16]}>{audiences.map(([title, text]) => <Col xs={24} md={12} xl={6} key={title}><Card className="analytics-audience-card"><Typography.Title level={3}>{title}</Typography.Title><Typography.Paragraph type="secondary">{text}</Typography.Paragraph></Card></Col>)}</Row></Card>
      <Card title="Настройка подписки" extra={<SettingOutlined />}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}><Typography.Text strong>Культуры</Typography.Text><Checkbox.Group className="analytics-checkbox-group" options={['Пшеница', 'Кукуруза', 'Ячмень']} value={settings.cultures} onChange={(value) => setSettings({ ...settings, cultures: value.map(String) })} /></Col>
          <Col xs={24} lg={8}><Typography.Text strong>Классы</Typography.Text><Select mode="multiple" value={settings.classes} options={fallbackOptions.classes.slice(1).map((value) => ({ value, label: value }))} style={{ width: '100%', marginTop: 8 }} onChange={(value) => setSettings({ ...settings, classes: value })} /></Col>
          <Col xs={24} lg={8}><Typography.Text strong>Регионы</Typography.Text><Select mode="multiple" value={settings.regions} options={fallbackOptions.regions.slice(1).map((value) => ({ value, label: value }))} style={{ width: '100%', marginTop: 8 }} onChange={(value) => setSettings({ ...settings, regions: value })} /></Col>
          <Col xs={24} lg={8}><Typography.Text strong>Типы уведомлений</Typography.Text><Checkbox.Group className="analytics-checkbox-group" options={['Цена', 'Сигнал', 'Прогноз', 'Пошлина']} value={settings.notificationTypes} onChange={(value) => setSettings({ ...settings, notificationTypes: value.map(String) })} /></Col>
          <Col xs={24} lg={8}><Typography.Text strong>Канал</Typography.Text><Checkbox.Group className="analytics-checkbox-group" options={['Личный кабинет', 'Email', 'Telegram']} value={settings.channels} onChange={(value) => setSettings({ ...settings, channels: value.map(String) })} /></Col>
          <Col xs={24} lg={8}><Typography.Text strong>Частота</Typography.Text><Select value={settings.frequency} options={['Ежедневно', 'Еженедельно', 'При изменении цены'].map((value) => ({ value, label: value }))} style={{ width: '100%', marginTop: 8 }} onChange={(frequency) => setSettings({ ...settings, frequency })} /></Col>
          <Col span={24}><Space wrap><Button type="primary" loading={saving} onClick={saveSettings}>Сохранить настройки</Button><Button onClick={() => navigate('/analytics/tariffs')}>Перейти к тарифам</Button></Space></Col>
        </Row>
      </Card>
    </Space>
  );
}

export function AnalyticsDemoPage() {
  const navigate = useNavigate();
  const subscription = useAppStore((state) => state.subscription);
  const { data, loading, error } = useAsyncData(() => portalApi.getAnalyticsReportExample(), []);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageNavActions />
      <AnalyticsHero title="Пример аналитического отчета" description="Посмотрите, какие разделы входят в аналитический отчет и какие данные доступны по подписке." icon={<FileDoneOutlined />} />
      {error && <Alert type="error" message="Не удалось загрузить пример отчета" description={error} showIcon />}
      {!subscription.isActive && <SubscriptionRequired title="Приобретите подписку, чтобы увидеть полный отчет" />}
      {subscription.isActive && <Spin spinning={loading}>
        <Card title="Структура отчета"><Collapse items={(data?.sections ?? []).map((section) => ({ key: section.label, label: section.label, children: section.text }))} defaultActiveKey={['Сводка рынка', 'Цены']} /></Card>
        <Card title="Превью таблицы цен" style={{ marginTop: 16 }}><Table rowKey="id" dataSource={data?.pricePreview ?? []} pagination={false} scroll={{ x: 1000 }} columns={[{ title: 'Культура', dataIndex: 'culture', key: 'culture' }, { title: 'Класс', dataIndex: 'className', key: 'className' }, { title: 'Регион', dataIndex: 'region', key: 'region' }, { title: 'Базис', dataIndex: 'basis', key: 'basis' }, { title: 'Цена, ₽/т', dataIndex: 'price', key: 'price', render: formatPrice }, { title: 'Изменение', dataIndex: 'changeRub', key: 'changeRub', render: formatChangeRub }, { title: 'Дата обновления', dataIndex: 'updatedAt', key: 'updatedAt' }]} /></Card>
        <Card title="Превью графика" style={{ marginTop: 16 }}><MarketChart data={data?.chartPreview ?? []} /></Card>
        <Card title="Что доступно по подписке" style={{ marginTop: 16 }}><Row gutter={[16, 16]}>{['Подробные цены по регионам', 'Динамика за выбранный период', 'Сигналы по культурам', 'Прогнозные выводы', 'Выгрузка отчета', 'Уведомления'].map((item) => <Col xs={24} md={12} xl={8} key={item}><Tag color="green" className="analytics-access-tag"><CheckCircleOutlined /> {item}</Tag></Col>)}</Row><Button type="primary" style={{ marginTop: 18 }} onClick={() => navigate('/analytics/tariffs')}>Перейти к тарифам</Button></Card>
      </Spin>}
    </Space>
  );
}

type PaymentFormValues = {
  payerName: string;
  email: string;
  cardNumber: string;
  expires: string;
  cvc: string;
};

function cleanCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function buildPaymentReceipt(plan: AnalyticsTariffPlanDto, period: 'month' | 'year') {
  return `PAY-${plan.code.toUpperCase()}-${period.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

export function AnalyticsTariffsPage() {
  const loadAll = useAppStore((state) => state.loadAll);
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const { data, loading, error } = useAsyncData<AnalyticsTariffsResponseDto>(() => portalApi.getAnalyticsTariffs(period), [period]);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<AnalyticsTariffPlanDto | null>(null);
  const [contactPlan, setContactPlan] = useState<AnalyticsTariffPlanDto | null>(null);
  const [paidPlanName, setPaidPlanName] = useState<string | null>(null);
  const [paymentForm] = Form.useForm<PaymentFormValues>();

  const openPlanAction = (plan: AnalyticsTariffPlanDto) => {
    if (plan.code === 'corporate' || plan.code === 'enterprise') {
      setContactPlan(plan);
      return;
    }

    paymentForm.setFieldsValue({
      payerName: 'ООО СмолАгроЗакуп',
      email: 'info@zernoagromir.ru',
      cardNumber: '4242 4242 4242 4242',
      expires: '12/29',
      cvc: '123',
    });
    setPaidPlanName(null);
    setPaymentPlan(plan);
  };

  const submitPayment = async () => {
    if (!paymentPlan) return;
    const values = await paymentForm.validateFields();
    setSelecting(paymentPlan.code);
    try {
      const receipt = buildPaymentReceipt(paymentPlan, period);
      await portalApi.selectAnalyticsTariff({
        plan: paymentPlan.code,
        period,
        paymentMode: 'demo',
        receipt,
        payerEmail: values.email,
      });
      await loadAll();
      setPaidPlanName(paymentPlan.name);
      message.success(`Оплата по тарифу «${paymentPlan.name}» прошла успешно`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось провести оплату');
    } finally {
      setSelecting(null);
    }
  };

  const submitEnterpriseRequest = async () => {
    if (!contactPlan) return;
    setSelecting(contactPlan.code);
    try {
      await portalApi.selectAnalyticsTariff({
        plan: contactPlan.code,
        period,
        contactEmail: 'info@zernoagromir.ru',
      });
      message.success('Запрос корпоративных условий отправлен');
      setContactPlan(null);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось отправить запрос');
    } finally {
      setSelecting(null);
    }
  };

  const closePaymentModal = () => {
    setPaymentPlan(null);
    setPaidPlanName(null);
    paymentForm.resetFields();
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageNavActions />
      <AnalyticsHero title="Тарифы аналитики" description="Выберите уровень доступа к ценам, обзорам, сигналам и прогнозам по зерновому рынку." icon={<ThunderboltOutlined />} />
      {error && <Alert type="error" message="Не удалось загрузить тарифы" description={error} showIcon />}
      <Card>
        <Space wrap>
          <Typography.Text strong>Период оплаты</Typography.Text>
          <Segmented value={period} onChange={(value) => setPeriod(value as 'month' | 'year')} options={[{ label: 'Месяц', value: 'month' }, { label: 'Год', value: 'year' }]} />
          {period === 'year' && <Tag color="green">Выгоднее при оплате за год</Tag>}
          <Tag>Активных подписок: {data?.activeSubscriptions ?? 0}</Tag>
        </Space>
      </Card>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {(data?.plans ?? []).map((plan) => (
            <Col xs={24} md={12} xl={8} key={plan.name}>
              <Badge.Ribbon text={plan.accent ? 'Популярный' : ''} color="green" style={{ display: plan.accent ? 'block' : 'none' }}>
                <Card className={`analytics-plan-card ${plan.accent ? 'analytics-plan-card--accent' : ''}`}>
                  <Space direction="vertical" size={14} style={{ width: '100%' }}>
                    <Typography.Title level={2}>{plan.name}</Typography.Title>
                    <Typography.Paragraph type="secondary">{plan.description}</Typography.Paragraph>
                    <Typography.Title level={1}>{plan.price}</Typography.Title>
                    <List dataSource={plan.features} renderItem={(item) => <List.Item><CheckCircleOutlined /> {item}</List.Item>} />
                    <Typography.Text type="secondary">Ограничения: {plan.limits}</Typography.Text>
                    <Button type={plan.accent ? 'primary' : 'default'} loading={selecting === plan.code} onClick={() => openPlanAction(plan)} block>
                      {plan.code === 'corporate' || plan.code === 'enterprise' ? 'Связаться с нами' : 'Купить подписку'}
                    </Button>
                  </Space>
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
        <Card title="Сравнение тарифов" style={{ marginTop: 16 }}>
          <Table rowKey="feature" dataSource={data?.comparison ?? []} pagination={false} scroll={{ x: 900 }} columns={[{ title: 'Возможность', dataIndex: 'feature', key: 'feature', fixed: 'left' }, { title: 'Базовый', dataIndex: 'basic', key: 'basic' }, { title: 'Профессиональный', dataIndex: 'pro', key: 'pro' }, { title: 'Корпоративный', dataIndex: 'corp', key: 'corp' }]} />
        </Card>
      </Spin>
      <Card title="Частые вопросы"><Collapse items={[{ key: '1', label: 'Что входит в аналитику?', children: 'Цены, обзоры рынка, сигналы по посевам, прогнозы, уведомления и экспорт данных.' }, { key: '2', label: 'Как часто обновляются данные?', children: 'Ценовые данные обновляются по мере поступления источников, обзоры — ежедневно или еженедельно в зависимости от тарифа.' }, { key: '3', label: 'Можно ли выбрать только нужные культуры?', children: 'Да, в подписке можно настроить культуры, классы зерна, регионы и типы уведомлений.' }, { key: '4', label: 'Есть ли выгрузка в Excel?', children: 'Да, выгрузка доступна на профессиональном и корпоративном тарифах.' }, { key: '5', label: 'Можно ли подключить команду?', children: 'Да, командный доступ предусмотрен в профессиональном и корпоративном тарифах.' }]} /></Card>

      <Modal
        title={paymentPlan ? `Оплата тарифа «${paymentPlan.name}»` : 'Оплата тарифа'}
        open={Boolean(paymentPlan)}
        onCancel={closePaymentModal}
        destroyOnClose
        footer={paidPlanName ? [<Button key="close" type="primary" onClick={closePaymentModal}>Закрыть</Button>] : [
          <Button key="cancel" onClick={closePaymentModal}>Отмена</Button>,
          <Button key="pay" type="primary" icon={<CreditCardOutlined />} loading={Boolean(paymentPlan && selecting === paymentPlan.code)} onClick={() => void submitPayment()}>
            Оплатить в демо-режиме
          </Button>,
        ]}
      >
        {paidPlanName ? (
          <Result
            status="success"
            title="Подписка подключена"
            subTitle={`Демо-оплата тарифа «${paidPlanName}» прошла успешно. Доступ активирован в личном кабинете.`}
          />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert type="info" showIcon message="Демо-оплата" description="Это имитация оплаты для прототипа: деньги не списываются, после подтверждения backend активирует подписку." />
            <Typography.Text strong>{paymentPlan?.price}</Typography.Text>
            <Form form={paymentForm} layout="vertical" requiredMark="optional">
              <Form.Item name="payerName" label="Плательщик" rules={[{ required: true, message: 'Укажите плательщика' }]}>
                <Input placeholder="Название компании или ФИО" />
              </Form.Item>
              <Form.Item name="email" label="Email для чека" rules={[{ required: true, message: 'Укажите email' }, { type: 'email', message: 'Введите корректный email' }]}>
                <Input placeholder="billing@example.ru" />
              </Form.Item>
              <Form.Item name="cardNumber" label="Номер карты" rules={[{ required: true, message: 'Укажите номер карты' }, { pattern: /^(\d{4}\s?){4}$/, message: 'Введите 16 цифр карты' }]}>
                <Input inputMode="numeric" maxLength={19} placeholder="4242 4242 4242 4242" onChange={(event) => paymentForm.setFieldValue('cardNumber', cleanCardNumber(event.target.value))} />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="expires" label="Срок действия" rules={[{ required: true, message: 'Укажите срок' }, { pattern: /^(0[1-9]|1[0-2])\/\d{2}$/, message: 'Формат MM/YY' }]}>
                    <Input placeholder="12/29" maxLength={5} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="cvc" label="CVC" rules={[{ required: true, message: 'Укажите CVC' }, { pattern: /^\d{3}$/, message: 'Введите 3 цифры' }]}>
                    <Input.Password inputMode="numeric" maxLength={3} placeholder="123" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title="Корпоративный тариф"
        open={Boolean(contactPlan)}
        onCancel={() => setContactPlan(null)}
        confirmLoading={selecting === contactPlan?.code}
        okText="Отправить заявку"
        cancelText="Закрыть"
        onOk={() => void submitEnterpriseRequest()}
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Alert type="info" showIcon message="Индивидуальные условия" description="Для корпоративного доступа условия, API, SLA и количество пользователей согласуются с менеджером." />
          <Typography.Paragraph>
            Напишите нам на <Typography.Link href="mailto:info@zernoagromir.ru?subject=Корпоративный тариф аналитики"><MailOutlined /> info@zernoagromir.ru</Typography.Link> или отправьте заявку кнопкой ниже — мы зафиксируем запрос в системе.
          </Typography.Paragraph>
          <Typography.Text type="secondary">В заявке будет указан тариф «{contactPlan?.name}» и период оплаты: {period === 'year' ? 'год' : 'месяц'}.</Typography.Text>
        </Space>
      </Modal>
    </Space>
  );
}

export function SubscriptionPage() {
  return <AnalyticsPage />;
}
