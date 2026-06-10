import { apiClient } from './apiClient';

export interface PortalUserDto {
  id: string;
  email: string;
  displayName: string;
  role: string;
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

export interface GrainLotDto {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  region: string;
  description: string;
  price: number;
  coverImageUrl?: string | null;
  createdAt: string;
  grainType: string;
  grade: string;
  volumeTons: number;
  pricePerTon: number;
  qualityScore: number;
  hasOwnTransport: boolean;
  auctionEnabled: boolean;
  mercuryCertificate: string;
  declarationOfConformity: string;
  storageContract: string;
}

export interface EquipmentLotDto {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  region: string;
  description: string;
  price: number;
  coverImageUrl?: string | null;
  createdAt: string;
  brand: string;
  year: number;
  condition: string;
}

export interface CartItemDto {
  id: string;
  lotId: string;
  category: string;
  lotTitle: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderItemDto {
  id: string;
  lotId: string;
  category: string;
  lotTitle: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDto {
  id: string;
  userId: string;
  items: OrderItemDto[];
  paymentMethod: string;
  deliveryMode: string;
  deliveryPrice: number;
  total: number;
  createdAt: string;
  status: string;
}

export interface ForumTopicDto {
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
}

export interface ForumReplyDto {
  id: string;
  topicId: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  message: string;
  viewed: boolean;
  createdAt: string;
}

export interface SellerApplicationDto {
  id: string;
  userId: string;
  inn: string;
  ogrn: string;
  companyName: string;
  docPhotoUrl: string;
  status: string;
  submittedAt: string;
}

export interface SubscriptionDto {
  userId: string;
  isActive: boolean;
  plan: string | null;
  expiresAt: string | null;
}

export interface NewsArticleDto {
  id: string;
  section: string;
  title: string;
  lead: string;
  date: string;
  country: string;
  culture: string;
  region: string;
  type: string;
  imageUrl?: string | null;
}

export interface PriceRecordDto {
  id: string;
  culture: string;
  region: string;
  day: number;
  weekChange: number;
}

export interface AnalyticsPointDto {
  month: string;
  ndvi: number;
  ssi: number;
  priceForecast: number;
  demand: number;
  supply: number;
}

export interface DeliveryQuoteDto {
  distanceKm: number;
  volume: number;
  mode: string;
  price: number;
  etaDays: number;
}

export interface ReferenceCatalogItemDto {
  id: string;
  category: string;
  slug: string;
  title: string;
  region: string;
  summary: string;
  details: string;
  contacts: string;
  status: string;
  highlights: string[];
}

export interface PortalSnapshotDto {
  users: PortalUserDto[];
  currentUserId: string;
  grainLots: GrainLotDto[];
  equipmentLots: EquipmentLotDto[];
  cart: CartItemDto[];
  orders: OrderDto[];
  forumTopics: ForumTopicDto[];
  forumReplies: ForumReplyDto[];
  notifications: NotificationDto[];
  sellerApplications: SellerApplicationDto[];
  subscription: SubscriptionDto;
  news: NewsArticleDto[];
  prices: PriceRecordDto[];
  analytics: AnalyticsPointDto[];
  sampleDeliveryQuote: DeliveryQuoteDto;
}

export const portalApi = {
  getSnapshot: () => apiClient.get<PortalSnapshotDto>('/api/portal/snapshot'),
  getReferences: (category: string) => apiClient.get<ReferenceCatalogItemDto[]>(`/api/reference/${category}`),
  getLot: (lotId: string) => apiClient.get<Record<string, unknown> | null>(`/api/marketplace/lots/${lotId}`),
  login: (email: string, password: string) => apiClient.post<{ userId: string; email: string; displayName: string; role: string; token: string }>('/api/auth/login', { email, password }),
  register: (payload: { email: string; password: string; displayName: string; region: string; farmType: string; inn?: string; ogrn?: string }) =>
    apiClient.post<{ userId: string; email: string; displayName: string; role: string; token: string }>('/api/auth/register', payload),
  cartAdd: (payload: { lotId: string; quantity: number }) => apiClient.post<void>('/api/marketplace/cart', payload),
  cartUpdate: (itemId: string, quantity: number) => apiClient.patch<void>(`/api/marketplace/cart/${itemId}`, { quantity }),
  cartRemove: (itemId: string) => apiClient.del<void>(`/api/marketplace/cart/${itemId}`),
  checkout: (payload: { paymentMethod: string; deliveryMode: string; deliveryPrice: number }) => apiClient.post<OrderDto>('/api/marketplace/checkout', payload),
  createGrainLot: (payload: Record<string, unknown>) => apiClient.post<string>('/api/marketplace/grain', payload),
  createEquipmentLot: (payload: Record<string, unknown>) => apiClient.post<string>('/api/marketplace/equipment', payload),
  createTopic: (payload: Record<string, unknown>) => apiClient.post<string>('/api/forum/topics', payload),
  createReply: (payload: Record<string, unknown>) => apiClient.post<string>('/api/forum/replies', payload),
  submitSellerApplication: (payload: Record<string, unknown>) => apiClient.post('/api/seller-applications', payload),
  approveSellerApplication: (applicationId: string) => apiClient.patch<void>(`/api/seller-applications/${applicationId}/approve`, {}),
  markNotificationsRead: () => apiClient.post<void>('/api/notifications/mark-viewed'),
  activateSubscription: (payload: { plan: string }) => apiClient.post<SubscriptionDto>('/api/subscriptions/activate', payload),
  getSubscription: () => apiClient.get<SubscriptionDto>('/api/subscriptions'),
  getProfile: () => apiClient.get<PortalUserDto>('/api/profile/me'),
  updateProfile: (payload: Record<string, unknown>) => apiClient.put<PortalUserDto>('/api/profile/me', payload),
  getAdminStats: () => apiClient.get<Record<string, number>>('/api/admin/stats'),
  quote: (payload: { distanceKm: number; volume: number; mode: string }) => apiClient.post<DeliveryQuoteDto>('/api/logistics/quote', payload),
  mediaUrl: (objectKey: string) => `/api/media/${objectKey.replace(/^\/+/, '')}`,
};
