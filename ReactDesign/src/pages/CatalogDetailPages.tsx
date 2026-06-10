import { Button, Card, Col, Descriptions, Empty, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsImageMap } from '../data/mediaAssets';
import { newsFeed, priceRows } from '../data/portalContent';
import { directoryData } from '../data/directoriesData';

export function CountryDetailPage() {
  const { slug = 'russia' } = useParams();
  const navigate = useNavigate();
  const nameMap: Record<string, string> = {
    russia: 'Россия',
    kazakhstan: 'Казахстан',
    ukraine: 'Украина',
    belarus: 'Белоруссия',
    kyrgyzstan: 'Киргизия',
    uzbekistan: 'Узбекистан',
    armenia: 'Армения',
    turkey: 'Турция',
    egypt: 'Египет',
    'world-economy': 'Мировая экономика',
  };
  const country = nameMap[slug] ?? slug;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Страна: {country}</Typography.Title>
        <Typography.Paragraph className="lead-text">Обзор рынка, ограничения торговли, экспортно-импортная динамика и ключевые культуры.</Typography.Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Рыночная сводка">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Экспорт за месяц">1,28 млн т</Descriptions.Item>
              <Descriptions.Item label="Импорт за месяц">0,42 млн т</Descriptions.Item>
              <Descriptions.Item label="Ключевые культуры">Пшеница, ячмень, кукуруза</Descriptions.Item>
              <Descriptions.Item label="Логистический статус">Умеренная загрузка</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Новости страны" style={{ marginTop: 16 }}>
            {newsFeed.slice(0, 3).map((item) => (
              <Card key={item.id} className="nested-card clickable-card" style={{ marginBottom: 8 }} onClick={() => navigate(`/news/${item.id}`)} role="button" tabIndex={0}>
                <Row gutter={[12, 12]} align="middle">
                  <Col xs={24} md={8}>
                    <img src={item.imageUrl ?? newsImageMap[item.id]} alt={item.title} className="news-image-thumb" />
                  </Col>
                  <Col xs={24} md={16}>
                    <Typography.Text strong>{item.title}</Typography.Text>
                  </Col>
                </Row>
              </Card>
            ))}
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Пошлины и ограничения">
            <Space direction="vertical" size={8}>
              <Tag>Пшеница: 3 480 ₽/т</Tag>
              <Tag>Ячмень: 1 930 ₽/т</Tag>
              <Tag>Кукуруза: 2 740 ₽/т</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function CultureDetailPage() {
  const { slug = 'wheat' } = useParams();
  const navigate = useNavigate();
  const titleMap: Record<string, string> = {
    grain: 'Зерновые',
    wheat: 'Пшеница',
    barley: 'Ячмень',
    corn: 'Кукуруза',
    rye: 'Рожь',
    rice: 'Рис',
    buckwheat: 'Гречиха',
    flour: 'Мука',
    soy: 'Соя',
    fertilizers: 'Удобрения',
  };
  const culture = titleMap[slug] ?? slug;

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card"><Typography.Title level={1}>Культура: {culture}</Typography.Title></Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Цена и география">
            <Table rowKey="key" pagination={false} dataSource={priceRows} columns={[{ title: 'Регион', dataIndex: 'region', key: 'region' }, { title: 'Цена', dataIndex: 'day', key: 'day', render: (v: number) => `${v.toLocaleString('ru-RU')} ₽/т` }, { title: 'Порт', dataIndex: 'port', key: 'port' }]} />
          </Card>
          <Card title="Новости и аналитика" style={{ marginTop: 16 }}>
            {newsFeed.slice(0, 2).map((item) => (
              <Card key={item.id} className="nested-card clickable-card" style={{ marginBottom: 8 }} onClick={() => navigate(`/news/${item.id}`)} role="button" tabIndex={0}>
                <Row gutter={[12, 12]} align="middle">
                  <Col xs={24} md={8}>
                    <img src={item.imageUrl ?? newsImageMap[item.id]} alt={item.title} className="news-image-thumb" />
                  </Col>
                  <Col xs={24} md={16}>
                    <Typography.Text strong>{item.title}</Typography.Text>
                  </Col>
                </Row>
              </Card>
            ))}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Связанные лоты">
            <Space direction="vertical" size={8}>
              <Typography.Link href="/marketplace?tab=grain">Перейти в торговую площадку</Typography.Link>
              <Typography.Link href="/logistics">Открыть логистику</Typography.Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function DirectoryEntityPage() {
  const { entity = 'regions' } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string | undefined>();

  const items = directoryData[entity] ?? [];
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const text = `${item.name} ${item.short} ${item.type}`.toLowerCase();
        if (search && !text.includes(search.toLowerCase())) return false;
        if (region && item.region !== region) return false;
        return true;
      }),
    [items, region, search],
  );

  const titleMap: Record<string, string> = {
    regions: 'Регионы',
    cities: 'Города',
    organizations: 'Организации',
    elevators: 'Элеваторы',
    ports: 'Порты',
    labs: 'Лаборатории',
    'org-types': 'Типы организаций',
    people: 'Люди',
  };
  const title = titleMap[entity] ?? 'Справочник';

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Справочник: {title}</Typography.Title>
        <Typography.Paragraph className="lead-text">Поиск, фильтры и карточки сущностей с контактами, статусами и связанными материалами.</Typography.Paragraph>
      </Card>

      <Card title="Фильтры каталога">
        <Row gutter={12}>
          <Col xs={24} md={10}><Input placeholder="Поиск по названию и описанию" value={search} onChange={(e) => setSearch(e.target.value)} /></Col>
          <Col xs={24} md={8}><Select allowClear placeholder="Регион" value={region} onChange={setRegion} style={{ width: '100%' }} options={[...new Set(items.map((item) => item.region))].map((value) => ({ value, label: value }))} /></Col>
          <Col xs={24} md={6}><Button block onClick={() => { setSearch(''); setRegion(undefined); }}>Сбросить</Button></Col>
        </Row>
      </Card>

      <Card title={`Каталог (${filtered.length})`}>
        {filtered.length ? (
          <Table
            rowKey="id"
            dataSource={filtered}
            columns={[
              { title: 'Наименование', dataIndex: 'name', key: 'name' },
              { title: 'Тип', dataIndex: 'type', key: 'type' },
              { title: 'Регион', dataIndex: 'region', key: 'region' },
              { title: 'Статус', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'Проверено' ? 'green' : v === 'На проверке' ? 'gold' : 'default'}>{v}</Tag> },
              {
                title: 'Действие',
                key: 'action',
                render: (_, item) => (
                  <Button type="link" onClick={() => navigate(entity === 'organizations' ? `/organizations/${item.id}` : `/directories/${entity}/${item.id}`)}>
                    Открыть карточку
                  </Button>
                ),
              },
            ]}
          />
        ) : (
          <Empty description="По фильтрам ничего не найдено" />
        )}
      </Card>
    </Space>
  );
}

export function DirectoryItemPage() {
  const { entity = 'regions', itemId = '' } = useParams();
  const navigate = useNavigate();
  const item = (directoryData[entity] ?? []).find((entry) => entry.id === itemId);

  if (!item) {
    return (
      <Card>
        <Empty description="Карточка не найдена">
          <Button type="primary" onClick={() => navigate(`/directories/${entity}`)}>Вернуться к списку</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>{item.name}</Typography.Title>
        <Typography.Paragraph className="lead-text">{item.short}</Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={15}>
          <Card title="Профиль сущности">
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Тип">{item.type}</Descriptions.Item>
              <Descriptions.Item label="Регион">{item.region}</Descriptions.Item>
              <Descriptions.Item label="Контакты">{item.contacts}</Descriptions.Item>
              <Descriptions.Item label="Статус">{item.status}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Ключевые показатели" style={{ marginTop: 16 }}>
            <Space direction="vertical">{item.stats.map((line) => <Typography.Text key={line}>{line}</Typography.Text>)}</Space>
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="Связанные материалы">
            <Space direction="vertical">
              <Typography.Link href="/news">Новости по теме</Typography.Link>
              <Typography.Link href="/prices">Цены по региону</Typography.Link>
              <Typography.Link href="/marketplace">Активные лоты</Typography.Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function OrganizationProfilePage() {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const org = (directoryData.organizations ?? []).find((entry) => entry.id === orgId);

  if (!org) {
    return (
      <Card>
        <Empty description="Организация не найдена">
          <Button type="primary" onClick={() => navigate('/organizations')}>Вернуться в каталог</Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>{org.name}</Typography.Title>
        <Space>
          <Tag color="green">Проверено</Tag>
          <Tag>{org.type}</Tag>
        </Space>
      </Card>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Карточка организации">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Специализация">{org.type}</Descriptions.Item>
              <Descriptions.Item label="Регион работы">{org.region}</Descriptions.Item>
              <Descriptions.Item label="Контакты">{org.contacts}</Descriptions.Item>
              <Descriptions.Item label="Рейтинг">4,8 / 5</Descriptions.Item>
              <Descriptions.Item label="Реквизиты">ИНН и ОГРН подтверждены</Descriptions.Item>
              <Descriptions.Item label="Активные лоты">12</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Лоты, новости и форум" style={{ marginTop: 16 }}>
            <Space direction="vertical">
              <Typography.Link href="/marketplace?tab=grain">Лоты организации</Typography.Link>
              <Typography.Link href="/news">Новости и комментарии</Typography.Link>
              <Typography.Link href="/forum">Темы на форуме</Typography.Link>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Отзывы и активность">
            <Space direction="vertical">
              <Typography.Text>Отзывы: 28</Typography.Text>
              <Typography.Text>Сделок за квартал: 34</Typography.Text>
              <Typography.Text>Ответов в сообщениях: 97%</Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
