import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Segmented, Space, Tag, message } from 'antd';
import { useRef, useState } from 'react';
import { UserProfile, ForumPost } from '../../types/domain';

interface CreateTopicFormValues {
  section: ForumPost['section'];
  title: string;
  content: string;
  tags: string;
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
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            mediaUrl: attachment?.url,
            tags: normalizeTags(values.tags),
          });

          form.resetFields();
          setAttachment(null);
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
        <Space wrap style={{ marginBottom: 12 }}>
          <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
            Прикрепить файл
          </Button>
          {attachment && <Tag closable onClose={() => setAttachment(null)}>{attachment.name}</Tag>}
        </Space>
        <input
          ref={fileInputRef}
          type="file"
          className="forum-hidden-input"
          accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setAttachment({ url: String(reader.result ?? ''), name: file.name });
            reader.readAsDataURL(file);
            event.target.value = '';
          }}
        />
        <Button type="primary" htmlType="submit">
          Опубликовать
        </Button>
      </Form>
    </Card>
  );
}
