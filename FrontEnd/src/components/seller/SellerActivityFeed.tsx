import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Empty, Space, Tag, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';
import { SellerActivityItem } from '../../services/sellerService';

interface SellerActivityFeedProps {
  items: SellerActivityItem[];
  limit?: number;
}

function iconByStatus(status: SellerActivityItem['status']) {
  if (status === 'success') return <CheckCircleOutlined style={{ color: '#2b8a3e' }} />;
  if (status === 'warning') return <ExclamationCircleOutlined style={{ color: '#d48806' }} />;
  return <ClockCircleOutlined style={{ color: '#1d6fd8' }} />;
}

function labelByStatus(status: SellerActivityItem['status']) {
  if (status === 'success') return { color: 'green', text: 'Выполнено' };
  if (status === 'warning') return { color: 'gold', text: 'Требует внимания' };
  return { color: 'blue', text: 'Инфо' };
}

export function SellerActivityFeed({ items, limit = 10 }: SellerActivityFeedProps) {
  const visibleItems = items.slice(0, limit);

  if (visibleItems.length === 0) {
    return <Empty description="История действий пока пуста" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  return (
    <Timeline
      items={visibleItems.map((item) => {
        const status = labelByStatus(item.status);

        return {
          dot: iconByStatus(item.status),
          children: (
            <Space direction="vertical" size={2}>
              <Space align="center">
                <Typography.Text strong>{item.title}</Typography.Text>
                <Tag color={status.color}>{status.text}</Tag>
              </Space>
              <Typography.Text type="secondary">{item.description}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(item.createdAt).format('DD.MM.YYYY HH:mm')}
              </Typography.Text>
            </Space>
          ),
        };
      })}
    />
  );
}


