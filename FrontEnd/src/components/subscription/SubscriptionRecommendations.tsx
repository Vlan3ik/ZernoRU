import { Card, List, Space, Tag, Typography } from 'antd';
import { AnalyticsPoint } from '../../types/domain';

interface SubscriptionRecommendationsProps {
  analytics: AnalyticsPoint[];
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  severity: 'success' | 'warning' | 'processing';
}

export function SubscriptionRecommendations({ analytics }: SubscriptionRecommendationsProps) {
  const latest = analytics.at(-1);

  if (!latest) {
    return null;
  }

  const recommendations: Recommendation[] = [];

  if (latest.ndvi < 0.55) {
    recommendations.push({
      id: 'ndvi',
      title: 'Снижение NDVI на полях',
      description: 'Проверьте густоту всходов и пересмотрите схему внесения азотных удобрений на ближайшие 10 дней.',
      severity: 'warning',
    });
  } else {
    recommendations.push({
      id: 'ndvi-ok',
      title: 'Состояние вегетации стабильное',
      description: 'NDVI в норме. Поддерживайте текущий режим питания и мониторинг 2 раза в неделю.',
      severity: 'success',
    });
  }

  if (latest.ssi > 0.42) {
    recommendations.push({
      id: 'ssi-high',
      title: 'Высокий риск агростресса',
      description: 'Подготовьте профилактику болезней и уточните план орошения для участков со стрессом выше 0.42.',
      severity: 'warning',
    });
  }

  if (latest.demand > latest.supply) {
    recommendations.push({
      id: 'market',
      title: 'Рынок в дефиците предложения',
      description: 'Оптимальный момент для публикации лотов пшеницы: можно удерживать цену ближе к верхней границе прогноза.',
      severity: 'processing',
    });
  } else {
    recommendations.push({
      id: 'market-balanced',
      title: 'Предложение превышает спрос',
      description: 'Рекомендуется выставлять гибкие условия: скидка за объем или ускоренная отгрузка.',
      severity: 'processing',
    });
  }

  return (
    <Card title="Рекомендации AI-аналитики" className="subscription-recommendations-card">
      <List
        dataSource={recommendations}
        renderItem={(item) => (
          <List.Item>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space>
                <Typography.Text strong>{item.title}</Typography.Text>
                <Tag color={item.severity}>{item.severity === 'success' ? 'Норма' : item.severity === 'warning' ? 'Риск' : 'Рынок'}</Tag>
              </Space>
              <Typography.Text type="secondary">{item.description}</Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
}

