import { Card, Space, Steps, Tag, Typography } from 'antd';

interface LogisticsEtaCardProps {
  etaDays: number;
  distanceKm: number;
  modeLabel: string;
}

export function LogisticsEtaCard({ etaDays, distanceKm, modeLabel }: LogisticsEtaCardProps) {
  const loadingHours = Math.max(2, Math.round(distanceKm / 220));
  const transitHours = Math.max(8, Math.round(distanceKm / 65));
  const unloadHours = 4;
  const totalHours = loadingHours + transitHours + unloadHours;

  return (
    <Card title="Сроки и этапы доставки" className="logistics-eta-card">
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space>
          <Tag color="geekblue">ETA: {etaDays} дн.</Tag>
          <Typography.Text type="secondary">{modeLabel}</Typography.Text>
        </Space>
        <Steps
          direction="vertical"
          size="small"
          current={2}
          items={[
            { title: 'Подтверждение заявки', description: `${loadingHours} ч` },
            { title: 'Транзит', description: `${transitHours} ч` },
            { title: 'Разгрузка и закрытие документов', description: `${unloadHours} ч` },
          ]}
        />
        <Typography.Text type="secondary">
          Ориентир по времени в пути: около {totalHours} часов с учетом оформления.
        </Typography.Text>
      </Space>
    </Card>
  );
}

