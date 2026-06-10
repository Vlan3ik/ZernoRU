import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Form, Input, Row, Space, Tabs, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../services/portalApi';
import { useAppStore } from '../store/appStore';
import { clearAuthToken, setAuthToken } from '../utils/session';
import { STORAGE_KEYS } from '../utils/storageKeys';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const navigate = useNavigate();
  const loadAll = useAppStore((state) => state.loadAll);
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  const applySession = async (token: string, userId: string) => {
    setAuthToken(token);
    localStorage.setItem(STORAGE_KEYS.currentUserId, userId);
    await loadAll();
    navigate('/cabinet');
  };

  const onLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await portalApi.login(values.email, values.password);
      await applySession(response.token, response.userId);
      message.success(`Вход выполнен как ${response.displayName}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: { email: string; password: string; displayName: string; region: string; farmType: string; inn?: string; ogrn?: string }) => {
    setLoading(true);
    try {
      const response = await portalApi.register({ ...values, role: 'buyer' });
      await applySession(response.token, response.userId);
      message.success(`Аккаунт ${response.displayName} создан`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    clearAuthToken();
    await onLogin({ email, password });
  };

  return (
    <Row gutter={[24, 24]} align="middle">
      <Col xs={24} xl={13}>
        <Card className="hero-card auth-hero-card">
          <Space direction="vertical" size={18} style={{ width: '100%' }}>
            <Tag color="green">Единый вход</Tag>
            <Typography.Title level={1}>Один аккаунт для просмотра, покупок, продаж и администрирования</Typography.Title>
            <Typography.Paragraph className="lead-text">
              Личный кабинет, админка и торговые сценарии открываются из одного профиля. Тестовые учетные записи уже загружены в Docker, а доступ к роли в интерфейсе больше не мешает работе.
            </Typography.Paragraph>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}><Card className="nested-card auth-quick-card"><Tag color="green">Участник</Tag><Typography.Text strong>participant1@zerno.local</Typography.Text><Typography.Paragraph>Покупки, корзина, заказы и кабинет.</Typography.Paragraph><Button block onClick={() => void quickLogin('participant1@zerno.local', 'Password123!')}>Быстрый вход</Button></Card></Col>
              <Col xs={24} md={8}><Card className="nested-card auth-quick-card"><Tag color="gold">Участник</Tag><Typography.Text strong>participant2@zerno.local</Typography.Text><Typography.Paragraph>Размещение лотов, документы и торговые сценарии.</Typography.Paragraph><Button block onClick={() => void quickLogin('participant2@zerno.local', 'Password123!')}>Быстрый вход</Button></Card></Col>
              <Col xs={24} md={8}><Card className="nested-card auth-quick-card"><Tag color="blue">Админ</Tag><Typography.Text strong>admin@zerno.local</Typography.Text><Typography.Paragraph>Модерация, заявки и управление витриной.</Typography.Paragraph><Button block onClick={() => void quickLogin('admin@zerno.local', 'Password123!')}>Быстрый вход</Button></Card></Col>
            </Row>
          </Space>
        </Card>
      </Col>

      <Col xs={24} xl={11}>
        <Card className="section-card auth-card">
          <Tabs
            activeKey={mode}
            onChange={(value) => setMode(value as AuthMode)}
            items={[
              { key: 'login', label: 'Вход', children: <LoginForm onFinish={onLogin} loading={loading} /> },
              { key: 'register', label: 'Регистрация', children: <RegisterForm onFinish={onRegister} loading={loading} /> },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );
}

function LoginForm({ onFinish, loading }: { onFinish: (values: { email: string; password: string }) => Promise<void>; loading: boolean }) {
  return (
      <Form layout="vertical" onFinish={(values) => void onFinish(values)} initialValues={{ email: 'participant1@zerno.local', password: 'Password123!' }}>
      <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Введите email' }]}>
        <Input prefix={<UserOutlined />} />
      </Form.Item>
      <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
        <Input.Password prefix={<LockOutlined />} />
      </Form.Item>
      <Alert type="info" showIcon message="Тестовые пользователи уже созданы в базе." style={{ marginBottom: 16 }} />
      <Button type="primary" htmlType="submit" loading={loading} block>
        Войти
      </Button>
    </Form>
  );
}

function RegisterForm({ onFinish, loading }: { onFinish: (values: { email: string; password: string; displayName: string; region: string; farmType: string; inn?: string; ogrn?: string }) => Promise<void>; loading: boolean }) {
  return (
    <Form layout="vertical" onFinish={(values) => void onFinish(values)}>
      <Form.Item name="displayName" label="Название компании" rules={[{ required: true, message: 'Введите название' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Введите email' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
        <Input.Password />
      </Form.Item>
      <Form.Item name="region" label="Регион" rules={[{ required: true, message: 'Введите регион' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="farmType" label="Тип организации" rules={[{ required: true, message: 'Введите тип' }]}>
        <Input />
      </Form.Item>
      <Alert
        type="info"
        showIcon
        message="Новый профиль создаётся как участник портала. После проверки документов доступ к размещению и модерации открывается автоматически."
        style={{ marginBottom: 16 }}
      />
      <Form.Item name="inn" label="ИНН">
        <Input />
      </Form.Item>
      <Form.Item name="ogrn" label="ОГРН">
        <Input />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        Создать профиль
      </Button>
    </Form>
  );
}
