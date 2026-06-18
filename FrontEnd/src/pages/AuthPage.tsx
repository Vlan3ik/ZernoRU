import { LockOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Form, Input, Row, Select, Space, Tag, Tabs, Typography, message } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../services/portalApi';
import { setSession } from '../services/session';
import { useAppStore } from '../store/appStore';

type AuthMode = 'login' | 'register';

export function AuthPage() {
  const navigate = useNavigate();
  const loadAll = useAppStore((state) => state.loadAll);
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await portalApi.login(values.email, values.password);
      setSession({ token: result.token, userId: result.userId });
      await loadAll();
      message.success('Вход выполнен');
      navigate('/cabinet');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось войти');
    } finally {
      setLoading(false);
    }
  };

  const referenceCatalogs = useAppStore((state) => state.referenceCatalogs);
  const regionOptions = useMemo(() => {
    const ref = (referenceCatalogs['regions'] ?? []).map((r) => r.title);
    return ref.length ? ref : ['Смоленская область', 'Краснодарский край', 'Ростовская область', 'Воронежская область'];
  }, [referenceCatalogs]);

  const handleRegister = async (values: {
    email: string;
    password: string;
    displayName: string;
    region: string;
    farmType: string;
    inn?: string;
    ogrn?: string;
  }) => {
    setLoading(true);
    try {
      const result = await portalApi.register(values);
      setSession({ token: result.token, userId: result.userId });
      await loadAll();
      message.success('Аккаунт создан');
      navigate('/cabinet');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <Row gutter={[24, 24]} justify="center" style={{ width: '100%' }}>
        <Col xs={24} xl={9}>
          <Card className="auth-card">
            <div className="auth-card__aside">
              <Space direction="vertical" size={14}>
                <Tag color="green" style={{ width: 'fit-content' }}>
                  Личный доступ
                </Tag>
                <Typography.Title level={1} className="auth-card__aside-title">
                  Вход в портал, кабинет и редакционные сервисы
                </Typography.Title>
                <Typography.Paragraph className="auth-card__aside-text">
                  Используйте демо-аккаунты для проверки сценариев покупателя, продавца и администратора. Регистрация создаёт новую учётную запись с тем же рабочим потоком.
                </Typography.Paragraph>
              </Space>

              <Space direction="vertical" size={8}>
                <Typography.Text className="auth-card__aside-text">Демо-пользователи</Typography.Text>
                <Typography.Text className="auth-card__aside-text">participant1@zerno.local / Password123!</Typography.Text>
                <Typography.Text className="auth-card__aside-text">participant2@zerno.local / Password123!</Typography.Text>
                <Typography.Text className="auth-card__aside-text">admin@zerno.local / Password123!</Typography.Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card className="section-card auth-card">
            <Typography.Title level={1}>Вход и регистрация</Typography.Title>
            <Typography.Paragraph className="lead-text">
              Войдите под одним из демо-пользователей или создайте новый аккаунт организации.
            </Typography.Paragraph>
            <Alert
              type="info"
              showIcon
              message="Демо-аккаунты"
              description="participant1@zerno.local / Password123!, participant2@zerno.local / Password123!, admin@zerno.local / Password123!"
            />

            <Tabs
              activeKey={mode}
              onChange={(key) => setMode(key as AuthMode)}
              className="auth-tabs"
              items={[
                {
                  key: 'login',
                  label: (
                    <span>
                      <LoginOutlined /> Вход
                    </span>
                  ),
                  children: (
                    <Form layout="vertical" onFinish={handleLogin}>
                      <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Введите email' }]}>
                        <Input placeholder="participant2@zerno.local" />
                      </Form.Item>
                      <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Password123!" />
                      </Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} block size="large">
                        Войти
                      </Button>
                    </Form>
                  ),
                },
                {
                  key: 'register',
                  label: (
                    <span>
                      <UserAddOutlined /> Регистрация
                    </span>
                  ),
                  children: (
                    <Form layout="vertical" onFinish={handleRegister}>
                      <Form.Item name="displayName" label="Название компании" rules={[{ required: true, message: 'Введите название' }]}>
                        <Input placeholder="ООО АгроТрейд" />
                      </Form.Item>
                      <Row gutter={12}>
                        <Col xs={24} md={12}>
                          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Введите email' }]}>
                            <Input placeholder="name@company.ru" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="password" label="Пароль" rules={[{ required: true, message: 'Введите пароль' }]}>
                            <Input.Password placeholder="Password123!" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col xs={24} md={12}>
                          <Form.Item name="region" label="Регион" rules={[{ required: true, message: 'Выберите регион' }]}>
                            <Select showSearch placeholder="Выберите регион" options={regionOptions.map((r) => ({ value: r, label: r }))} filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="farmType" label="Тип деятельности" rules={[{ required: true, message: 'Введите тип деятельности' }]}>
                            <Input placeholder="Поставщик зерна" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col xs={24} md={12}>
                          <Form.Item name="inn" label="ИНН">
                            <Input placeholder="6732000000" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="ogrn" label="ОГРН">
                            <Input placeholder="1234567890123" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button type="primary" htmlType="submit" loading={loading} block size="large">
                        Создать аккаунт
                      </Button>
                    </Form>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
