export type GrainType = 'Пшеница' | 'Ячмень' | 'Кукуруза' | 'Рожь' | 'Овес';
export type LotCategory = 'grain' | 'equipment' | 'service';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'card' | 'sbp' | 'invoice';
export type DeliveryMode = 'pickup' | 'seller_delivery' | 'partner_delivery';
export type EquipmentCondition = 'new' | 'used';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
  region: string;
  farmType: string;
  inn?: string;
  ogrn?: string;
  isVerifiedSeller?: boolean;
  sellerVerificationStatus?: string;
}

export interface SellerApplication {
  id: string;
  userId: string;
  inn: string;
  ogrn: string;
  companyName: string;
  docPhotoUrl: string;
  status: VerificationStatus;
  submittedAt: string;
}

export interface GrainLot {
  id: string;
  category: 'grain';
  sellerId: string;
  sellerName: string;
  title: string;
  grainType: GrainType;
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
  coverImageUrl?: string;
  createdAt: string;
}

export interface EquipmentLot {
  id: string;
  category: 'equipment';
  sellerId: string;
  sellerName: string;
  title: string;
  brand: string;
  year: number;
  condition: EquipmentCondition;
  price: number;
  region: string;
  description: string;
  coverImageUrl?: string;
  createdAt: string;
}

export interface ServiceLot {
  id: string;
  category: 'service';
  sellerId: string;
  sellerName: string;
  title: string;
  serviceType: string;
  region: string;
  unit: string;
  price: number;
  description: string;
  coverImageUrl?: string;
  attachments?: ForumAttachment[];
  createdAt: string;
  tags?: string[];
}

export interface AuctionSummary {
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
  leadingUserId?: string;
  leadingUserName?: string;
  winningUserId?: string;
  winningUserName?: string;
  winningBidId?: string;
  lastBidAtUtc?: string;
  isEnded: boolean;
}

export interface AuctionBid {
  id: string;
  auctionLotId: string;
  userId: string;
  userName: string;
  amount: number;
  createdAtUtc: string;
  isWinning: boolean;
}

export type MarketplaceLot = GrainLot | EquipmentLot | ServiceLot;

export interface CartItem {
  id: string;
  lotId: string;
  category: LotCategory;
  quantity: number;
  lotTitle: string;
  sellerName: string;
  unitPrice: number;
  subtotal: number;
}

export interface DeliveryQuote {
  distanceKm: number;
  volume: number;
  mode: DeliveryMode;
  price: number;
  etaDays: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  deliveryMode: DeliveryMode;
  deliveryPrice: number;
  total: number;
  createdAt: string;
  status: 'created' | 'paid' | 'processing';
}

export interface CourseMaterial {
  id: string;
  title: string;
  type: 'video' | 'course' | 'webinar';
  duration: string;
  level: 'Базовый' | 'Продвинутый';
  provider: string;
}

export type SubscriptionPlanCode = 'basic' | 'professional' | 'corporate';

export interface SubscriptionState {
  isActive: boolean;
  plan: SubscriptionPlanCode | null;
  expiresAt: string | null;
}

export interface AnalyticsPoint {
  month: string;
  ndvi: number;
  ssi: number;
  priceForecast: number;
  demand: number;
  supply: number;
}

export interface NewsArticle {
  id: string;
  section: string;
  title: string;
  lead: string;
  date: string;
  country: string;
  culture: string;
  region: string;
  type: string;
  imageUrl?: string;
}

export interface PriceRecord {
  id: string;
  culture: string;
  region: string;
  day: number;
  weekChange: number;
}

export interface ForumPost {
  id: string;
  section: 'Агрономия' | 'Торговля' | 'Техника';
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  tags: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  mediaName?: string;
  attachments?: ForumAttachment[];
  createdAt: string;
  verifiedAnswer?: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  authorId?: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
  replyToAuthorName?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  mediaName?: string;
  attachments?: ForumAttachment[];
  status?: 'pending' | 'published';
  likes?: number;
  dislikes?: number;
}

export type ForumSectionName = 'Агрономия' | 'Торговля' | 'Техника';

export interface ForumExpertApplication {
  id: string;
  userId: string;
  userName: string;
  section: ForumSectionName;
  topicId?: string;
  specialization: string;
  experienceYears: number;
  experienceSummary: string;
  proof: string;
  contact: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  createdAt: string;
  reviewedAt?: string;
  reviewerName?: string;
}

export interface ForumAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'file';
  url: string;
  mimeType?: string;
  size?: number;
}

export interface ForumExpertProfile {
  id: string;
  userId?: string;
  name: string;
  section: ForumSectionName;
  specialization: string;
  company: string;
  bio: string;
  rating: number;
  responseCount: number;
  verified: boolean;
  contact?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  viewed: boolean;
}

export interface SellerDocumentInput {
  companyName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  bankName: string;
  bankAccount: string;
  bik: string;
  docPhotoUrl: string;
  mercuryCertificate: string;
  declarationOfConformity: string;
  storageContract: string;
}

export interface SellerActivityItem {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  status: 'info' | 'success' | 'warning';
}
