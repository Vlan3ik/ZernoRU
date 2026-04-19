import { Alert, Card, Descriptions, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { SellerApplication, VerificationStatus } from '../../types/domain';

interface SellerVerificationStatusCardProps {
  status: VerificationStatus;
  latestApplication: SellerApplication | null;
}

function resolveStatusMeta(status: VerificationStatus): {
  badgeColor: string;
  badgeText: string;
  alertType: 'success' | 'info' | 'warning' | 'error';
  message: string;
} {
  if (status === 'approved') {
    return {
      badgeColor: 'green',
      badgeText: 'Верифицирован',
      alertType: 'success',
      message: 'Кабинет продавца активен. Можно размещать лоты и получать заявки.',
    };
  }

  if (status === 'rejected') {
    return {
      badgeColor: 'red',
      badgeText: 'Отклонено',
      alertType: 'error',
      message: 'Заявка отклонена. Проверьте документы и отправьте новую заявку.',
    };
  }

  return {
    badgeColor: 'gold',
    badgeText: 'На проверке',
    alertType: 'warning',
    message: 'Модерация занимает до 1 рабочего дня. Статус обновится автоматически.',
  };
}

export function SellerVerificationStatusCard({ status, latestApplication }: SellerVerificationStatusCardProps) {
  const meta = resolveStatusMeta(status);

  return (
    <Card>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Статус верификации продавца
          </Typography.Title>
          <Tag color={meta.badgeColor}>{meta.badgeText}</Tag>
        </Space>

        <Alert type={meta.alertType} showIcon message={meta.message} />

        {latestApplication ? (
          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label="Компания">{latestApplication.companyName}</Descriptions.Item>
            <Descriptions.Item label="ИНН">{latestApplication.inn}</Descriptions.Item>
            <Descriptions.Item label="ОГРН">{latestApplication.ogrn}</Descriptions.Item>
            <Descriptions.Item label="Отправлена">
              {dayjs(latestApplication.submittedAt).format('DD.MM.YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">
            Заявка еще не отправлялась.
          </Typography.Text>
        )}
      </Space>
    </Card>
  );
}


