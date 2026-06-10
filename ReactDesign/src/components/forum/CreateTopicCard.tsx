import { Button, Card, Form, Input, Segmented, message } from 'antd';
import { UserProfile, ForumPost } from '../../types/domain';

interface CreateTopicFormValues {
  section: ForumPost['section'];
  title: string;
  content: string;
  tags: string;
  mediaUrl?: string;
}

interface CreateTopicCardProps {
  currentUser: UserProfile;
  onCreate: (payload: Omit<ForumPost, 'id' | 'createdAt'>) => void;
}

function normalizeTags(rawTags: string): string[] {
  return rawTags
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
}

export function CreateTopicCard({ currentUser, onCreate }: CreateTopicCardProps) {
  const [form] = Form.useForm<CreateTopicFormValues>();

  return (
    <Card title="Создать тему">
      <Form
        form={form}
        layout="vertical"
        initialValues={{ section: 'Агрономия' }}
        onFinish={(values) => {
          onCreate({
            section: values.section,
            authorId: currentUser.id,
            authorName: currentUser.name,
            title: values.title.trim(),
            content: values.content.trim(),
            mediaUrl: values.mediaUrl?.trim() || undefined,
            tags: normalizeTags(values.tags),
          });

          form.resetFields();
          form.setFieldValue('section', 'Агрономия');
          message.success('Тема опубликована');
        }}
      >
        <Form.Item name="section" label="Раздел" rules={[{ required: true }]}>
          <Segmented options={['Агрономия', 'Торговля', 'Техника']} block />
        </Form.Item>
        <Form.Item name="title" label="Заголовок" rules={[{ required: true, message: 'Укажите заголовок' }]}>
          <Input maxLength={140} showCount />
        </Form.Item>
        <Form.Item name="content" label="Описание" rules={[{ required: true, message: 'Опишите вопрос или тему' }]}>
          <Input.TextArea rows={4} maxLength={1000} showCount />
        </Form.Item>
        <Form.Item
          name="tags"
          label="Теги (через пробел или запятую)"
          rules={[{ required: true, message: 'Добавьте хотя бы один тег' }]}
        >
          <Input placeholder="#смоленск #пшеница" />
        </Form.Item>
        <Form.Item name="mediaUrl" label="Фото/видео URL (необязательно)">
          <Input placeholder="https://..." />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Опубликовать
        </Button>
      </Form>
    </Card>
  );
}

