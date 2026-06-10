import { create } from 'zustand';
import {
  CartItem,
  DeliveryMode,
  EquipmentLot,
  ForumReply,
  ForumPost,
  NewsArticle,
  GrainLot,
  NotificationItem,
  Order,
  PaymentMethod,
  PriceRecord,
  SellerApplication,
  SubscriptionState,
  UserProfile,
} from '../types/domain';
import { portalApi } from '../services/portalApi';
import { clearSession, setSession } from '../services/session';

interface AppState {
  users: UserProfile[];
  currentUserId: string;
  grainLots: GrainLot[];
  equipmentLots: EquipmentLot[];
  news: NewsArticle[];
  prices: PriceRecord[];
  analytics: Array<{ month: string; ndvi: number; ssi: number; priceForecast: number; demand: number; supply: number }>;
  cart: CartItem[];
  orders: Order[];
  posts: ForumPost[];
  replies: ForumReply[];
  notifications: NotificationItem[];
  sellerApplications: SellerApplication[];
  subscription: SubscriptionState;
  referenceCatalogs: Record<string, Array<{ id: string; slug: string; title: string; summary: string; region: string; details: string; contacts: string; status: string; highlights: string[] }>>;

  loadAll: () => Promise<void>;
  setCurrentUser: (userId: string) => Promise<void>;
  addToCart: (lot: GrainLot | EquipmentLot) => Promise<void>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  checkout: (payment: PaymentMethod, deliveryMode: DeliveryMode, deliveryPrice: number) => Promise<Order>;
  submitSellerApplication: (payload: Omit<SellerApplication, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
  approveApplication: (applicationId: string) => Promise<void>;
  addGrainLot: (payload: Omit<GrainLot, 'id' | 'createdAt'>) => Promise<void>;
  addEquipmentLot: (payload: Omit<EquipmentLot, 'id' | 'createdAt'>) => Promise<void>;
  addPost: (payload: Omit<ForumPost, 'id' | 'createdAt'>) => Promise<void>;
  addReply: (payload: Omit<ForumReply, 'id' | 'createdAt'>) => Promise<void>;
  activateSubscription: (plan: 'monthly' | 'yearly') => Promise<void>;
  calculateDelivery: (distance: number, volume: number, mode: DeliveryMode) => number;
  markNotificationsRead: () => Promise<void>;
}

const referenceCategories = ['countries', 'cultures', 'organizations', 'routes', 'rail-tariffs', 'duties', 'exchange'] as const;

function normalizeRole(role: string): 'buyer' | 'seller' {
  return role.toLowerCase() === 'seller' ? 'seller' : 'buyer';
}

function normalizeGrainType(value: string): GrainLot['grainType'] {
  switch (value.toLowerCase()) {
    case 'barley':
      return 'Ячмень';
    case 'corn':
      return 'Кукуруза';
    case 'rye':
      return 'Рожь';
    case 'oat':
      return 'Овес';
    default:
      return 'Пшеница';
  }
}

function normalizeEquipmentCondition(value: string): EquipmentLot['condition'] {
  return value.toLowerCase() === 'new' ? 'new' : 'used';
}

function normalizePaymentMethod(value: string): PaymentMethod {
  switch (value.toLowerCase()) {
    case 'card':
      return 'card';
    case 'sbp':
      return 'sbp';
    default:
      return 'invoice';
  }
}

function normalizeDeliveryMode(value: string): DeliveryMode {
  switch (value.toLowerCase()) {
    case 'pickup':
      return 'pickup';
    case 'partnerdelivery':
    case 'partner_delivery':
      return 'partner_delivery';
    default:
      return 'seller_delivery';
  }
}

function normalizeOrderStatus(value: string): Order['status'] {
  switch (value.toLowerCase()) {
    case 'paid':
      return 'paid';
    case 'processing':
      return 'processing';
    default:
      return 'created';
  }
}

function mapUser(user: { id: string; email: string; displayName: string; role: string; region: string; farmType: string; inn?: string | null; ogrn?: string | null; isVerifiedSeller: boolean; sellerVerificationStatus: string }): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.displayName,
    role: normalizeRole(user.role),
    region: user.region,
    farmType: user.farmType,
    inn: user.inn ?? undefined,
    ogrn: user.ogrn ?? undefined,
    isVerifiedSeller: user.isVerifiedSeller,
    sellerVerificationStatus: user.sellerVerificationStatus,
  };
}

function mapGrainLot(lot: {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  grainType: string;
  grade: string;
  volumeTons: number;
  pricePerTon: number;
  region: string;
  qualityScore: number;
  description: string;
  hasOwnTransport: boolean;
  auctionEnabled: boolean;
  mercuryCertificate: string;
  declarationOfConformity: string;
  storageContract: string;
  price: number;
  coverImageUrl?: string | null;
  createdAt: string;
}): GrainLot {
  return {
    id: lot.id,
    category: 'grain',
    sellerId: lot.sellerId,
    sellerName: lot.sellerName,
    title: lot.title,
    grainType: normalizeGrainType(lot.grainType),
    grade: lot.grade,
    volumeTons: lot.volumeTons,
    pricePerTon: lot.pricePerTon,
    region: lot.region,
    qualityScore: lot.qualityScore,
    description: lot.description,
    hasOwnTransport: lot.hasOwnTransport,
    auctionEnabled: lot.auctionEnabled,
    mercuryCertificate: lot.mercuryCertificate,
    declarationOfConformity: lot.declarationOfConformity,
    storageContract: lot.storageContract,
    coverImageUrl: lot.coverImageUrl ?? undefined,
    createdAt: lot.createdAt,
  };
}

function mapEquipmentLot(lot: {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  brand: string;
  year: number;
  condition: string;
  price: number;
  region: string;
  description: string;
  coverImageUrl?: string | null;
  createdAt: string;
}): EquipmentLot {
  return {
    id: lot.id,
    category: 'equipment',
    sellerId: lot.sellerId,
    sellerName: lot.sellerName,
    title: lot.title,
    brand: lot.brand,
    year: lot.year,
    condition: normalizeEquipmentCondition(lot.condition),
    price: lot.price,
    region: lot.region,
    description: lot.description,
    coverImageUrl: lot.coverImageUrl ?? undefined,
    createdAt: lot.createdAt,
  };
}

function mapCartItem(item: { id: string; lotId: string; category: string; lotTitle: string; sellerName: string; unitPrice: number; quantity: number; subtotal: number }): CartItem {
  return {
    id: item.id,
    lotId: item.lotId,
    category: item.category.toLowerCase() as CartItem['category'],
    quantity: item.quantity,
    lotTitle: item.lotTitle,
    sellerName: item.sellerName,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
  };
}

function mapOrder(order: {
  id: string;
  userId: string;
  items: Array<{ id: string; lotId: string; category: string; lotTitle: string; sellerName: string; unitPrice: number; quantity: number; subtotal: number }>;
  paymentMethod: string;
  deliveryMode: string;
  deliveryPrice: number;
  total: number;
  createdAt: string;
  status: string;
}): Order {
  return {
    id: order.id,
    userId: order.userId,
    items: order.items.map(mapCartItem),
    paymentMethod: normalizePaymentMethod(order.paymentMethod),
    deliveryMode: normalizeDeliveryMode(order.deliveryMode),
    deliveryPrice: order.deliveryPrice,
    total: order.total,
    createdAt: order.createdAt,
    status: normalizeOrderStatus(order.status),
  };
}

function mapForumSection(section: string): ForumPost['section'] {
  if (section === 'Agrology') return 'Агрономия';
  if (section === 'Equipment') return 'Техника';
  return 'Торговля';
}

function mapForumTopic(topic: {
  id: string;
  authorId: string;
  authorName: string;
  section: string;
  title: string;
  content: string;
  tags: string[];
  mediaUrl?: string | null;
  verifiedAnswer?: string | null;
  createdAt: string;
}): ForumPost {
  return {
    id: topic.id,
    section: mapForumSection(topic.section),
    authorId: topic.authorId,
    authorName: topic.authorName,
    title: topic.title,
    content: topic.content,
    tags: topic.tags,
    mediaUrl: topic.mediaUrl ?? undefined,
    createdAt: topic.createdAt,
    verifiedAnswer: topic.verifiedAnswer ?? undefined,
  };
}

function mapForumReply(reply: { id: string; topicId: string; authorName: string; rating: number; content: string; createdAt: string }): ForumReply {
  return {
    id: reply.id,
    postId: reply.topicId,
    authorName: reply.authorName,
    rating: reply.rating,
    content: reply.content,
    createdAt: reply.createdAt,
  };
}

function mapNotification(notification: { id: string; userId: string; message: string; viewed: boolean; createdAt: string }): NotificationItem {
  return {
    id: notification.id,
    userId: notification.userId,
    message: notification.message,
    viewed: notification.viewed,
    createdAt: notification.createdAt,
  };
}

function mapSellerApplication(app: { id: string; userId: string; inn: string; ogrn: string; companyName: string; docPhotoUrl: string; status: string; submittedAt: string }): SellerApplication {
  return {
    id: app.id,
    userId: app.userId,
    inn: app.inn,
    ogrn: app.ogrn,
    companyName: app.companyName,
    docPhotoUrl: app.docPhotoUrl,
    status: app.status.toLowerCase() as SellerApplication['status'],
    submittedAt: app.submittedAt,
  };
}

function mapSubscription(subscription: { userId: string; isActive: boolean; plan: string | null; expiresAt: string | null }): SubscriptionState {
  return {
    isActive: subscription.isActive,
    plan: subscription.plan?.toLowerCase() as SubscriptionState['plan'],
    expiresAt: subscription.expiresAt,
  };
}

function mapNewsArticle(article: { id: string; section: string; title: string; lead: string; date: string; country: string; culture: string; region: string; type: string; imageUrl?: string | null }): NewsArticle {
  const section = article.section === 'Мировые новости' ? 'Новости СНГ' : article.section;
  return {
    id: article.id,
    section,
    title: article.title,
    lead: article.lead,
    date: article.date,
    country: article.country,
    culture: article.culture,
    region: article.region,
    type: article.type,
    imageUrl: article.imageUrl ?? undefined,
  };
}

function mapPriceRecord(record: { id: string; culture: string; region: string; day: number; weekChange: number }): PriceRecord {
  return {
    id: record.id,
    culture: record.culture,
    region: record.region,
    day: Number(record.day),
    weekChange: Number(record.weekChange),
  };
}

function mapReferenceCatalogItem(item: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  region: string;
  details: string;
  contacts: string;
  status: string;
  highlights: string[];
}) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    region: item.region,
    details: item.details,
    contacts: item.contacts,
    status: item.status,
    highlights: item.highlights,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  users: [],
  currentUserId: '',
  grainLots: [],
  equipmentLots: [],
  news: [],
  prices: [],
  analytics: [],
  cart: [],
  orders: [],
  posts: [],
  replies: [],
  notifications: [],
  sellerApplications: [],
  subscription: { isActive: false, plan: null, expiresAt: null },
  referenceCatalogs: {},

  loadAll: async () => {
    const [snapshot, ...references] = await Promise.all([
      portalApi.getSnapshot(),
      ...referenceCategories.map((category) => portalApi.getReferences(category)),
    ]);

    const users = snapshot.users.map(mapUser);
    const currentUserId = snapshot.currentUserId && snapshot.currentUserId !== '00000000-0000-0000-0000-000000000000'
      ? snapshot.currentUserId
      : '';

    setSession({ userId: currentUserId || null });

    set({
      users,
      currentUserId,
      grainLots: snapshot.grainLots.map(mapGrainLot),
      equipmentLots: snapshot.equipmentLots.map(mapEquipmentLot),
      news: snapshot.news.map(mapNewsArticle),
      prices: snapshot.prices.map(mapPriceRecord),
      analytics: snapshot.analytics.map((point) => ({
        month: point.month,
        ndvi: Number(point.ndvi),
        ssi: Number(point.ssi),
        priceForecast: Number(point.priceForecast),
        demand: Number(point.demand),
        supply: Number(point.supply),
      })),
      cart: snapshot.cart.map(mapCartItem),
      orders: snapshot.orders.map(mapOrder),
      posts: snapshot.forumTopics.map(mapForumTopic),
      replies: snapshot.forumReplies.map(mapForumReply),
      notifications: snapshot.notifications.map(mapNotification),
      sellerApplications: snapshot.sellerApplications.map(mapSellerApplication),
      subscription: mapSubscription(snapshot.subscription),
      referenceCatalogs: Object.fromEntries(referenceCategories.map((category, index) => [category, references[index].map(mapReferenceCatalogItem)])),
    });
  },

  setCurrentUser: async (userId) => {
    setSession({ userId });
    set({ currentUserId: userId });
    await get().loadAll();
  },

  addToCart: async (lot) => {
    await portalApi.cartAdd({ lotId: lot.id, quantity: 1 });
    await get().loadAll();
  },

  updateCartQuantity: async (itemId, quantity) => {
    await portalApi.cartUpdate(itemId, quantity);
    await get().loadAll();
  },

  removeCartItem: async (itemId) => {
    await portalApi.cartRemove(itemId);
    await get().loadAll();
  },

  checkout: async (payment, deliveryMode, deliveryPrice) => {
    const order = await portalApi.checkout({
      paymentMethod: payment,
      deliveryMode,
      deliveryPrice,
    });
    await get().loadAll();
    return mapOrder(order);
  },

  submitSellerApplication: async (payload) => {
    await portalApi.submitSellerApplication(payload);
    await get().loadAll();
  },

  approveApplication: async (applicationId) => {
    await portalApi.approveSellerApplication(applicationId);
    await get().loadAll();
  },

  addGrainLot: async (payload) => {
    await portalApi.createGrainLot({
      ...payload,
      createdAt: undefined,
    });
    await get().loadAll();
  },

  addEquipmentLot: async (payload) => {
    await portalApi.createEquipmentLot({
      ...payload,
      createdAt: undefined,
    });
    await get().loadAll();
  },

  addPost: async (payload) => {
    await portalApi.createTopic(payload);
    await get().loadAll();
  },

  addReply: async (payload) => {
    await portalApi.createReply(payload);
    await get().loadAll();
  },

  activateSubscription: async (plan) => {
    await portalApi.activateSubscription({ plan });
    await get().loadAll();
  },

  calculateDelivery: (distance, volume, mode) => {
    void distance;
    void volume;
    void mode;
    return 0;
  },

  markNotificationsRead: async () => {
    await portalApi.markNotificationsRead();
    await get().loadAll();
  },
}));

export function resetAppSession(): void {
  clearSession();
}
