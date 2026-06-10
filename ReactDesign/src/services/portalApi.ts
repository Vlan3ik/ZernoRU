import { AnalyticsPoint, DeliveryMode, EquipmentLot, ForumPost, ForumReply, GrainLot, NotificationItem, Order, PaymentMethod, SellerApplication, SubscriptionState, UserProfile } from '../types/domain';
import { getAuthToken } from '../utils/session';
import { PriceRow, NewsItem, setPortalContent } from '../data/portalContent';
import { newsImageMap } from '../data/mediaAssets';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  role: 'Buyer' | 'Seller' | 'Admin';
  token: string;
}

interface PortalUserDto {
  id: string;
  email: string;
  displayName: string;
  role: 'Buyer' | 'Seller' | 'Admin';
  region: string;
  farmType: string;
  inn?: string | null;
  ogrn?: string | null;
  isVerifiedSeller: boolean;
  sellerVerificationStatus: string;
  preferredLanguage: string;
  twoFactorEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

interface PortalSnapshotDto {
  users: PortalUserDto[];
  currentUserId: string;
  grainLots: GrainLot[];
  equipmentLots: EquipmentLot[];
  cart: Array<{ id: string; lotId: string; category: 'grain' | 'equipment'; lotTitle: string; sellerName: string; unitPrice: number; quantity: number; subtotal: number }>;
  orders: Order[];
  forumTopics: ForumPost[];
  forumReplies: ForumReply[];
  notifications: NotificationItem[];
  sellerApplications: SellerApplication[];
  subscription: SubscriptionState;
  analytics: AnalyticsPoint[];
  news: Array<{ id: string; section: string; title: string; lead: string; date: string; country: string; culture: string; region: string; type: string; imageUrl?: string | null }>;
  prices: Array<{ id: string; culture: string; region: string; day: number; weekChange: number }>;
}

function getUserHeader(userId?: string): HeadersInit {
  return userId ? { 'X-User-Id': userId } : {};
}

async function request<T>(path: string, init?: RequestInit, userId?: string): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(getUserHeader(userId) as Record<string, string>),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function mapUser(user: PortalUserDto): UserProfile {
  return {
    id: user.id,
    name: user.displayName,
    role: user.role === 'Admin' ? 'admin' : user.role === 'Seller' ? 'seller' : 'buyer',
    region: user.region,
    farmType: user.farmType,
    inn: user.inn ?? undefined,
    ogrn: user.ogrn ?? undefined,
    isVerifiedSeller: user.isVerifiedSeller,
    preferredLanguage: user.preferredLanguage === 'en' ? 'en' : 'ru',
    twoFactorEnabled: user.twoFactorEnabled,
    emailNotificationsEnabled: user.emailNotificationsEnabled,
  };
}

function mapGrainLot(lot: GrainLot): GrainLot {
  return {
    ...lot,
    coverImageUrl: lot.coverImageUrl ?? undefined,
  };
}

function mapEquipmentLot(lot: EquipmentLot): EquipmentLot {
  return {
    ...lot,
    coverImageUrl: lot.coverImageUrl ?? undefined,
  };
}

function mapCartItem(item: any): any {
  return {
    ...item,
    category: String(item.category).toLowerCase(),
  };
}

function mapOrder(order: any): Order {
  return {
    id: order.id,
    userId: order.userId,
    items: (order.items ?? []).map(mapCartItem),
    paymentMethod: String(order.paymentMethod).toLowerCase() as PaymentMethod,
    deliveryMode: String(order.deliveryMode).toLowerCase() as DeliveryMode,
    deliveryPrice: order.deliveryPrice,
    total: order.total,
    createdAt: order.createdAt,
    status: String(order.status).toLowerCase() as Order['status'],
  };
}

function mapNews(item: PortalSnapshotDto['news'][number]): NewsItem {
  return {
    id: item.id,
    title: item.title,
    lead: item.lead,
    section: item.section,
    country: item.country,
    culture: item.culture,
    region: item.region,
    type: item.type as NewsItem['type'],
    date: item.date,
    source: 'Zerno API',
    imageUrl: item.imageUrl ?? newsImageMap[item.id] ?? undefined,
  };
}

function mapPrice(item: PortalSnapshotDto['prices'][number]): PriceRow {
  const portByCulture: Record<string, string> = {
    'Пшеница 3 класса': 'Новороссийск',
    'Пшеница 4 класса': 'Тамань',
    'Пшеница 5 класса': 'Нет',
    'Ячмень': 'Азов',
    'Кукуруза': 'Новороссийск',
  };

  const day = item.day;
  const week = Math.max(1, Math.round(day - item.weekChange * 120));
  const month = Math.max(1, Math.round(day - item.weekChange * 240));
  return {
    key: item.id,
    culture: item.culture,
    region: item.region,
    port: portByCulture[item.culture] ?? 'Нет',
    day,
    week,
    month,
  };
}

export const portalApi = {
  async snapshot(userId?: string): Promise<PortalSnapshotDto> {
    return request<PortalSnapshotDto>('/portal/snapshot', undefined, userId);
  },

  async hydrate(userId?: string): Promise<PortalSnapshotDto> {
    const snapshot = await this.snapshot(userId);
    setPortalContent({ news: snapshot.news.map(mapNews), prices: snapshot.prices.map(mapPrice) });
    return {
      ...snapshot,
      grainLots: snapshot.grainLots.map(mapGrainLot),
      equipmentLots: snapshot.equipmentLots.map(mapEquipmentLot),
    };
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(payload: {
    email: string;
    password: string;
    displayName: string;
    region: string;
    farmType: string;
    role: 'buyer' | 'seller' | 'admin';
    inn?: string;
    ogrn?: string;
  }): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        displayName: payload.displayName,
        region: payload.region,
        farmType: payload.farmType,
        role: payload.role,
        inn: payload.inn ?? null,
        ogrn: payload.ogrn ?? null,
      }),
    });
  },

  async getProfile(userId?: string): Promise<UserProfile> {
    const profile = await request<PortalUserDto>('/profile/me', undefined, userId);
    return mapUser(profile);
  },

  async updateProfile(payload: {
    displayName: string;
    region: string;
    farmType: string;
    inn?: string;
    ogrn?: string;
    preferredLanguage: 'ru' | 'en';
    twoFactorEnabled: boolean;
    emailNotificationsEnabled: boolean;
  }, userId?: string): Promise<UserProfile> {
    const profile = await request<PortalUserDto>('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }, userId);
    return mapUser(profile);
  },

  async addToCart(userId: string, lotId: string, quantity = 1): Promise<void> {
    await request<void>('/marketplace/cart', { method: 'POST', body: JSON.stringify({ lotId, quantity }) }, userId);
  },

  async updateCartQuantity(userId: string, itemId: string, quantity: number): Promise<void> {
    await request<void>(`/marketplace/cart/${itemId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) }, userId);
  },

  async removeCartItem(userId: string, itemId: string): Promise<void> {
    await request<void>(`/marketplace/cart/${itemId}`, { method: 'DELETE' }, userId);
  },

  async checkout(userId: string, paymentMethod: PaymentMethod, deliveryMode: DeliveryMode, deliveryPrice: number): Promise<Order> {
    const order = await request<Order>('/marketplace/checkout', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, deliveryMode, deliveryPrice }),
    }, userId);
    return mapOrder(order);
  },

  async submitPost(userId: string, payload: Omit<ForumPost, 'id' | 'createdAt'>): Promise<void> {
    await request<void>('/forum/topics', { method: 'POST', body: JSON.stringify(payload) }, userId);
  },

  async submitReply(userId: string, payload: Omit<ForumReply, 'id' | 'createdAt'>): Promise<void> {
    await request<void>('/forum/replies', { method: 'POST', body: JSON.stringify(payload) }, userId);
  },

  async activateSubscription(userId: string, plan: 'monthly' | 'yearly'): Promise<void> {
    await request<void>('/subscriptions/activate', { method: 'POST', body: JSON.stringify({ plan }) }, userId);
  },

  async markNotificationsRead(userId: string): Promise<void> {
    await request<void>('/notifications/mark-viewed', { method: 'POST' }, userId);
  },

  async calculateDelivery(distance: number, volume: number, mode: DeliveryMode): Promise<{ price: number }> {
    const payload = await request<{ price: number }>('/logistics/quote', { method: 'POST', body: JSON.stringify({ distanceKm: distance, volume, mode }) });
    return payload;
  },

  async getAdminStats(userId: string): Promise<{
    users: number;
    grainLots: number;
    equipmentLots: number;
    orders: number;
    notifications: number;
    sellerApplications: number;
    news: number;
    prices: number;
  }> {
    return request('/admin/stats', undefined, userId);
  },

  async syncContent(userId: string): Promise<void> {
    await request<void>('/admin/sync-content', { method: 'POST' }, userId);
  },
};

export function decodeSnapshotUsers(snapshot: PortalSnapshotDto): UserProfile[] {
  return snapshot.users.map(mapUser);
}
