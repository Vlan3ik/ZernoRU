import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Form, Input, Progress, Row, Space, Steps, Timeline, Typography } from 'antd';
import { useMemo, useState } from 'react';

const verificationSteps = ['Реквизиты', 'Документы', 'Банковские данные', 'Контакты', 'Подтверждение', 'Проверка'];
const statuses = ['Черновик', 'Отправлено', 'На проверке', 'Требуется уточнение', 'Одобрено', 'Отклонено'];

export function SellerVerificationPage() {
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);

  const progress = useMemo(() => Math.round(((step + 1) / verificationSteps.length) * 100), [step]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Проверка продавца</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Пошаговая регистрация с прогрессом, автосохранением черновика, понятной валидацией и шкалой статуса заявки.
        </Typography.Paragraph>
      </Card>

      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text strong>Статус заявки</Typography.Text>
          <Space wrap>
            <TagStatus label={statuses[0]} tone="draft" active={!sent} />
            <TagStatus label={statuses[1]} tone="info" active={sent} />
            <TagStatus label={statuses[2]} tone="warning" active={sent} />
            <TagStatus label={statuses[3]} tone="warning" active={false} />
            <TagStatus label={statuses[4]} tone="success" active={false} />
            <TagStatus label={statuses[5]} tone="error" active={false} />
          </Space>
          <Progress percent={progress} strokeColor="#2f6f3e" />
          <Steps current={step} items={verificationSteps.map((item) => ({ title: item }))} responsive />
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Card title={verificationSteps[step]}>
            <Form layout="vertical">
              {step === 0 && (
                <>
                  <Form.Item label="Название организации" required>
                    <Input placeholder="ООО Поле и Экспорт" />
                  </Form.Item>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="ИНН" required>
                        <Input placeholder="Введите ИНН" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="ОГРН" required>
                        <Input placeholder="Введите ОГРН" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              {step === 1 && (
                <>
                  <Form.Item label="Учредительные документы" required>
                    <Input placeholder="Ссылка или номер документа" />
                  </Form.Item>
                  <Form.Item label="Сертификаты и лицензии">
                    <Input placeholder="При наличии" />
                  </Form.Item>
                </>
              )}

              {step === 2 && (
                <>
                  <Form.Item label="Расчетный счет" required>
                    <Input placeholder="20-значный номер счета" />
                  </Form.Item>
                  <Form.Item label="БИК" required>
                    <Input placeholder="БИК банка" />
                  </Form.Item>
                </>
              )}

              {step === 3 && (
                <>
                  <Form.Item label="Контактное лицо" required>
                    <Input placeholder="ФИО" />
                  </Form.Item>
                  <Form.Item label="Телефон" required>
                    <Input placeholder="+7 ..." />
                  </Form.Item>
                  <Form.Item label="Электронная почта" required>
                    <Input placeholder="name@company.ru" />
                  </Form.Item>
                </>
              )}

              {step === 4 && (
                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message="Проверьте данные перед отправкой"
                  description="После отправки заявка перейдет в статус «На проверке». Если нужны уточнения, вы получите событие в уведомлениях."
                />
              )}

              {step === 5 && (
                <Alert
                  type="warning"
                  showIcon
                  message="Заявка отправлена"
                  description="Публикация лотов откроется после одобрения проверки."
                />
              )}

              <Space style={{ marginTop: 16 }}>
                <Button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>Назад</Button>
                {step < verificationSteps.length - 1 && (
                  <Button type="primary" onClick={() => setStep(step + 1)}>Следующий шаг</Button>
                )}
                {step === verificationSteps.length - 2 && (
                  <Button type="primary" onClick={() => { setSent(true); setStep(step + 1); }}>
                    Отправить на проверку
                  </Button>
                )}
                <Button>Сохранить черновик</Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card title="Что будет после отправки">
            <Space direction="vertical" size={10}>
              <Typography.Text>1. Специалист проверит реквизиты и документы.</Typography.Text>
              <Typography.Text>2. При необходимости запросит уточнение.</Typography.Text>
              <Typography.Text>3. После одобрения откроется публикация лотов и заявок.</Typography.Text>
            </Space>
          </Card>

          <Card title="История действий" style={{ marginTop: 16 }}>
            <Timeline
              items={[
                { color: 'gray', children: '17.04.2026 10:12 · Создан черновик заявки' },
                { color: 'blue', children: '17.04.2026 10:25 · Заполнены реквизиты и контакты' },
                { color: 'green', children: sent ? '17.04.2026 10:41 · Заявка отправлена на проверку' : 'Ожидается отправка' },
              ]}
            />
          </Card>

          {!sent && (
            <Card title="Ограничение доступа" style={{ marginTop: 16 }}>
              <Typography.Paragraph>
                Раздел публикации лотов заблокирован до завершения проверки продавца. Завершите шаги регистрации и
                отправьте заявку.
              </Typography.Paragraph>
            </Card>
          )}
        </Col>
      </Row>
    </Space>
  );
}

export function SellerRegistrationPage() {
  return <SellerVerificationPage />;
}

function TagStatus({ label, tone, active }: { label: string; tone: 'draft' | 'info' | 'warning' | 'success' | 'error'; active: boolean }) {
  if (!active) {
    return <span className="status-tag status-muted">{label}</span>;
  }

  const icon = tone === 'success' ? <CheckCircleOutlined /> : tone === 'warning' ? <ClockCircleOutlined /> : tone === 'error' ? <CloseCircleOutlined /> : <InfoCircleOutlined />;
  return <span className={`status-tag status-${tone}`}>{icon} {label}</span>;
}

