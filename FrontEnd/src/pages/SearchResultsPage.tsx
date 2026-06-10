import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Segmented, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { globalSearchTabs } from '../data/portalContent';
import { useAppStore } from '../store/appStore';

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const currentQuery = params.get('q') ?? '';
  const [query, setQuery] = useState(currentQuery);
  const [tab, setTab] = useState(globalSearchTabs[0]);

  const grainLots = useAppStore((state) => state.grainLots);
  const posts = useAppStore((state) => state.posts);
  const news = useAppStore((state) => state.news);
  const prices = useAppStore((state) => state.prices);

  const results = useMemo(() => {
    const q = (currentQuery || '').toLowerCase();
    return {
      Новости: news.filter((item) => `${item.title} ${item.lead}`.toLowerCase().includes(q)).map((item) => ({ id: item.id, title: item.title, subtitle: item.section, path: `/news/${item.id}` })),
      Цены: prices.filter((item) => item.culture.toLowerCase().includes(q) || item.region.toLowerCase().includes(q)).map((item) => ({ id: item.id, title: item.culture, subtitle: `${item.day.toLocaleString('ru-RU')} ₽/т`, path: `/prices/${item.culture.toLowerCase().includes('пшеница 3') ? 'pw-3' : item.culture.toLowerCase().includes('пшеница 4') ? 'pw-4' : item.culture.toLowerCase().includes('пшеница 5') ? 'pw-5' : item.culture.toLowerCase().includes('ячмень') ? 'barley' : item.culture.toLowerCase().includes('кукуруза') ? 'corn' : 'regions'}` })),
      Лоты: grainLots.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(q)).map((item) => ({ id: item.id, title: item.title, subtitle: `${item.pricePerTon.toLocaleString('ru-RU')} ₽/т`, path: `/marketplace/lot/${item.id}` })),
      Организации: [{ id: 'org-1', title: 'Каталог организаций зернового рынка', subtitle: 'Проверенные продавцы и сервисные компании', path: '/organizations' }],
      'Темы форума': posts.filter((item) => `${item.title} ${item.content}`.toLowerCase().includes(q)).map((item) => ({ id: item.id, title: item.title, subtitle: item.section, path: `/forum/topic/${item.id}` })),
      Аналитика: [{ id: 'an-1', title: 'Обзор баланса спроса и предложения', subtitle: 'Аналитика и прогнозы', path: '/analytics' }],
      Справочники: [{ id: 'dir-1', title: 'Справочники регионов, портов и элеваторов', subtitle: 'Рабочий каталог', path: '/directories' }],
    };
  }, [currentQuery, grainLots, news, posts, prices]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Результаты поиска</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Поиск по разделам: новости, цены, лоты, организации, темы форума, аналитика и справочники.
        </Typography.Paragraph>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onPressEnter={() => setParams({ q: query })}
          prefix={<SearchOutlined />}
          placeholder="Введите запрос"
        />
      </Card>

      <Card>
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Segmented value={tab} onChange={(value) => setTab(value as string)} options={globalSearchTabs} block />
          <Space wrap>
            <Tag>Быстрые фильтры</Tag>
            <Tag>Регион: ЦФО</Tag>
            <Tag>Культура: Пшеница</Tag>
            <Tag>Дата: за неделю</Tag>
          </Space>
        </Space>
      </Card>

      <Card title={`Раздел: ${tab}`}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {(results[tab as keyof typeof results] ?? []).map((item) => (
            <Card key={`${tab}-${item.id}`} className="nested-card">
              <Space direction="vertical" size={4}>
                <Typography.Text strong>{item.title}</Typography.Text>
                <Typography.Text type="secondary">{item.subtitle}</Typography.Text>
                <Button type="link" onClick={() => navigate(item.path)}>Открыть</Button>
              </Space>
            </Card>
          ))}
          {!(results[tab as keyof typeof results] ?? []).length && <Typography.Text type="secondary">По вашему запросу ничего не найдено.</Typography.Text>}
        </Space>
      </Card>
    </Space>
  );
}
