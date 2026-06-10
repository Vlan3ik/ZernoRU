import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { AnalyticsPoint } from '../../types/domain';

interface SubscriptionKpiGridProps {
  analytics: AnalyticsPoint[];
}

interface KpiItem {
  title: string;
  value: number;
  suffix?: string;
  precision?: number;
  trend: number;
  trendLabel: string;
  color: string;
  progress?: number;
}

function trendMeta(value: number): { color: string; label: string } {
  if (value > 0) {
    return { color: 'green', label: `+${value.toFixed(1)}%` };
  }

  if (value < 0) {
    return { color: 'red', label: `${value.toFixed(1)}%` };
  }

  return { color: 'default', label: '0.0%' };
}

export function SubscriptionKpiGrid({ analytics }: SubscriptionKpiGridProps) {
  const latest = analytics.at(-1);
  const previous = analytics.at(-2);

  if (!latest || !previous) {
    return null;
  }

  const ndviDelta = ((latest.ndvi - previous.ndvi) / previous.ndvi) * 100;
  const ssiDelta = ((latest.ssi - previous.ssi) / previous.ssi) * 100;
  const priceDelta = ((latest.priceForecast - previous.priceForecast) / previous.priceForecast) * 100;
  const balanceNow = latest.demand - latest.supply;
  const balancePrev = previous.demand - previous.supply;
  const balanceDelta = balancePrev === 0 ? 0 : ((balanceNow - balancePrev) / Math.abs(balancePrev)) * 100;

  const ndviTrend = trendMeta(ndviDelta);
  const ssiTrend = trendMeta(ssiDelta);
  const priceTrend = trendMeta(priceDelta);
  const balanceTrend = trendMeta(balanceDelta);

  const kpis: KpiItem[] = [
    {
      title: 'NDVI индекс',
      value: latest.ndvi,
      precision: 2,
      trend: ndviDelta,
      trendLabel: ndviTrend.label,
      color: ndviTrend.color,
      progress: Math.min(100, Math.round(latest.ndvi * 100)),
    },
    {
      title: 'SSI индекс стресса',
      value: latest.ssi,
      precision: 2,
      trend: ssiDelta,
      trendLabel: ssiTrend.label,
      color: ssiTrend.color,
      progress: Math.min(100, Math.round(latest.ssi * 100)),
    },
    {
      title: 'Прогноз цены',
      value: latest.priceForecast,
      suffix: '₽/т',
      precision: 0,
      trend: priceDelta,
      trendLabel: priceTrend.label,
      color: priceTrend.color,
    },
    {
      title: 'Баланс спроса',
      value: balanceNow,
      suffix: 'т',
      precision: 0,
      trend: balanceDelta,
      trendLabel: balanceTrend.label,
      color: balanceTrend.color,
    },
  ];

  return (
    <Row gutter={[14, 14]}>
      {kpis.map((item) => (
        <Col xs={24} md={12} xl={6} key={item.title}>
          <Card className="subscription-kpi-card">
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Typography.Text type="secondary">{item.title}</Typography.Text>
              <Statistic value={item.value} precision={item.precision} suffix={item.suffix} />
              <Tag color={item.color}>{item.trendLabel} к предыдущему периоду</Tag>
              {typeof item.progress === 'number' ? (
                <Progress
                  percent={item.progress}
                  size="small"
                  showInfo={false}
                  strokeColor={item.title.includes('SSI') ? '#d46b08' : '#2f6f3e'}
                />
              ) : null}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
