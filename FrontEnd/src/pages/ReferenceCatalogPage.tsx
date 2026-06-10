import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

interface Props {
  category: string;
  title: string;
  description: string;
}

export function ReferenceCatalogPage({ category, title, description }: Props) {
  const navigate = useNavigate();
  const { slug } = useParams();
  const items = useAppStore((state) => state.referenceCatalogs[category] ?? []);

  const selected = useMemo(() => items.find((item) => item.slug === slug) ?? items[0], [items, slug]);

  if (!items.length) {
    return (
      <Card>
        <Empty description={`Раздел "${title}" пока пуст`}>
          <Button type="primary" onClick={() => navigate('/')}>Вернуться на главную</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Paragraph className="lead-text">{description}</Typography.Paragraph>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={10}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {items.map((item) => (
              <Card
                key={item.id}
                className={item.slug === selected?.slug ? 'nested-card nested-card--active' : 'nested-card'}
                onClick={() => navigate(`/${category}/${item.slug}`)}
              >
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Space wrap>
                    <Tag color={item.slug === selected?.slug ? 'green' : 'default'}>{item.region}</Tag>
                    <Tag>{item.status}</Tag>
                  </Space>
                  <Typography.Title level={4}>{item.title}</Typography.Title>
                  <Typography.Paragraph>{item.summary}</Typography.Paragraph>
                </Space>
              </Card>
            ))}
          </Space>
        </Col>

        <Col xs={24} xl={14}>
          {selected ? (
            <Card>
              <Typography.Link onClick={() => navigate(`/${category}`)}>{title}</Typography.Link>
              <Typography.Title level={2}>{selected.title}</Typography.Title>
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color="green">{selected.region}</Tag>
                <Tag>{selected.status}</Tag>
                <Tag>{selected.slug}</Tag>
              </Space>
              <Typography.Paragraph>{selected.summary}</Typography.Paragraph>
              <Typography.Paragraph>{selected.details}</Typography.Paragraph>

              <Typography.Title level={4} style={{ marginTop: 16 }}>Ключевые характеристики</Typography.Title>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {selected.highlights.map((item) => (
                  <Card key={item} size="small" className="nested-card">
                    <Typography.Text>{item}</Typography.Text>
                  </Card>
                ))}
              </Space>

              <Typography.Title level={4} style={{ marginTop: 16 }}>Контакты</Typography.Title>
              <Typography.Paragraph>{selected.contacts}</Typography.Paragraph>
            </Card>
          ) : (
            <Empty description="Запись не найдена" />
          )}
        </Col>
      </Row>
    </Space>
  );
}
