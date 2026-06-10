import { Button, Card, Empty, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

export function PlaceholderPage({ title, description, actionLabel, actionPath }: Props) {
  const navigate = useNavigate();

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card>
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Paragraph className="lead-text">{description}</Typography.Paragraph>
      </Card>
      <Card>
        <Empty
          description="Данные появятся после заполнения раздела"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          {actionLabel && actionPath && (
            <Button type="primary" onClick={() => navigate(actionPath)}>
              {actionLabel}
            </Button>
          )}
        </Empty>
      </Card>
    </Space>
  );
}

