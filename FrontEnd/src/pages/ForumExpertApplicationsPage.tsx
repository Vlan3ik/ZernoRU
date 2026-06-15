import { EditOutlined, LogoutOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Form, Input, InputNumber, Modal, Row, Col, Select, Space, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { forumSections } from '../data/portalContent';
import { useAppStore } from '../store/appStore';
import type { ForumExpertApplication, ForumSectionName } from '../types/domain';

type ApplicationFormValues = Omit<ForumExpertApplication, 'id' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewerName'>;

const statusLabels: Record<ForumExpertApplication['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
  withdrawn: 'Отозвана',
};

function statusColor(status: ForumExpertApplication['status']) {
  if (status === 'approved') return 'green';
  if (status === 'rejected') return 'red';
  if (status === 'withdrawn') return 'default';
  return 'gold';
}

export function ForumExpertApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<ApplicationFormValues>();
  const currentUserId = useAppStore((state) => state.currentUserId);
  const users = useAppStore((state) => state.users);
  const applications = useAppStore((state) => state.forumExpertApplications);
  const submitForumExpertApplication = useAppStore((state) => state.submitForumExpertApplication);
  const updateForumExpertApplication = useAppStore((state) => state.updateForumExpertApplication);
  const withdrawForumExpertApplication = useAppStore((state) => state.withdrawForumExpertApplication);
  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const sectionHint = searchParams.get('section') ?? '';
  const topicHint = searchParams.get('topicId') ?? '';

  const userApplications = useMemo(
    () => applications.filter((application) => application.userId === currentUserId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [applications, currentUserId],
  );

  const editingApplication = userApplications.find((item) => item.id === editingId) ?? null;

  useEffect(() => {
    if (!modalOpen) return;
    if (editingApplication) {
      form.setFieldsValue(editingApplication);
    } else {
      form.setFieldsValue({
        userId: currentUser?.id ?? '',
        userName: currentUser?.name ?? '',
        section: (sectionHint as ForumSectionName) || 'Агрономия',
        specialization: '',
        experienceYears: 1,
        experienceSummary: '',
        proof: '',
        contact: currentUser?.email ?? '',
      });
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.name, editingApplication, form, modalOpen, sectionHint]);

  const openNew = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (application: ForumExpertApplication) => {
    setEditingId(application.id);
    setModalOpen(true);
  };

  const handleSubmit = async (values: ApplicationFormValues) => {
    if (!currentUser) {
      message.warning('Сначала войдите в аккаунт');
      navigate('/auth');
      return;
    }

    const payload: ApplicationFormValues = {
      userId: currentUser.id,
      userName: currentUser.name,
      section: values.section,
      specialization: values.specialization.trim(),
      experienceYears: Number(values.experienceYears),
      experienceSummary: values.experienceSummary.trim(),
      proof: values.proof.trim(),
      contact: values.contact.trim(),
      topicId: topicHint || undefined,
    };

    if (editingApplication) {
      await updateForumExpertApplication(editingApplication.id, payload);
      message.success('Заявка обновлена');
    } else {
      await submitForumExpertApplication(payload);
      message.success('Заявка отправлена');
    }

    setModalOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={1} style={{ marginBottom: 0 }}>
            Мои заявки на роль эксперта
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Здесь видно все заявки, их статусы, а также действия для черновиков и отклонённых заявок.
          </Typography.Paragraph>
          {topicHint && (
            <Tag color="blue">Заявка подана из темы {topicHint}</Tag>
          )}
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
              Новая заявка
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => navigate(0)}>
              Обновить
            </Button>
          </Space>
        </Space>
      </Card>

      {!currentUser ? (
        <Card>
          <Empty description="Сначала войдите в аккаунт">
            <Button type="primary" onClick={() => navigate('/auth')}>
              Войти
            </Button>
          </Empty>
        </Card>
      ) : userApplications.length ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {userApplications.map((application) => (
            <Card
              key={application.id}
              title={
                <Space wrap>
                  <span>{application.specialization}</span>
                  <Tag color={statusColor(application.status)}>{statusLabels[application.status]}</Tag>
                  <Tag>{application.section}</Tag>
                </Space>
              }
              extra={<Typography.Text type="secondary">{new Date(application.createdAt).toLocaleString('ru-RU')}</Typography.Text>}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Typography.Text strong>Опыт</Typography.Text>
                  <Typography.Paragraph>{application.experienceYears} лет · {application.experienceSummary}</Typography.Paragraph>
                </Col>
                <Col xs={24} md={12}>
                  <Typography.Text strong>Контакт</Typography.Text>
                  <Typography.Paragraph>{application.contact}</Typography.Paragraph>
                </Col>
                <Col xs={24}>
                  <Typography.Text strong>Подтверждение</Typography.Text>
                  <Typography.Paragraph>{application.proof}</Typography.Paragraph>
                </Col>
              </Row>
              <Space wrap>
                {application.status !== 'approved' && (
                  <>
                    <Button icon={<EditOutlined />} onClick={() => openEdit(application)}>
                      Редактировать
                    </Button>
                    {application.status !== 'withdrawn' && (
                      <Button
                        icon={<LogoutOutlined />}
                        danger
                        onClick={async () => {
                          await withdrawForumExpertApplication(application.id);
                          message.success('Заявка отозвана');
                        }}
                      >
                        Отозвать
                      </Button>
                    )}
                  </>
                )}
              </Space>
            </Card>
          ))}
        </Space>
      ) : (
        <Card>
          <Empty description="Заявок пока нет">
            <Button type="primary" onClick={openNew}>
              Подать первую заявку
            </Button>
          </Empty>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={editingApplication ? 'Редактировать заявку' : 'Новая заявка'}
        width={900}
        destroyOnClose
      >
        <Form<ApplicationFormValues> form={form} layout="vertical" onFinish={(values) => void handleSubmit(values)}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="section" label="Раздел" rules={[{ required: true, message: 'Выберите раздел' }]}>
                <Select options={forumSections.map((section) => ({ value: section, label: section }))} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="specialization" label="Специализация" rules={[{ required: true, message: 'Введите специализацию' }]}>
                <Input placeholder="Агрономия, логистика, хранение..." />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="experienceYears" label="Стаж, лет" rules={[{ required: true, message: 'Укажите стаж' }]}>
                <InputNumber min={1} max={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="contact" label="Контакт" rules={[{ required: true, message: 'Укажите контакт' }]}>
                <Input placeholder="telegram / phone / email" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="experienceSummary" label="Опыт" rules={[{ required: true, message: 'Опишите опыт' }]}>
            <Input.TextArea rows={3} placeholder="С какими культурами и кейсами работаете" />
          </Form.Item>
          <Form.Item name="proof" label="Подтверждение" rules={[{ required: true, message: 'Укажите подтверждение' }]}>
            <Input.TextArea rows={3} placeholder="Ссылки, документы, примеры публикаций или кейсов" />
          </Form.Item>
          <Space wrap>
            <Button onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button type="primary" htmlType="submit">
              {editingApplication ? 'Сохранить' : 'Отправить заявку'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}
