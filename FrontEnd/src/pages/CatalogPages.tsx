import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

export function DirectoriesPage() {
  const navigate = useNavigate();
  const cards = [
    { title: 'Регионы', text: 'Карточки регионов с ценами, новостями и логистикой.', path: '/directories/regions' },
    { title: 'Города', text: 'География торговых точек и инфраструктуры.', path: '/directories/cities' },
    { title: 'Организации', text: 'Проверенные участники рынка и специализация.', path: '/organizations' },
    { title: 'Элеваторы', text: 'Мощности хранения и условия приемки.', path: '/directories/elevators' },
    { title: 'Порты', text: 'Терминалы, окна отгрузки, ограничения.', path: '/directories/ports' },
    { title: 'Лаборатории', text: 'Анализ качества и сроки выдачи протоколов.', path: '/directories/labs' },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Справочники</Typography.Title>
        <Typography.Paragraph className="lead-text">Рабочий каталог регионов, организаций, элеваторов, портов и лабораторий.</Typography.Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        {cards.map((item) => (
          <Col key={item.title} xs={24} md={12} xl={8}>
            <Card className="nested-card">
              <Space direction="vertical" size={8}>
                <Typography.Title level={4}>{item.title}</Typography.Title>
                <Typography.Paragraph>{item.text}</Typography.Paragraph>
                <Button type="link" onClick={() => navigate(item.path)}>Открыть</Button>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

export function CountriesPage() {
  const navigate = useNavigate();
  const countries = [
    { title: 'Россия', tag: 'Экспорт / внутренний рынок', path: '/countries/russia' },
    { title: 'Казахстан', tag: 'Транзит и поставки', path: '/countries/kazakhstan' },
    { title: 'Украина', tag: 'Черноморская конкуренция', path: '/countries/ukraine' },
    { title: 'Белоруссия', tag: 'Региональная торговля', path: '/countries/belarus' },
    { title: 'Киргизия', tag: 'Импорт и переработка', path: '/countries/kyrgyzstan' },
    { title: 'Узбекистан', tag: 'Спрос на мукомольное зерно', path: '/countries/uzbekistan' },
    { title: 'Армения', tag: 'Импортные каналы', path: '/countries/armenia' },
    { title: 'Турция', tag: 'Импорт и фрахт', path: '/countries/turkey' },
    { title: 'Египет', tag: 'Госзакупки зерна', path: '/countries/egypt' },
    { title: 'Мировая экономика', tag: 'Макрофакторы', path: '/countries/world-economy' },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Страны</Typography.Title>
        <Typography.Paragraph className="lead-text">Информационный рубрикатор по странам с новостями, ценами, ограничениями и статистикой внешней торговли.</Typography.Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        {countries.map((item) => (
          <Col key={item.title} xs={24} md={12} xl={8}>
            <Card className="nested-card" onClick={() => navigate(item.path)}>
              <Typography.Title level={4}>{item.title}</Typography.Title>
              <Tag>{item.tag}</Tag>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

export function CulturesPage() {
  const navigate = useNavigate();
  const cultures = [
    { title: 'Зерновые', slug: 'grain' },
    { title: 'Пшеница', slug: 'wheat' },
    { title: 'Ячмень', slug: 'barley' },
    { title: 'Кукуруза', slug: 'corn' },
    { title: 'Рожь', slug: 'rye' },
    { title: 'Рис', slug: 'rice' },
    { title: 'Гречиха', slug: 'buckwheat' },
    { title: 'Мука', slug: 'flour' },
    { title: 'Соя', slug: 'soy' },
    { title: 'Удобрения', slug: 'fertilizers' },
  ];

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Культуры</Typography.Title>
        <Typography.Paragraph className="lead-text">Рубрикатор товарных групп: новости, цены, аналитика, лоты и справочные данные по каждой культуре.</Typography.Paragraph>
      </Card>
      <Row gutter={[16, 16]}>
        {cultures.map((item) => (
          <Col key={item.slug} xs={24} md={12} xl={8}>
            <Card className="nested-card" onClick={() => navigate(`/cultures/${item.slug}`)}>
              <Typography.Title level={4}>{item.title}</Typography.Title>
              <Typography.Text type="secondary">Открыть карточку культуры</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </Space>
  );
}

