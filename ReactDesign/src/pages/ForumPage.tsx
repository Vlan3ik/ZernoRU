import {
  CheckCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  PlusOutlined,
  PushpinOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { forumSections } from '../data/portalContent';
import { useAppStore } from '../store/appStore';

const sectionMap: Record<string, string> = {
  agronomy: 'Агрономия',
  trade: 'Торговля',
  tech: 'Техника',
  logistics: 'Логистика',
  'docs-law': 'Документы и право',
  export: 'Экспорт',
  storage: 'Хранение и переработка',
  market: 'Цены и рынок',
};

export function ForumPage() {
  const navigate = useNavigate();
  const posts = useAppStore((state) => state.posts);
  const replies = useAppStore((state) => state.replies);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('fresh');

  const stats = useMemo(
    () =>
      forumSections.map((section) => {
        const sectionPosts = posts.filter((post) => post.section === section || section === 'Цены и рынок');
        return {
          section,
          topics: sectionPosts.length,
          replies: replies.filter((reply) => sectionPosts.some((post) => post.id === reply.postId)).length,
          lastUpdate: sectionPosts[0]?.createdAt ?? new Date().toISOString(),
        };
      }),
    [posts, replies],
  );

  const filteredPosts = useMemo(() => {
    const list = posts.filter((post) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return `${post.title} ${post.tags.join(' ')} ${post.content}`.toLowerCase().includes(query);
    });

    if (sort === 'discussed') {
      return [...list].sort(
        (a, b) => replies.filter((reply) => reply.postId === b.id).length - replies.filter((reply) => reply.postId === a.id).length,
      );
    }

    if (sort === 'no-answer') {
      return list.filter((post) => !post.verifiedAnswer);
    }

    if (sort === 'expert') {
      return list.filter((post) => Boolean(post.verifiedAnswer));
    }

    return [...list].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [posts, replies, search, sort]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Форум отрасли</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Разделы, активные темы, поиск по тегам, сортировки и сценарий создания темы на отдельной странице.
        </Typography.Paragraph>
      </Card>

      <Card title="Поиск и сортировка" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/forum/new')}>Создать тему</Button>}>
        <Row gutter={[12, 12]}>
          <Col xs={24} xl={14}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Поиск по темам, тегам, региону и культуре"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Col>
          <Col xs={24} xl={10}>
            <Select
              value={sort}
              onChange={setSort}
              style={{ width: '100%' }}
              options={[
                { value: 'fresh', label: 'Свежие' },
                { value: 'discussed', label: 'Обсуждаемые' },
                { value: 'no-answer', label: 'Без ответа' },
                { value: 'expert', label: 'С ответом эксперта' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={10}>
          <Card title="Разделы форума">
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {stats.map((item) => (
                <Card
                  key={item.section}
                  className="nested-card"
                  onClick={() => navigate(`/forum/section/${Object.entries(sectionMap).find(([, name]) => name === item.section)?.[0] ?? 'trade'}`)}
                >
                  <Row justify="space-between">
                    <Col>
                      <Typography.Text strong>{item.section}</Typography.Text>
                      <Typography.Paragraph type="secondary">Тем: {item.topics} · Ответов: {item.replies}</Typography.Paragraph>
                    </Col>
                    <Col>
                      <Typography.Text type="secondary">{dayjs(item.lastUpdate).format('DD.MM HH:mm')}</Typography.Text>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card title="Активные темы">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {filteredPosts.map((post) => {
                const replyCount = replies.filter((reply) => reply.postId === post.id).length;
                return (
                  <Card key={post.id} className="nested-card" onClick={() => navigate(`/forum/topic/${post.id}`)}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space wrap>
                        <Tag>{post.section}</Tag>
                        {post.verifiedAnswer ? (
                          <Tag color="green">Есть проверенный ответ</Tag>
                        ) : (
                          <Tag color="orange">Требуется ответ эксперта</Tag>
                        )}
                      </Space>
                      <Typography.Title level={4}>{post.title}</Typography.Title>
                      <Typography.Text type="secondary">{post.tags.join(' ')}</Typography.Text>
                      <Row justify="space-between">
                        <Col>
                          <Space size={16}>
                            <span><MessageOutlined /> {replyCount}</span>
                            <span><EyeOutlined /> {120 + replyCount * 4}</span>
                          </Space>
                        </Col>
                        <Col>
                          <Typography.Text type="secondary">{dayjs(post.createdAt).format('DD.MM.YYYY HH:mm')}</Typography.Text>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function ForumSectionPage() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const posts = useAppStore((state) => state.posts);
  const sectionName = sectionMap[sectionId ?? 'trade'] ?? 'Торговля';

  const sectionPosts = posts.filter((post) => post.section === sectionName);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Typography.Link onClick={() => navigate('/forum')}>Форум</Typography.Link> },
          { title: sectionName },
        ]}
      />
      <Card title={`Раздел: ${sectionName}`} extra={<Button type="primary" onClick={() => navigate('/forum/new')}>Создать тему</Button>}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {sectionPosts.map((post) => (
            <Card key={post.id} className="nested-card" onClick={() => navigate(`/forum/topic/${post.id}`)}>
              <Typography.Text strong>{post.title}</Typography.Text>
              <Typography.Paragraph type="secondary">{post.content}</Typography.Paragraph>
            </Card>
          ))}
          {!sectionPosts.length && <Typography.Text type="secondary">В этом разделе пока нет тем.</Typography.Text>}
        </Space>
      </Card>
    </Space>
  );
}

export function ForumTopicPage() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const posts = useAppStore((state) => state.posts);
  const replies = useAppStore((state) => state.replies);
  const addReply = useAppStore((state) => state.addReply);

  const topic = posts.find((item) => item.id === topicId) ?? posts[0];
  const topicReplies = replies.filter((item) => item.postId === topic.id);

  const [form] = Form.useForm<{ content: string }>();

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Typography.Link onClick={() => navigate('/forum')}>Форум</Typography.Link> },
          { title: <Typography.Link onClick={() => navigate(`/forum/section/${Object.entries(sectionMap).find(([, value]) => value === topic.section)?.[0] ?? 'trade'}`)}>{topic.section}</Typography.Link> },
          { title: topic.title },
        ]}
      />

      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap>
            <Tag>{topic.section}</Tag>
            <Tag>{topic.tags.join(' ')}</Tag>
            <Tag icon={<EyeOutlined />}>{143 + topicReplies.length * 5} просмотров</Tag>
            <Badge count={topicReplies.length} showZero color="#2f6f3e" />
          </Space>
          <Typography.Title level={2}>{topic.title}</Typography.Title>
          <Typography.Text type="secondary">Автор: {topic.authorName} · {dayjs(topic.createdAt).format('DD.MM.YYYY HH:mm')}</Typography.Text>
          <Typography.Paragraph>{topic.content}</Typography.Paragraph>
          {topic.verifiedAnswer ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>Есть проверенный ответ</Tag>
          ) : (
            <Tag color="orange">Требуется ответ эксперта</Tag>
          )}
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Card title="Лента сообщений">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {topicReplies.map((reply, index) => (
                <Card key={reply.id} className="nested-card">
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    <Space wrap>
                      <Typography.Text strong>{reply.authorName}</Typography.Text>
                      <Tag>{index === 0 ? 'Эксперт' : 'Проверенный участник'}</Tag>
                      {index === 0 && <Tag color="green">Лучший ответ</Tag>}
                    </Space>
                    <Typography.Paragraph>{reply.content}</Typography.Paragraph>
                    <Typography.Text type="secondary">{dayjs(reply.createdAt).format('DD.MM.YYYY HH:mm')}</Typography.Text>
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>

          <Card title="Ответить в теме" style={{ marginTop: 16 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => {
                addReply({
                  postId: topic.id,
                  authorName: 'Пользователь портала',
                  rating: 4.7,
                  content: values.content,
                });
                form.resetFields();
              }}
            >
              <Form.Item label="Ваш ответ" name="content" rules={[{ required: true, message: 'Введите текст ответа' }]}>
                <Input.TextArea rows={5} placeholder="Добавьте ответ, можно приложить файл, фото или ссылку" />
              </Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">Опубликовать ответ</Button>
                <Button>Прикрепить файл</Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="По теме">
            <Space direction="vertical" size={8}>
              <Typography.Link onClick={() => navigate('/prices/pw-3')}>Виджет цен по культуре</Typography.Link>
              <Typography.Link onClick={() => navigate('/analytics')}>Материалы и аналитика</Typography.Link>
              <Typography.Link onClick={() => navigate('/forum?sort=expert')}>Активные эксперты</Typography.Link>
            </Space>
          </Card>
          <Card title="Популярные теги" style={{ marginTop: 16 }}>
            <Space wrap>
              <Tag icon={<PushpinOutlined />}>#пшеница</Tag>
              <Tag>#логистика</Tag>
              <Tag>#экспорт</Tag>
              <Tag>#документы</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function ForumCreateTopicPage() {
  const navigate = useNavigate();
  const addPost = useAppStore((state) => state.addPost);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Breadcrumb
        items={[
          { title: <Typography.Link onClick={() => navigate('/forum')}>Форум</Typography.Link> },
          { title: 'Создание темы' },
        ]}
      />

      <Card title="Новая тема форума">
        <Form
          layout="vertical"
          onFinish={(values) => {
            addPost({
              section: values.section,
              authorId: 'u_buyer_1',
              authorName: 'Пользователь портала',
              title: values.title,
              content: values.content,
              tags: values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean),
            });
            navigate('/forum');
          }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} xl={8}>
              <Form.Item label="Раздел" name="section" rules={[{ required: true, message: 'Выберите раздел' }]}>
                <Select options={forumSections.map((section) => ({ value: section, label: section }))} />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item label="Культура" name="culture">
                <Select allowClear options={['Пшеница', 'Ячмень', 'Кукуруза', 'Соя'].map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
            <Col xs={24} xl={8}>
              <Form.Item label="Регион" name="region">
                <Select allowClear options={['ЦФО', 'ЮФО', 'ПФО', 'Сибирь'].map((value) => ({ value, label: value }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Заголовок" name="title" rules={[{ required: true, message: 'Введите заголовок' }]}>
            <Input placeholder="Кратко опишите вопрос" />
          </Form.Item>

          <Form.Item label="Подробное описание" name="content" rules={[{ required: true, message: 'Введите описание' }]}>
            <Input.TextArea rows={8} placeholder="Опишите ситуацию, условия и ожидаемый результат" />
          </Form.Item>

          <Form.Item label="Теги" name="tags" rules={[{ required: true, message: 'Добавьте теги' }]}>
            <Input placeholder="#пшеница, #логистика, #экспорт" />
          </Form.Item>

          <Space>
            <Button>Прикрепить файл</Button>
            <Button>Предпросмотр</Button>
            <Button type="primary" htmlType="submit">Опубликовать тему</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}

