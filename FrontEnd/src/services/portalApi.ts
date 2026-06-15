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

export interface AuctionSummaryDto {
  lotId: string;
  lotTitle: string;
  startingPrice: number;
  currentHighestBid: number;
  minimumStep: number;
  sellerName: string;
  startsAtUtc: string;
  endsAtUtc: string;
  status: string;
  bidsCount: number;
  leadingUserId?: string | null;
  leadingUserName?: string | null;
  winningUserId?: string | null;
  winningUserName?: string | null;
  winningBidId?: string | null;
  lastBidAtUtc?: string | null;
  isEnded: boolean;
}

export interface AuctionBidDto {
  id: string;
  auctionLotId: string;
  userId: string;
  userName: string;
  amount: number;
  createdAtUtc: string;
  isWinning: boolean;
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


export interface AnalyticsFiltersDto {
  culture?: string;
  className?: string;
  region?: string;
  basis?: string;
  period?: string;
  dataType?: string;
  risk?: string;
  type?: string;
}

export interface AnalyticsOptionsDto {
  cultures: string[];
  classes: string[];
  regions: string[];
  basis: string[];
  periods: string[];
  dataTypes: string[];
}

export interface AnalyticsPriceRowDto {
  id: string;
  culture: string;
  className: string;
  region: string;
  basis: string;
  price: number | null;
  changeRub: number | null;
  changePercent: number | null;
  updatedAt: string;
  source: string;
  minPrice: number;
  maxPrice: number;
  demand: string;
  supply: string;
  series: number[];
  trend: string;
}

export interface AnalyticsCultureCardDto {
  culture: string;
  className: string;
  price: number | null;
  changeRub: number | null;
  changePercent: number | null;
  trend: string;
  trendLabel: string;
  updatedAt: string;
  series: number[];
}

export interface AnalyticsRegionRowDto {
  id: string;
  region: string;
  culture: string;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  changeRub: number;
  demandActivity: string;
  supplyActivity: string;
}

export interface AnalyticsChartPointDto {
  date: string;
  average: number;
  min: number;
  max: number;
  trend: number;
}

export interface AnalyticsSummaryDto {
  title: string;
  text: string;
  items: string[];
  generatedAt: string;
}

export interface AnalyticsReviewDto {
  id: string;
  title: string;
  type: string;
  culture: string;
  region: string;
  description: string;
  date: string;
  access: string;
}

export interface AnalyticsMarketResponseDto {
  options: AnalyticsOptionsDto;
  cards: AnalyticsCultureCardDto[];
  priceRows: AnalyticsPriceRowDto[];
  regionRows: AnalyticsRegionRowDto[];
  chartSeries: AnalyticsChartPointDto[];
  summary: AnalyticsSummaryDto;
  reviews: AnalyticsReviewDto[];
  generatedAt: string;
}

export interface AnalyticsSignalOptionsDto {
  cultures: string[];
  regions: string[];
  types: string[];
  risks: string[];
}

export interface AnalyticsSignalRowDto {
  id: string;
  date: string;
  region: string;
  culture: string;
  phase: string;
  type: string;
  description: string;
  risk: string;
  riskLabel: string;
  priceImpact: string;
  status: string;
  source: string;
  horizon: string;
  confidence: string;
}

export interface AnalyticsRegionSignalDto {
  region: string;
  cultures: string[];
  risk: string;
  lastSignal: string;
  factors: string[];
  impact: string;
  relatedPricesPath: string;
}

export interface AnalyticsSignalImpactDto {
  id: string;
  signal: string;
  region: string;
  culture: string;
  supplyImpact: string;
  qualityImpact: string;
  priceImpact: string;
  horizon: string;
  confidence: string;
}

export interface AnalyticsSignalsResponseDto {
  options: AnalyticsSignalOptionsDto;
  signals: AnalyticsSignalRowDto[];
  regionDetails: AnalyticsRegionSignalDto[];
  impacts: AnalyticsSignalImpactDto[];
  generatedAt: string;
}

export interface AnalyticsTariffPlanDto {
  code: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  limits: string;
  action: string;
  accent: boolean;
}

export interface AnalyticsTariffsResponseDto {
  period: string;
  activeSubscriptions: number;
  users: number;
  plans: AnalyticsTariffPlanDto[];
  comparison: Array<Record<string, string>>;
}

export interface AnalyticsReportExampleDto {
  generatedAt: string;
  sections: Array<{ label: string; text: string }>;
  pricePreview: AnalyticsPriceRowDto[];
  chartPreview: AnalyticsChartPointDto[];
  indicators: AnalyticsPointDto[];
}

function buildAnalyticsQuery(filters: AnalyticsFiltersDto = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}


export interface AdminUserDto {
  id: string;
  email: string;
  displayName: string;
  region: string;
  farmType: string;
  role: string;
  subscription: string;
  isVerifiedSeller: boolean;
  createdAt: string;
}

export interface AdminLotDto {
  id: string;
  category: string;
  title: string;
  sellerName: string;
  region: string;
  price: number;
  isPublished: boolean;
  createdAt: string;
}

export interface AdminOrderDto {
  id: string;
  userName: string;
  status: string;
  total: number;
  createdAt: string;
  itemsCount: number;
}

export interface AdminNewsDto {
  id: string;
  section: string;
  title: string;
  lead: string;
  date: string;
  country: string;
  culture: string;
  region: string;
  type: string;
}

export interface AdminApplicationDto {
  id: string;
  companyName: string;
  inn: string;
  ogrn: string;
  status: string;
  submittedAt: string;
}

export interface AdminOverviewDto {
  stats: Record<string, number>;
  users: AdminUserDto[];
  lots: AdminLotDto[];
  orders: AdminOrderDto[];
  news: AdminNewsDto[];
  applications: AdminApplicationDto[];
  analytics: { activeSubscriptions: number; revenueForecast: number; publishedLots: number; pendingApplications: number };
}


export interface AdminWorkspaceDto {
  generatedAt: string;
  kpis: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  activity: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
  sellerApplications: Array<Record<string, unknown>>;
  lots: Array<Record<string, unknown>>;
  auctions: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  subscriptions: Array<Record<string, unknown>>;
  prices: Array<Record<string, unknown>>;
  duties: Array<Record<string, unknown>>;
  analyticsContent: Array<Record<string, unknown>>;
  analyticsSignals: Array<Record<string, unknown>>;
  news: Array<Record<string, unknown>>;
  forumTopics: Array<Record<string, unknown>>;
  forumReplies: Array<Record<string, unknown>>;
  references: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  roleMatrix: Array<Record<string, unknown>>;
  auditLog: Array<Record<string, unknown>>;
}

export interface PortalSnapshotDto {
  users: PortalUserDto[];
  currentUserId: string;
  grainLots: GrainLotDto[];
  equipmentLots: EquipmentLotDto[];
  auctionSummaries: AuctionSummaryDto[];
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
  getAuction: (lotId: string) => apiClient.get<AuctionSummaryDto | null>(`/api/marketplace/auctions/${lotId}`),
  getAuctionBids: (lotId: string) => apiClient.get<AuctionBidDto[]>(`/api/marketplace/auctions/${lotId}/bids`),
  placeAuctionBid: (lotId: string, amount: number) => apiClient.post<AuctionSummaryDto>(`/api/marketplace/auctions/${lotId}/bids`, { amount }),
  login: (email: string, password: string) => apiClient.post<{ userId: string; email: string; displayName: string; role: string; token: string }>('/api/auth/login', { email, password }),
  register: (payload: { email: string; password: string; displayName: string; region: string; farmType: string; inn?: string; ogrn?: string }) =>
    apiClient.post<{ userId: string; email: string; displayName: string; role: string; token: string }>('/api/auth/register', payload),
  cartAdd: (payload: { lotId: string; quantity: number }) => apiClient.post<void>('/api/marketplace/cart', payload),
  cartUpdate: (itemId: string, quantity: number) => apiClient.patch<void>(`/api/marketplace/cart/${itemId}`, { quantity }),
  cartRemove: (itemId: string) => apiClient.del<void>(`/api/marketplace/cart/${itemId}`),
  checkout: (payload: { paymentMethod: string; deliveryMode: string; deliveryPrice: number }) => apiClient.post<OrderDto>('/api/marketplace/checkout', payload),
  createGrainLot: (payload: Record<string, unknown>) => apiClient.post<string>('/api/marketplace/grain', payload),
  createEquipmentLot: (payload: Record<string, unknown>) => apiClient.post<string>('/api/marketplace/equipment', payload),
  createServiceRequest: (payload: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/api/marketplace/service-requests', payload),
  createTopic: (payload: Record<string, unknown>) => apiClient.post<string>('/api/forum/topics', payload),
  createReply: (payload: Record<string, unknown>) => apiClient.post<string>('/api/forum/replies', payload),
  submitSellerApplication: (payload: Record<string, unknown>) => apiClient.post('/api/seller-applications', payload),
  approveSellerApplication: (applicationId: string) => apiClient.patch<void>(`/api/seller-applications/${applicationId}/approve`, {}),
  rejectSellerApplication: (applicationId: string) => apiClient.patch<void>(`/api/seller-applications/${applicationId}/reject`, {}),
  markNotificationsRead: () => apiClient.post<void>('/api/notifications/mark-viewed'),
  activateSubscription: (payload: { plan: string }) => apiClient.post<SubscriptionDto>('/api/subscriptions/activate', payload),
  getSubscription: () => apiClient.get<SubscriptionDto>('/api/subscriptions'),
  getProfile: () => apiClient.get<PortalUserDto>('/api/profile/me'),
  updateProfile: (payload: Record<string, unknown>) => apiClient.put<PortalUserDto>('/api/profile/me', payload),

  getAdminWorkspace: () => apiClient.get<AdminWorkspaceDto>('/api/admin/workspace'),
  runAdminAction: (payload: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/api/admin/actions', payload),
  updateAdminAuction: (auctionId: string, payload: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/api/admin/auctions/${auctionId}`, payload),
  updateAdminSubscription: (userId: string, payload: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/api/admin/subscriptions/${userId}`, payload),
  createAdminPrice: (payload: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/api/admin/prices', payload),
  updateAdminPrice: (priceId: string, payload: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/api/admin/prices/${priceId}`, payload),
  createAdminReference: (payload: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/api/admin/references', payload),
  updateAdminReference: (referenceId: string, payload: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/api/admin/references/${referenceId}`, payload),
  sendAdminNotification: (payload: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/api/admin/notifications', payload),
  updateAdminForumTopic: (topicId: string, payload: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/api/admin/forum/topics/${topicId}`, payload),
  deleteAdminForumTopic: (topicId: string) => apiClient.del<void>(`/api/admin/forum/topics/${topicId}`),
  deleteAdminForumReply: (replyId: string) => apiClient.del<void>(`/api/admin/forum/replies/${replyId}`),
  getAdminStats: () => apiClient.get<Record<string, number>>('/api/admin/stats'),
  getAdminOverview: () => apiClient.get<AdminOverviewDto>('/api/admin/overview'),
  updateAdminUser: (userId: string, payload: Record<string, unknown>) => apiClient.patch<AdminUserDto>(`/api/admin/users/${userId}`, payload),
  deleteAdminUser: (userId: string) => apiClient.del<void>(`/api/admin/users/${userId}`),
  updateAdminLot: (category: string, lotId: string, payload: Record<string, unknown>) => apiClient.patch<AdminLotDto>(`/api/admin/lots/${category}/${lotId}`, payload),
  deleteAdminLot: (category: string, lotId: string) => apiClient.del<void>(`/api/admin/lots/${category}/${lotId}`),
  updateAdminOrder: (orderId: string, payload: Record<string, unknown>) => apiClient.patch<AdminOrderDto>(`/api/admin/orders/${orderId}`, payload),
  createAdminNews: (payload: Record<string, unknown>) => apiClient.post<AdminNewsDto>('/api/admin/news', payload),
  updateAdminNews: (newsId: string, payload: Record<string, unknown>) => apiClient.patch<AdminNewsDto>(`/api/admin/news/${newsId}`, payload),
  deleteAdminNews: (newsId: string) => apiClient.del<void>(`/api/admin/news/${newsId}`),
  quote: (payload: { distanceKm: number; volume: number; mode: string }) => apiClient.post<DeliveryQuoteDto>('/api/logistics/quote', payload),

  getAnalyticsMarket: (filters?: AnalyticsFiltersDto) => apiClient.get<AnalyticsMarketResponseDto>(`/api/analytics/market${buildAnalyticsQuery(filters)}`),
  getAnalyticsSignals: (filters?: AnalyticsFiltersDto) => apiClient.get<AnalyticsSignalsResponseDto>(`/api/analytics/signals${buildAnalyticsQuery(filters)}`),
  getAnalyticsReportExample: () => apiClient.get<AnalyticsReportExampleDto>('/api/analytics/report-example'),
  getAnalyticsTariffs: (period: 'month' | 'year') => apiClient.get<AnalyticsTariffsResponseDto>(`/api/analytics/tariffs?period=${period}`),
  saveAnalyticsSubscriptionSettings: (payload: Record<string, unknown>) => apiClient.post<{ status: string; savedAt: string }>('/api/analytics/subscription-settings', payload),
  selectAnalyticsTariff: (payload: { plan: string; period: string; paymentMode?: string; receipt?: string; payerEmail?: string; contactEmail?: string }) => apiClient.post<Record<string, unknown>>('/api/analytics/tariffs/select', payload),
  mediaUrl: (objectKey: string) => `/api/media/${objectKey.replace(/^\/+/, '')}`,
};
