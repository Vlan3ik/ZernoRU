import { Alert, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { portalApi } from '../services/portalApi';

export function AdminPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    portalApi.getAdminStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Не удалось загрузить статистику');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Админ-панель</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Сводка по пользователям, лотам, заказам, уведомлениям и заявкам.
        </Typography.Paragraph>
      </Card>

      {error && <Alert type="error" showIcon message="Нет доступа или ошибка" description={error} />}

      <Row gutter={[16, 16]}>
        {stats ? Object.entries(stats).map(([key, value]) => (
          <Col xs={24} md={12} xl={8} key={key}>
            <Card>
              <Statistic title={key} value={value} />
            </Card>
          </Col>
        )) : !error && (
          <Col span={24}>
            <Card loading />
          </Col>
        )}
      </Row>
    </Space>
  );
}
