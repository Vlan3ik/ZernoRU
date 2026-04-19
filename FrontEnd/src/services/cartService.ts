import { CartItem, DeliveryMode, MarketplaceLot, Order, PaymentMethod } from '../types/domain';
import { getStorage, setStorage, uid } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface CartMap {
  [userId: string]: CartItem[];
}

export const cartService = {
  getCart(userId: string): CartItem[] {
    const carts = getStorage<CartMap>(STORAGE_KEYS.carts, {});
    return carts[userId] ?? [];
  },

  addToCart(userId: string, lot: MarketplaceLot): CartItem[] {
    const carts = getStorage<CartMap>(STORAGE_KEYS.carts, {});
    const cart = carts[userId] ?? [];
    const lotId = lot.id;
    const existing = cart.find((x) => x.lotId === lotId);

    const unitPrice = lot.category === 'grain' ? lot.pricePerTon : lot.price;
    if (existing) {
      existing.quantity += 1;
      existing.subtotal = existing.unitPrice * existing.quantity;
    } else {
      cart.push({
        id: uid('cart'),
        lotId,
        category: lot.category,
        quantity: 1,
        lotTitle: lot.title,
        sellerName: lot.sellerName,
        unitPrice,
        subtotal: unitPrice,
      });
    }

    carts[userId] = [...cart];
    setStorage(STORAGE_KEYS.carts, carts);
    return carts[userId];
  },

  updateQuantity(userId: string, itemId: string, quantity: number): CartItem[] {
    const carts = getStorage<CartMap>(STORAGE_KEYS.carts, {});
    const cart = (carts[userId] ?? []).map((item) =>
      item.id === itemId
        ? { ...item, quantity, subtotal: item.unitPrice * quantity }
        : item,
    );

    carts[userId] = cart.filter((item) => item.quantity > 0);
    setStorage(STORAGE_KEYS.carts, carts);
    return carts[userId];
  },

  removeItem(userId: string, itemId: string): CartItem[] {
    const carts = getStorage<CartMap>(STORAGE_KEYS.carts, {});
    carts[userId] = (carts[userId] ?? []).filter((x) => x.id !== itemId);
    setStorage(STORAGE_KEYS.carts, carts);
    return carts[userId];
  },

  checkout(
    userId: string,
    paymentMethod: PaymentMethod,
    deliveryMode: DeliveryMode,
    deliveryPrice: number,
  ): Order {
    const carts = getStorage<CartMap>(STORAGE_KEYS.carts, {});
    const cart = carts[userId] ?? [];
    const orderBase = cart.reduce((acc, item) => acc + item.subtotal, 0);

    const order: Order = {
      id: uid('order'),
      userId,
      items: cart,
      paymentMethod,
      deliveryMode,
      deliveryPrice,
      total: orderBase + deliveryPrice,
      createdAt: new Date().toISOString(),
      status: paymentMethod === 'invoice' ? 'processing' : 'paid',
    };

    const orders = getStorage<Order[]>(STORAGE_KEYS.orders, []);
    setStorage(STORAGE_KEYS.orders, [order, ...orders]);

    carts[userId] = [];
    setStorage(STORAGE_KEYS.carts, carts);

    return order;
  },

  getOrders(userId: string): Order[] {
    const orders = getStorage<Order[]>(STORAGE_KEYS.orders, []);
    return orders.filter((x) => x.userId === userId);
  },
};


