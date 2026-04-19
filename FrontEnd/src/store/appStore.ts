import { create } from 'zustand';
import {
  CartItem,
  DeliveryMode,
  EquipmentLot,
  ForumPost,
  ForumReply,
  GrainLot,
  NotificationItem,
  Order,
  PaymentMethod,
  SellerApplication,
  SubscriptionState,
  UserProfile,
} from '../types/domain';
import { userService } from '../services/userService';
import { marketplaceService } from '../services/marketplaceService';
import { cartService } from '../services/cartService';
import { forumService } from '../services/forumService';
import { notificationService } from '../services/notificationService';
import { sellerService } from '../services/sellerService';
import { subscriptionService } from '../services/subscriptionService';
import { logisticsService } from '../services/logisticsService';

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

  loadAll: () => void;
  setCurrentUser: (userId: string) => void;
  addToCart: (lot: GrainLot | EquipmentLot) => void;
  updateCartQuantity: (itemId: string, quantity: number) => void;
  removeCartItem: (itemId: string) => void;
  checkout: (payment: PaymentMethod, deliveryMode: DeliveryMode, deliveryPrice: number) => Order;

  submitSellerApplication: (payload: Omit<SellerApplication, 'id' | 'status' | 'submittedAt'>) => void;
  approveApplication: (applicationId: string) => void;

  addGrainLot: (payload: Omit<GrainLot, 'id' | 'createdAt'>) => void;
  addEquipmentLot: (payload: Omit<EquipmentLot, 'id' | 'createdAt'>) => void;

  addPost: (payload: Omit<ForumPost, 'id' | 'createdAt'>) => void;
  addReply: (payload: Omit<ForumReply, 'id' | 'createdAt'>) => void;

  activateSubscription: (plan: 'monthly' | 'yearly') => void;
  calculateDelivery: (distance: number, volume: number, mode: DeliveryMode) => number;
  markNotificationsRead: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  users: [],
  currentUserId: 'u_buyer_1',
  grainLots: [],
  equipmentLots: [],
  cart: [],
  orders: [],
  posts: [],
  replies: [],
  notifications: [],
  sellerApplications: [],
  subscription: { isActive: false, plan: null, expiresAt: null },

  loadAll: () => {
    const state = get();
    const users = userService.list();
    const grainLots = marketplaceService.getGrainLots();
    const equipmentLots = marketplaceService.getEquipmentLots();
    const cart = cartService.getCart(state.currentUserId);
    const orders = cartService.getOrders(state.currentUserId);
    const posts = forumService.getPosts();
    const replies = posts.flatMap((p) => forumService.getReplies(p.id));
    const notifications = notificationService.list(state.currentUserId);
    const sellerApplications = sellerService.getApplications();
    const subscription = subscriptionService.getSubscription(state.currentUserId);

    set({
      users,
      grainLots,
      equipmentLots,
      cart,
      orders,
      posts,
      replies,
      notifications,
      sellerApplications,
      subscription,
    });
  },

  setCurrentUser: (userId) => {
    set({ currentUserId: userId });
    get().loadAll();
  },

  addToCart: (lot) => {
    cartService.addToCart(get().currentUserId, lot);
    set({ cart: cartService.getCart(get().currentUserId) });
  },

  updateCartQuantity: (itemId, quantity) => {
    const next = cartService.updateQuantity(get().currentUserId, itemId, quantity);
    set({ cart: next });
  },

  removeCartItem: (itemId) => {
    const next = cartService.removeItem(get().currentUserId, itemId);
    set({ cart: next });
  },

  checkout: (payment, deliveryMode, deliveryPrice) => {
    const order = cartService.checkout(get().currentUserId, payment, deliveryMode, deliveryPrice);
    get().loadAll();
    return order;
  },

  submitSellerApplication: (payload) => {
    sellerService.submitApplication(payload);
    get().loadAll();
  },

  approveApplication: (applicationId) => {
    sellerService.approveApplication(applicationId);
    get().loadAll();
  },

  addGrainLot: (payload) => {
    marketplaceService.addGrainLot(payload);
    notificationService.push(payload.sellerId, `Лот "${payload.title}" опубликован.`);
    get().loadAll();
  },

  addEquipmentLot: (payload) => {
    marketplaceService.addEquipmentLot(payload);
    notificationService.push(payload.sellerId, `Объявление "${payload.title}" опубликовано.`);
    get().loadAll();
  },

  addPost: (payload) => {
    forumService.addPost(payload);
    get().loadAll();
  },

  addReply: (payload) => {
    forumService.addReply(payload);
    get().loadAll();
  },

  activateSubscription: (plan) => {
    subscriptionService.activateSubscription(get().currentUserId, plan);
    get().loadAll();
  },

  calculateDelivery: (distance, volume, mode) => logisticsService.calculate(distance, volume, mode).price,

  markNotificationsRead: () => {
    notificationService.markAllViewed(get().currentUserId);
    get().loadAll();
  },
}));


