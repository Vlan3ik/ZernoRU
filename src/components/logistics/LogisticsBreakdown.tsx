import { Card, Descriptions, Progress, Space, Tag, Typography } from 'antd';
import { DeliveryMode } from '../../types/domain';

interface LogisticsBreakdownProps {
  distanceKm: number;
  volume: number;
  mode: DeliveryMode;
  total: number;
}

const modeLabels: Record<DeliveryMode, string> = {
  pickup: 'Самовывоз',
  seller_delivery: 'Доставка продавцом',
  partner_delivery: 'Партнерская доставка',
};

const modeRates: Record<Exclude<DeliveryMode, 'pickup'>, number> = {
  seller_delivery: 54,
  partner_delivery: 68,
};

export function LogisticsBreakdown({ distanceKm, volume, mode, total }: LogisticsBreakdownProps) {
  const distanceCost = mode === 'pickup' ? 0 : Math.round(distanceKm * modeRates[mode]);
  const handlingCost = mode === 'pickup' ? 0 : Math.round(volume * 120);
  const coverage = Math.min(100, Math.round((volume / Math.max(1, distanceKm / 20)) * 100));

  return (
    <Card title="Структура тарифа" className="logistics-breakdown-card">
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Tag color={mode === 'pickup' ? 'green' : 'blue'}>{modeLabels[mode]}</Tag>
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="Маршрутная часть">{distanceCost.toLocaleString('ru-RU')} ?</Descriptions.Item>
          <Descriptions.Item label="Погрузка и обработка">{handlingCost.toLocaleString('ru-RU')} ?</Descriptions.Item>
          <Descriptions.Item label="Итоговый тариф">
            <Typography.Text strong>{total.toLocaleString('ru-RU')} ?</Typography.Text>
          </Descriptions.Item>
        </Descriptions>
        <div>
          <Typography.Text type="secondary">Индекс загрузки транспорта</Typography.Text>
          <Progress percent={coverage} size="small" showInfo />
        </div>
      </Space>
    </Card>
  );
}

