import { CheckCircleTwoTone, LinkOutlined } from '@ant-design/icons';
import { Button, Card, Form, List, Space, Tag, Typography, Input, message } from 'antd';
import dayjs from 'dayjs';
import { ForumPost, ForumReply } from '../../types/domain';

interface ForumPostCardProps {
  post: ForumPost;
  replies: ForumReply[];
  currentUserName: string;
  onReply: (payload: Omit<ForumReply, 'id' | 'createdAt'>) => void;
}

interface ReplyFormValues {
  answer: string;
}

export function ForumPostCard({ post, replies, currentUserName, onReply }: ForumPostCardProps) {
  const [form] = Form.useForm<ReplyFormValues>();
  const sortedReplies = [...replies].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Card>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Space wrap>
          <Tag color="blue">{post.section}</Tag>
          {post.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Space>

        <Typography.Title level={4} style={{ margin: 0 }}>
          {post.title}
        </Typography.Title>
        <Typography.Text>{post.content}</Typography.Text>

        {post.attachments?.length ? (
          <Space wrap size={[8, 8]}>
            {post.attachments.map((attachment) => (
              <Tag key={attachment.id}>{attachment.name}</Tag>
            ))}
          </Space>
        ) : post.mediaUrl ? (
          <Typography.Link href={post.mediaUrl} target="_blank" rel="noreferrer">
            <LinkOutlined /> Открыть вложение
          </Typography.Link>
        ) : null}

        {post.verifiedAnswer && (
          <Card size="small" styles={{ body: { background: '#f6ffed' } }}>
            <Space>
              <CheckCircleTwoTone twoToneColor="#52c41a" />
              <Typography.Text strong>Проверенный ответ:</Typography.Text>
              <Typography.Text>{post.verifiedAnswer}</Typography.Text>
            </Space>
          </Card>
        )}

        <Typography.Text type="secondary">
          {post.authorName} · {dayjs(post.createdAt).format('DD.MM.YYYY HH:mm')}
        </Typography.Text>

        <List
          size="small"
          dataSource={sortedReplies}
          locale={{ emptyText: 'Ответов пока нет' }}
          renderItem={(reply) => (
            <List.Item>
              <Space direction="vertical" size={2}>
                <Typography.Text strong>
                  {reply.authorName} (рейтинг {reply.rating.toFixed(1)})
                </Typography.Text>
                <Typography.Text>{reply.content}</Typography.Text>
                <Typography.Text type="secondary">
                  {dayjs(reply.createdAt).format('DD.MM.YYYY HH:mm')}
                </Typography.Text>
              </Space>
            </List.Item>
          )}
        />

        <Form
          form={form}
          layout="inline"
          onFinish={(values) => {
            onReply({
              postId: post.id,
              authorName: currentUserName,
              rating: 4.7,
              content: values.answer.trim(),
            });
            form.resetFields();
            message.success('Ответ опубликован');
          }}
        >
          <Form.Item
            name="answer"
            rules={[{ required: true, message: 'Введите текст ответа' }]}
            style={{ flex: 1, minWidth: 240 }}
          >
            <Input placeholder="Ваш ответ" maxLength={800} />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit">Ответить</Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
}
