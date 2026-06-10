import { create } from 'zustand';
import { AnalyticsPoint, CartItem, DeliveryMode, EquipmentLot, ForumPost, ForumReply, GrainLot, NotificationItem, Order, PaymentMethod, SellerApplication, SubscriptionState, UserProfile } from '../types/domain';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { portalApi } from '../services/portalApi';
import { defaultSubscription, seedEquipmentLots, seedForumPosts, seedForumReplies, seedGrainLots, seedNotifications, seedSellerApplications, seedUsers } from '../data/seedData';

interface AppState {
  users: UserProfile[];
  currentUserId: string;
  grainLots: GrainLot[];
  equipmentLots: EquipmentLot[];
  cart: CartItem[];
  orders: Order[];
  posts: ForumPost[];
  replies: ForumReply[];
  notifications: NotificationItem[];
  sellerApplications: SellerApplication[];
  subscription: SubscriptionState;
  analytics: AnalyticsPoint[];

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
  updateProfile: (payload: {
    displayName: string;
    region: string;
    farmType: string;
    inn?: string;
    ogrn?: string;
    preferredLanguage: 'ru' | 'en';
    twoFactorEnabled: boolean;
    emailNotificationsEnabled: boolean;
  }) => Promise<void>;
}

function getStoredCurrentUserId(): string {
  return localStorage.getItem(STORAGE_KEYS.currentUserId) ?? '';
}

function mapSection(section: string): ForumPost['section'] {
  return section === 'Agrology' ? 'Агрономия' : section === 'Equipment' ? 'Техника' : 'Торговля';
}

function mapForumPost(post: any): ForumPost {
  return {
    id: post.id,
    section: mapSection(post.section),
    authorId: post.authorId,
    authorName: post.authorName,
    title: post.title,
    content: post.content,
    tags: post.tags ?? [],
    mediaUrl: post.mediaUrl ?? undefined,
    createdAt: post.createdAt,
    verifiedAnswer: post.verifiedAnswer ?? undefined,
  };
}

function mapForumReply(reply: any): ForumReply {
  return {
    id: reply.id,
    postId: reply.topicId ?? reply.postId,
    authorName: reply.authorName,
    rating: reply.rating,
    content: reply.content,
    createdAt: reply.createdAt,
  };
}

function mapSubscription(subscription: any): SubscriptionState {
  return {
    isActive: subscription.isActive,
    plan: subscription.plan ? String(subscription.plan).toLowerCase() as 'monthly' | 'yearly' : null,
    expiresAt: subscription.expiresAt ?? subscription.expiresAtUtc ?? null,
  };
}

function mapUser(user: any): UserProfile {
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
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
  };
}

function mapApplication(application: any): SellerApplication {
  return {
    id: application.id,
    userId: application.userId,
    inn: application.inn,
    ogrn: application.ogrn,
    companyName: application.companyName,
    docPhotoUrl: application.docPhotoUrl,
    status: String(application.status).toLowerCase() as SellerApplication['status'],
    submittedAt: application.submittedAt ?? application.submittedAtUtc,
  };
}

function mapCartItem(item: any): CartItem {
  return {
    id: item.id,
    lotId: item.lotId,
    category: String(item.category).toLowerCase() as CartItem['category'],
    quantity: item.quantity,
    lotTitle: item.lotTitle,
    sellerName: item.sellerName,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
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

export const useAppStore = create<AppState>((set, get) => ({
  users: [],
  currentUserId: getStoredCurrentUserId(),
  grainLots: [],
  equipmentLots: [],
  cart: [],
  orders: [],
  posts: [],
  replies: [],
  notifications: [],
  sellerApplications: [],
  subscription: { isActive: false, plan: null, expiresAt: null },
  analytics: [],

  loadAll: async () => {
    const state = get();
    set({
      users: seedUsers,
      currentUserId: state.currentUserId,
      grainLots: seedGrainLots,
      equipmentLots: seedEquipmentLots,
      cart: [],
      orders: [],
      posts: seedForumPosts,
      replies: seedForumReplies,
      notifications: state.currentUserId ? seedNotifications.filter((item) => item.userId === state.currentUserId) : [],
      sellerApplications: seedSellerApplications,
      subscription: defaultSubscription,
      analytics: [],
    });

    try {
      const snapshot = await portalApi.hydrate(state.currentUserId || undefined);
      const currentUserId = snapshot.currentUserId ? String(snapshot.currentUserId) : '';

      set({
        users: snapshot.users.map(mapUser),
        currentUserId,
        grainLots: snapshot.grainLots,
        equipmentLots: snapshot.equipmentLots,
        cart: snapshot.cart.map(mapCartItem),
        orders: snapshot.orders.map(mapOrder),
        posts: snapshot.forumTopics.map(mapForumPost),
        replies: snapshot.forumReplies.map(mapForumReply),
        notifications: snapshot.notifications,
        sellerApplications: snapshot.sellerApplications.map(mapApplication),
        subscription: mapSubscription(snapshot.subscription),
        analytics: snapshot.analytics,
      });
    } catch {
      // Keep the local fallback when the backend is unavailable.
    }
  },

  setCurrentUser: async (userId) => {
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.currentUserId, userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUserId);
    }
    set({ currentUserId: userId });
    await get().loadAll();
  },

  addToCart: async (lot) => {
    await portalApi.addToCart(get().currentUserId, lot.id);
    await get().loadAll();
  },

  updateCartQuantity: async (itemId, quantity) => {
    await portalApi.updateCartQuantity(get().currentUserId, itemId, quantity);
    await get().loadAll();
  },

  removeCartItem: async (itemId) => {
    await portalApi.removeCartItem(get().currentUserId, itemId);
    await get().loadAll();
  },

  checkout: async (payment, deliveryMode, deliveryPrice) => {
    const order = await portalApi.checkout(get().currentUserId, payment, deliveryMode, deliveryPrice);
    await get().loadAll();
    return order;
  },

  submitSellerApplication: async (_payload) => {
    await get().loadAll();
  },

  approveApplication: async (_applicationId) => {
    await get().loadAll();
  },

  addGrainLot: async (_payload) => {
    await get().loadAll();
  },

  addEquipmentLot: async (_payload) => {
    await get().loadAll();
  },

  addPost: async (payload) => {
    await portalApi.submitPost(get().currentUserId, payload);
    await get().loadAll();
  },

  addReply: async (payload) => {
    await portalApi.submitReply(get().currentUserId, payload);
    await get().loadAll();
  },

  activateSubscription: async (plan) => {
    await portalApi.activateSubscription(get().currentUserId, plan);
    await get().loadAll();
  },

  calculateDelivery: (distance, volume, mode) => {
    // Keep a fast local estimate for UI responsiveness; backend quote is available via API.
    void portalApi.calculateDelivery(distance, volume, mode);
    const base = mode === 'pickup' ? 0 : Math.round((distance * 22 + volume * 8) * (mode === 'partner_delivery' ? 1.18 : 1));
    return base;
  },

  markNotificationsRead: async () => {
    await portalApi.markNotificationsRead(get().currentUserId);
    await get().loadAll();
  },

  updateProfile: async (payload) => {
    const updated = await portalApi.updateProfile(payload, get().currentUserId);
    set((state) => ({
      users: state.users.map((user) => (user.id === updated.id ? updated : user)),
    }));
    await get().loadAll();
  },
}));
