import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Form, Input, Progress, Row, Space, Steps, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { SellerDocumentChecklist } from '../components/seller/SellerDocumentChecklist';
import { SellerVerificationStatusCard } from '../components/seller/SellerVerificationStatusCard';
import { useAppStore } from '../store/appStore';
import { SellerDocumentInput } from '../types/domain';

const DRAFT_KEY = 'zerno_seller_verification_draft_v1';
const verificationSteps = ['Реквизиты', 'Банковские данные', 'Документы', 'Контакты', 'Подтверждение'];

type SellerVerificationFormValues = SellerDocumentInput & {
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
};

const stepFields: Array<Array<keyof SellerVerificationFormValues>> = [
  ['companyName', 'inn', 'kpp', 'ogrn'],
  ['bankName', 'bankAccount', 'bik'],
  ['docPhotoUrl', 'mercuryCertificate', 'declarationOfConformity', 'storageContract'],
  ['contactPerson', 'contactPhone', 'contactEmail'],
  [],
];

function normalizeVerificationStatus(value?: string): 'pending' | 'approved' | 'rejected' {
  if (value === 'approved' || value === 'rejected') {
    return value;
  }
  return 'pending';
}

export function SellerVerificationPage() {
  const [form] = Form.useForm<SellerVerificationFormValues>();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const users = useAppStore((state) => state.users);
  const currentUserId = useAppStore((state) => state.currentUserId);
  const sellerApplications = useAppStore((state) => state.sellerApplications);
  const submitSellerApplication = useAppStore((state) => state.submitSellerApplication);

  const currentUser = users.find((user) => user.id === currentUserId) ?? null;
  const latestApplication = useMemo(
    () =>
      [...sellerApplications]
        .filter((application) => application.userId === currentUserId)
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0] ?? null,
    [currentUserId, sellerApplications],
  );
  const status = normalizeVerificationStatus(currentUser?.sellerVerificationStatus ?? latestApplication?.status);

  const progress = useMemo(() => Math.round(((step + 1) / verificationSteps.length) * 100), [step]);
  const values = Form.useWatch([], form) as Partial<SellerVerificationFormValues> | undefined;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        form.setFieldsValue(JSON.parse(raw) as Partial<SellerVerificationFormValues>);
      }
    } catch {
      // Draft restoration is best effort only.
    }
  }, [form]);

  useEffect(() => {
    if (!values) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      // Draft persistence is best effort only.
    }
  }, [values]);

  const documentFields = ['companyName', 'inn', 'kpp', 'ogrn', 'bankName', 'bankAccount', 'bik', 'docPhotoUrl', 'mercuryCertificate', 'declarationOfConformity', 'storageContract'] as const;
  const missingFields = useMemo(
    () =>
      documentFields.filter((field) => !String((values ?? {})[field] ?? '').trim()) as Array<keyof SellerDocumentInput>,
    [values],
  );

  const moveToNext = async () => {
    const fields = stepFields[step];
    if (fields.length) {
      await form.validateFields(fields as string[]);
    }
    setStep((current) => Math.min(current + 1, verificationSteps.length - 1));
  };

  const handleSubmit = async () => {
    try {
      const result = await form.validateFields();

      if (!currentUserId) {
        message.error('Сначала войдите в аккаунт продавца');
        return;
      }

      await submitSellerApplication({
        userId: currentUserId,
        companyName: result.companyName.trim(),
        inn: result.inn.trim(),
        ogrn: result.ogrn.trim(),
        docPhotoUrl: result.docPhotoUrl.trim(),
      });

      setSubmitted(true);
      message.success('Заявка отправлена на проверку');
      window.localStorage.removeItem(DRAFT_KEY);
      setStep(verificationSteps.length - 1);
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      }
    }
  };

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card className="section-card">
        <Typography.Title level={1}>Проверка продавца</Typography.Title>
        <Typography.Paragraph className="lead-text">
          Контролируемая форма для юридического лица с отдельными полями для реквизитов, банковских данных и документов. Заявка отправляется в текущий API и статус обновляется в кабинете.
        </Typography.Paragraph>
        <Alert
          style={{ marginTop: 16 }}
          type="info"
          showIcon
          message="Проверка выполняется для юридического лица"
          description="ИНН, КПП, ОГРН, банковские реквизиты и документы проверяются раздельно. Так удобнее валидировать данные и не смешивать их в одном поле."
        />
      </Card>

      {!currentUser && (
        <Alert
          type="info"
          showIcon
          message="Для отправки заявки нужен вход в аккаунт"
          description="Форма доступна для заполнения, но отправка заявки выполнится только после авторизации."
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} xl={16}>
          <Card>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text strong>Статус заявки</Typography.Text>
              <Progress percent={progress} strokeColor="#2f6f3e" />
              <Steps current={step} items={verificationSteps.map((item) => ({ title: item }))} responsive />
            </Space>
          </Card>

          <Card title={verificationSteps[step]} style={{ marginTop: 16 }}>
            <Form form={form} layout="vertical" requiredMark={false} initialValues={{}}>
              {step === 0 && (
                <>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Название организации"
                        name="companyName"
                        rules={[{ required: true, message: 'Введите название организации' }, { min: 3, message: 'Слишком короткое название' }]}
                      >
                        <Input placeholder="ООО Поле и Экспорт" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="ИНН" name="inn" rules={[{ required: true, message: 'Введите ИНН' }, { len: 10, message: 'ИНН должен содержать 10 цифр' }]}>
                        <Input inputMode="numeric" placeholder="6732012345" maxLength={10} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="КПП" name="kpp" rules={[{ required: true, message: 'Введите КПП' }, { len: 9, message: 'КПП должен содержать 9 цифр' }]}>
                        <Input inputMode="numeric" placeholder="673201001" maxLength={9} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="ОГРН" name="ogrn" rules={[{ required: true, message: 'Введите ОГРН' }, { min: 13, message: 'ОГРН должен содержать не менее 13 цифр' }]}>
                        <Input inputMode="numeric" placeholder="1216700001122" maxLength={15} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              {step === 1 && (
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={8}>
                    <Form.Item label="Банк" name="bankName" rules={[{ required: true, message: 'Введите название банка' }]}>
                      <Input placeholder="ПАО Сбербанк" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Расчетный счет"
                      name="bankAccount"
                      rules={[{ required: true, message: 'Введите расчетный счет' }, { len: 20, message: 'Счет должен содержать 20 цифр' }]}
                    >
                      <Input inputMode="numeric" placeholder="40817810099910004321" maxLength={20} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="БИК" name="bik" rules={[{ required: true, message: 'Введите БИК' }, { len: 9, message: 'БИК должен содержать 9 цифр' }]}>
                      <Input inputMode="numeric" placeholder="044525225" maxLength={9} />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {step === 2 && (
                <>
                  <Form.Item
                    label="Ссылка на фото / скан документов"
                    name="docPhotoUrl"
                    rules={[{ required: true, message: 'Добавьте ссылку на документы' }, { type: 'url', message: 'Введите корректную ссылку' }]}
                  >
                    <Input placeholder="https://..." />
                  </Form.Item>
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Сертификат ФГИС Меркурий"
                        name="mercuryCertificate"
                        rules={[{ required: true, message: 'Введите номер сертификата' }]}
                      >
                        <Input placeholder="МЕРК-2025-1129" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Декларация о соответствии"
                        name="declarationOfConformity"
                        rules={[{ required: true, message: 'Введите декларацию' }]}
                      >
                        <Input placeholder="ЕАЭС N RU ..." />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Договор хранения"
                        name="storageContract"
                        rules={[{ required: true, message: 'Введите номер договора хранения' }]}
                      >
                        <Input placeholder="Договор хранения N 45/25" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              {step === 3 && (
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={8}>
                    <Form.Item label="Контактное лицо" name="contactPerson" rules={[{ required: true, message: 'Введите ФИО' }]}>
                      <Input placeholder="Иванов Иван Иванович" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Телефон"
                      name="contactPhone"
                      rules={[{ required: true, message: 'Введите телефон' }, { pattern: /^\+?[0-9()\-\s]{10,}$/, message: 'Введите корректный телефон' }]}
                    >
                      <Input placeholder="+7 (900) 123-45-67" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      label="Электронная почта"
                      name="contactEmail"
                      rules={[{ required: true, message: 'Введите email' }, { type: 'email', message: 'Введите корректный email' }]}
                    >
                      <Input placeholder="trade@company.ru" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {step === 4 && (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    icon={<InfoCircleOutlined />}
                    message="Проверьте данные перед отправкой"
                    description="После отправки заявка перейдет в статус «На проверке». Если понадобится уточнение, его можно будет внести в новом черновике."
                  />
                  <SellerDocumentChecklist values={(values ?? {}) as Partial<SellerDocumentInput>} missingFields={missingFields} />
                </Space>
              )}

              <Space style={{ marginTop: 16 }} wrap>
                <Button onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
                  Назад
                </Button>
                {step < verificationSteps.length - 1 && (
                  <Button type="primary" onClick={() => void moveToNext()}>
                    Следующий шаг
                  </Button>
                )}
                {step === verificationSteps.length - 1 && (
                  <Button type="primary" onClick={() => void handleSubmit()} disabled={!currentUserId}>
                    Отправить на проверку
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const snapshot = form.getFieldsValue(true);
                    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
                    message.success('Черновик сохранен');
                  }}
                >
                  Сохранить черновик
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <SellerVerificationStatusCard status={status} latestApplication={latestApplication} />

          <Card title="Что будет после отправки" style={{ marginTop: 16 }}>
            <Space direction="vertical" size={10}>
              <Typography.Text>1. Специалист проверит реквизиты и документы.</Typography.Text>
              <Typography.Text>2. При необходимости запросит уточнение.</Typography.Text>
              <Typography.Text>3. После одобрения откроется публикация лотов и заявок.</Typography.Text>
            </Space>
          </Card>

          <Card title="История действий" style={{ marginTop: 16 }}>
            <Space direction="vertical" size={8}>
              <Typography.Text>17.04.2026 10:12 · Создан черновик заявки</Typography.Text>
              <Typography.Text>17.04.2026 10:25 · Заполнены реквизиты и контакты</Typography.Text>
              <Typography.Text>
                {submitted ? '17.04.2026 10:41 · Заявка отправлена на проверку' : 'Ожидается отправка'}
              </Typography.Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

export function SellerRegistrationPage() {
  return <SellerVerificationPage />;
}
