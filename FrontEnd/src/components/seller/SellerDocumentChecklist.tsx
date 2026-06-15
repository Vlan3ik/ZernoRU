import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Alert, List, Space, Tag, Typography } from 'antd';
import { SellerDocumentInput } from '../../types/domain';

const LABELS: Record<keyof SellerDocumentInput, string> = {
  companyName: 'Название организации',
  inn: 'ИНН',
  kpp: 'КПП',
  ogrn: 'ОГРН/ОГРНИП',
  bankName: 'Банк',
  bankAccount: 'Расчетный счет',
  bik: 'БИК',
  docPhotoUrl: 'Ссылка на документы',
  mercuryCertificate: 'Сертификат ФГИС "Меркурий"',
  declarationOfConformity: 'Декларация о соответствии',
  storageContract: 'Договор хранения',
};

interface SellerDocumentChecklistProps {
  values: Partial<SellerDocumentInput>;
  missingFields: (keyof SellerDocumentInput)[];
}

export function SellerDocumentChecklist({ values, missingFields }: SellerDocumentChecklistProps) {
  const allFields = Object.keys(LABELS) as Array<keyof SellerDocumentInput>;
  const completeCount = allFields.length - missingFields.length;

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space align="center">
        <Typography.Text strong>Обязательные документы:</Typography.Text>
        <Tag color={missingFields.length === 0 ? 'green' : 'gold'}>
          {completeCount}/{allFields.length} заполнено
        </Tag>
      </Space>

      {missingFields.length > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Перед отправкой заполните все обязательные документы"
          description={
            <Typography.Text type="secondary">
              Не хватает: {missingFields.map((field) => LABELS[field]).join(', ')}
            </Typography.Text>
          }
        />
      ) : (
        <Alert type="success" showIcon message="Комплект документов полный" />
      )}

      <List
        size="small"
        bordered
        dataSource={allFields}
        renderItem={(field) => {
          const hasValue = Boolean(String(values[field] ?? '').trim());

          return (
            <List.Item>
              <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space align="center">
                  {hasValue ? <CheckCircleOutlined style={{ color: '#2b8a3e' }} /> : <ExclamationCircleOutlined style={{ color: '#d48806' }} />}
                  <span>{LABELS[field]}</span>
                </Space>
                <Tag color={hasValue ? 'green' : 'default'}>{hasValue ? 'Готов' : 'Не заполнен'}</Tag>
              </Space>
            </List.Item>
          );
        }}
      />
    </Space>
  );
}
