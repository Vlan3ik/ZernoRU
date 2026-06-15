import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Empty, Flex, InputNumber, List, Radio, Space, Typography, message } from 'antd';
import { ReactNode, useMemo, useState } from 'react';
import { DeliveryMode, PaymentMethod } from '../../types/domain';
import { useAppStore } from '../../store/appStore';

interface Props {
  trigger?: ReactNode;
}

export function CartDrawer({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup');

  const cart = useAppStore((s) => s.cart);
  const updateQuantity = useAppStore((s) => s.updateCartQuantity);
  const removeCartItem = useAppStore((s) => s.removeCartItem);
  const checkout = useAppStore((s) => s.checkout);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.subtotal, 0), [cart]);

  const handleCheckout = async () => {
    if (!cart.length) {
      message.warning('Корзина пуста');
      return;
    }

    const order = await checkout(payment, deliveryMode, 0);
    message.success(`Заказ ${order.id} создан на сумму ${order.total.toLocaleString('ru-RU')} ₽`);
    setOpen(false);
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger ?? <Button icon={<ShoppingCartOutlined />}>Корзина</Button>}</span>
      <Drawer title="Корзина и оплата" open={open} onClose={() => setOpen(false)} width={500}>
        <List
          dataSource={cart}
          locale={{ emptyText: <Empty description="В корзине пока нет товаров" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="remove" icon={<DeleteOutlined />} danger type="text" onClick={() => removeCartItem(item.id)} />,
              ]}
            >
              <Flex vertical style={{ width: '100%' }} gap={8}>
                <Typography.Text strong>{item.lotTitle}</Typography.Text>
                <Typography.Text type="secondary">{item.sellerName}</Typography.Text>
                <Space>
                  <InputNumber min={1} value={item.quantity} onChange={(val) => updateQuantity(item.id, Number(val ?? 1))} />
                  <Typography.Text>{item.subtotal.toLocaleString('ru-RU')} ₽</Typography.Text>
                </Space>
              </Flex>
            </List.Item>
          )}
        />

        <Divider />

        <Typography.Text strong>Способ оплаты</Typography.Text>
        <Radio.Group
          value={payment}
          onChange={(e) => setPayment(e.target.value)}
          options={[
            { value: 'card', label: 'Банковская карта' },
            { value: 'sbp', label: 'СБП' },
            { value: 'invoice', label: 'Счет для юрлица' },
          ]}
          style={{ display: 'block', margin: '10px 0 18px' }}
        />

        <Typography.Text strong>Доставка</Typography.Text>
        <Radio.Group
          value={deliveryMode}
          onChange={(e) => setDeliveryMode(e.target.value as DeliveryMode)}
          options={[
            { value: 'pickup', label: 'Самовывоз' },
            { value: 'seller_delivery', label: 'Доставка продавцом' },
            { value: 'partner_delivery', label: 'Через партнера' },
          ]}
          style={{ display: 'block', margin: '10px 0 12px' }}
        />

        {deliveryMode !== 'pickup' && (
          <Typography.Paragraph type="secondary">Стоимость доставки согласуется отдельно после создания сделки.</Typography.Paragraph>
        )}

        <Flex justify="space-between" align="center">
          <Typography.Title level={4} style={{ margin: 0 }}>Итого: {total.toLocaleString('ru-RU')} ₽</Typography.Title>
          <Button type="primary" onClick={handleCheckout}>Оформить</Button>
        </Flex>
      </Drawer>
    </>
  );
}
