export type GrainType = 'Пшеница' | 'Ячмень' | 'Кукуруза' | 'Рожь' | 'Овес';
export type LotCategory = 'grain' | 'equipment';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod = 'card' | 'sbp' | 'invoice';
export type DeliveryMode = 'pickup' | 'seller_delivery' | 'partner_delivery';
export type EquipmentCondition = 'new' | 'used';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller';
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

export type MarketplaceLot = GrainLot | EquipmentLot;

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

export interface SubscriptionState {
  isActive: boolean;
  plan: 'monthly' | 'yearly' | null;
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
  createdAt: string;
  verifiedAnswer?: string;
}

export interface ForumReply {
  id: string;
  postId: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  viewed: boolean;
}

export interface SellerDocumentInput {
  innKpp: string;
  ogrn: string;
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
