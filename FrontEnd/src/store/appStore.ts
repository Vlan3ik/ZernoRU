import { create } from "zustand";
import {
  AuctionSummary,
  CartItem,
  DeliveryMode,
  EquipmentLot,
  ForumExpertApplication,
  ForumExpertProfile,
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
  ServiceLot,
} from "../types/domain";
import { portalApi } from "../services/portalApi";
import { clearSession, setSession } from "../services/session";

interface AppState {
  users: UserProfile[];
  currentUserId: string;
  grainLots: GrainLot[];
  equipmentLots: EquipmentLot[];
  serviceLots: ServiceLot[];
  auctionSummaries: AuctionSummary[];
  news: NewsArticle[];
  prices: PriceRecord[];
  analytics: Array<{
    month: string;
    ndvi: number;
    ssi: number;
    priceForecast: number;
    demand: number;
    supply: number;
  }>;
  cart: CartItem[];
  orders: Order[];
  posts: ForumPost[];
  replies: ForumReply[];
  forumReplyReactions: Record<string, { likes: number; dislikes: number }>;
  notifications: NotificationItem[];
  sellerApplications: SellerApplication[];
  subscription: SubscriptionState;
  referenceCatalogs: Record<
    string,
    Array<{
      id: string;
      slug: string;
      title: string;
      summary: string;
      region: string;
      details: string;
      contacts: string;
      status: string;
      highlights: string[];
    }>
  >;
  forumExpertApplications: ForumExpertApplication[];
  forumExperts: ForumExpertProfile[];
  forumTopicViews: Record<string, number>;

  loadAll: () => Promise<void>;
  setCurrentUser: (userId: string) => Promise<void>;
  addToCart: (lot: GrainLot | EquipmentLot) => Promise<void>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  checkout: (
    payment: PaymentMethod,
    deliveryMode: DeliveryMode,
    deliveryPrice: number,
  ) => Promise<Order>;
  submitSellerApplication: (
    payload: Omit<SellerApplication, "id" | "status" | "submittedAt">,
  ) => Promise<void>;
  approveApplication: (applicationId: string) => Promise<void>;
  addGrainLot: (payload: Omit<GrainLot, "id" | "createdAt">) => Promise<void>;
  addEquipmentLot: (
    payload: Omit<EquipmentLot, "id" | "createdAt">,
  ) => Promise<void>;
  addServiceLot: (
    payload: Omit<ServiceLot, "id" | "createdAt">,
  ) => Promise<void>;
  addPost: (payload: Omit<ForumPost, "id" | "createdAt">) => Promise<void>;
  addReply: (payload: Omit<ForumReply, "id" | "createdAt">) => Promise<string>;
  voteForumReply: (replyId: string, vote: "like" | "dislike") => void;
  submitForumExpertApplication: (
    payload: {
      section: string;
      topicId?: string | null;
      specialization: string;
      experienceYears: number;
      experienceSummary: string;
      proof: string;
      contact: string;
    },
  ) => Promise<void>;
  updateForumExpertApplication: (
    applicationId: string,
    payload: {
      section: string;
      topicId?: string | null;
      specialization: string;
      experienceYears: number;
      experienceSummary: string;
      proof: string;
      contact: string;
    },
  ) => Promise<void>;
  withdrawForumExpertApplication: (applicationId: string) => Promise<void>;
  approveForumExpertApplication: (applicationId: string) => Promise<void>;
  rejectForumExpertApplication: (applicationId: string) => Promise<void>;
  loadAllForumExpertApplications: () => Promise<void>;
  markForumTopicViewed: (topicId: string) => void;
  activateSubscription: (plan: "basic" | "professional" | "corporate") => Promise<void>;
  calculateDelivery: (
    distance: number,
    volume: number,
    mode: DeliveryMode,
  ) => number;
  markNotificationsRead: () => Promise<void>;
}

const referenceCategories = [
  "countries",
  "cultures",
  "regions",
  "organizations",
  "routes",
  "rail-tariffs",
  "duties",
  "exchange",
] as const;
const forumStorageKey = "zernoagromir-forum-v1";

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

type ForumLocalState = {
  topicViews: Record<string, number>;
  pendingReplies: ForumReply[];
  replyVotesByUser: Record<string, Record<string, "like" | "dislike">>;
};

type MarketplaceLocalState = {
  serviceLots: ServiceLot[];
};

function isVolatileForumMediaUrl(url?: string) {
  return Boolean(url && (url.startsWith("data:") || url.startsWith("blob:")));
}

function compactForumReplyForStorage(reply: ForumReply): ForumReply {
  const attachments = reply.attachments
    ?.map((attachment) =>
      isVolatileForumMediaUrl(attachment.url)
        ? { ...attachment, url: "" }
        : attachment,
    )
    .filter((attachment) => Boolean(attachment.url));

  return {
    ...reply,
    mediaUrl: isVolatileForumMediaUrl(reply.mediaUrl)
      ? undefined
      : reply.mediaUrl,
    attachments: attachments?.length ? attachments : undefined,
  };
}

function compactForumLocalStateForStorage(
  state: ForumLocalState,
): ForumLocalState {
  return {
    ...state,
    pendingReplies: state.pendingReplies
      .slice(0, 50)
      .map(compactForumReplyForStorage),
  };
}

function readForumLocalState(): ForumLocalState {
  if (!canUseStorage()) {
    return {
      topicViews: {},
      pendingReplies: [],
      replyVotesByUser: {},
    };
  }

  try {
    const raw = window.localStorage.getItem(forumStorageKey);
    if (!raw) {
      return {
        topicViews: {},
        pendingReplies: [],
        replyVotesByUser: {},
      };
    }

    const parsed = JSON.parse(raw) as Partial<ForumLocalState>;
    return {
      topicViews:
        parsed.topicViews && typeof parsed.topicViews === "object"
          ? (parsed.topicViews as Record<string, number>)
          : {},
      pendingReplies: Array.isArray(parsed.pendingReplies)
        ? (parsed.pendingReplies as ForumReply[])
        : [],
      replyVotesByUser:
        parsed.replyVotesByUser && typeof parsed.replyVotesByUser === "object"
          ? (parsed.replyVotesByUser as Record<
              string,
              Record<string, "like" | "dislike">
            >)
          : {},
    };
  } catch {
    return {
      topicViews: {},
      pendingReplies: [],
      replyVotesByUser: {},
    };
  }
}

function persistForumLocalState(state: ForumLocalState): ForumLocalState {
  const compactState = compactForumLocalStateForStorage(state);
  if (!canUseStorage()) return compactState;

  try {
    window.localStorage.setItem(forumStorageKey, JSON.stringify(compactState));
  } catch (error) {
    const emergencyState: ForumLocalState = {
      ...compactState,
      pendingReplies: compactState.pendingReplies.slice(0, 20).map((reply) => ({
        ...reply,
        mediaUrl: undefined,
        mediaType: undefined,
        mediaName: undefined,
        attachments: undefined,
      })),
    };

    try {
      window.localStorage.setItem(
        forumStorageKey,
        JSON.stringify(emergencyState),
      );
      return emergencyState;
    } catch {
      console.warn("Не удалось сохранить локальное состояние форума", error);
    }
  }

  return compactState;
}

function saveForumLocalState(
  updater: (draft: ForumLocalState) => ForumLocalState,
) {
  const next = updater(readForumLocalState());
  return persistForumLocalState(next);
}

function mapForumExpertApplicationDto(dto: {
  id: string;
  userId: string;
  userName: string;
  section: string;
  topicId?: string | null;
  specialization: string;
  experienceYears: number;
  experienceSummary: string;
  proof: string;
  contact: string;
  status: string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerName?: string | null;
}): ForumExpertApplication {
  return {
    id: dto.id,
    userId: dto.userId,
    userName: dto.userName,
    section: dto.section as ForumExpertApplication['section'],
    topicId: dto.topicId ?? undefined,
    specialization: dto.specialization,
    experienceYears: dto.experienceYears,
    experienceSummary: dto.experienceSummary,
    proof: dto.proof,
    contact: dto.contact,
    status: dto.status as ForumExpertApplication['status'],
    createdAt: dto.createdAt,
    reviewedAt: dto.reviewedAt ?? undefined,
    reviewerName: dto.reviewerName ?? undefined,
  };
}

function summarizeReplyVotes(
  reply: ForumReply,
  replyVotes: Record<string, "like" | "dislike"> | undefined,
) {
  let likes = reply.likes ?? 0;
  let dislikes = reply.dislikes ?? 0;

  Object.values(replyVotes ?? {}).forEach((vote) => {
    if (vote === "like") {
      likes += 1;
    } else {
      dislikes += 1;
    }
  });

  return { likes, dislikes };
}

function mergeForumReplies(
  replies: ForumReply[],
  pendingReplies: ForumReply[],
  replyVotesByUser: Record<string, Record<string, "like" | "dislike">>,
) {
  return [...replies, ...pendingReplies].map((reply) => ({
    ...reply,
    ...summarizeReplyVotes(reply, replyVotesByUser[reply.id]),
  }));
}

function readMarketplaceLocalState(): MarketplaceLocalState {
  if (!canUseStorage()) {
    return { serviceLots: [] };
  }

  try {
    const raw = window.localStorage.getItem("zernoagromir-marketplace-v1");
    if (!raw) {
      return { serviceLots: [] };
    }
    const parsed = JSON.parse(raw) as Partial<MarketplaceLocalState>;
    return {
      serviceLots: Array.isArray(parsed.serviceLots)
        ? (parsed.serviceLots as ServiceLot[])
        : [],
    };
  } catch {
    return { serviceLots: [] };
  }
}

function persistMarketplaceLocalState(state: MarketplaceLocalState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    "zernoagromir-marketplace-v1",
    JSON.stringify(state),
  );
}

function normalizeRole(role: string): "buyer" | "seller" | "admin" {
  if (role.toLowerCase() === "seller") return "seller";
  if (role.toLowerCase() === "admin") return "admin";
  return "buyer";
}

function normalizeGrainType(value: string): GrainLot["grainType"] {
  switch (value.toLowerCase()) {
    case "barley":
      return "Ячмень";
    case "corn":
      return "Кукуруза";
    case "rye":
      return "Рожь";
    case "oat":
      return "Овес";
    default:
      return "Пшеница";
  }
}

function normalizeEquipmentCondition(value: string): EquipmentLot["condition"] {
  return value.toLowerCase() === "new" ? "new" : "used";
}

function normalizePaymentMethod(value: string): PaymentMethod {
  switch (value.toLowerCase()) {
    case "card":
      return "card";
    case "sbp":
      return "sbp";
    default:
      return "invoice";
  }
}

function normalizeDeliveryMode(value: string): DeliveryMode {
  switch (value.toLowerCase()) {
    case "pickup":
      return "pickup";
    case "partnerdelivery":
    case "partner_delivery":
      return "partner_delivery";
    default:
      return "seller_delivery";
  }
}

function normalizeOrderStatus(value: string): Order["status"] {
  switch (value.toLowerCase()) {
    case "paid":
      return "paid";
    case "processing":
      return "processing";
    default:
      return "created";
  }
}

function mapUser(user: {
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
}): UserProfile {
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

function defaultForumExperts(): ForumExpertProfile[] {
  return [
    {
      id: "expert-agro-1",
      name: "СГАА",
      section: "Агрономия",
      specialization: "Севооборот и питание растений",
      company: "Смоленская ГСХА",
      bio: "Практика по агрономии, диагностике питания и сезонным рискам.",
      rating: 4.9,
      responseCount: 42,
      verified: true,
      contact: "expert@zernoagromir.ru",
    },
    {
      id: "expert-trade-1",
      name: "Эксперт портала",
      section: "Торговля",
      specialization: "Ценообразование, документы, договоры",
      company: "Редакция ЗерноАгроМир",
      bio: "Разбирает сделки, формулирует ответ по документам и логистике.",
      rating: 4.8,
      responseCount: 57,
      verified: true,
      contact: "market@zernoagromir.ru",
    },
    {
      id: "expert-tech-1",
      name: "Инженер-технолог",
      section: "Техника",
      specialization: "Хранение, ремонт, сервис",
      company: "АгроТехСнаб",
      bio: "Техническая эксплуатация, узлы и сервис сельхозтехники.",
      rating: 4.7,
      responseCount: 31,
      verified: true,
      contact: "service@zernoagromir.ru",
    },
  ];
}

function deriveForumExperts(
  applications: ForumExpertApplication[],
): ForumExpertProfile[] {
  const approved = applications
    .filter((application) => application.status === "approved")
    .map<ForumExpertProfile>((application, index) => ({
      id: `application-${application.id}`,
      userId: application.userId,
      name: application.userName,
      section: application.section,
      specialization: application.specialization,
      company: application.experienceSummary || "Проверенный участник",
      bio: application.proof,
      rating: 4.6 + Math.min(index * 0.05, 0.25),
      responseCount: 10 + index * 3,
      verified: true,
      contact: application.contact,
    }));

  return [...defaultForumExperts(), ...approved];
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
    category: "grain",
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
    category: "equipment",
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

function mapServiceLot(lot: {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  serviceType: string;
  region: string;
  unit: string;
  price: number;
  description: string;
  coverImageUrl?: string | null;
  attachments?: Array<{
    id: string;
    name: string;
    type: "image" | "video" | "file";
    url: string;
    mimeType?: string;
    size?: number;
  }>;
  createdAt: string;
  tags?: string[];
}): ServiceLot {
  return {
    id: lot.id,
    category: "service",
    sellerId: lot.sellerId,
    sellerName: lot.sellerName,
    title: lot.title,
    serviceType: lot.serviceType,
    region: lot.region,
    unit: lot.unit,
    price: lot.price,
    description: lot.description,
    coverImageUrl: lot.coverImageUrl ?? undefined,
    attachments: lot.attachments?.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })),
    createdAt: lot.createdAt,
    tags: lot.tags,
  };
}

function mapAuctionSummary(auction: {
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
}): AuctionSummary {
  return {
    lotId: auction.lotId,
    lotTitle: auction.lotTitle,
    startingPrice: Number(auction.startingPrice),
    currentHighestBid: Number(auction.currentHighestBid),
    minimumStep: Number(auction.minimumStep),
    sellerName: auction.sellerName,
    startsAtUtc: auction.startsAtUtc,
    endsAtUtc: auction.endsAtUtc,
    status: auction.status,
    bidsCount: auction.bidsCount,
    leadingUserId: auction.leadingUserId ?? undefined,
    leadingUserName: auction.leadingUserName ?? undefined,
    winningUserId: auction.winningUserId ?? undefined,
    winningUserName: auction.winningUserName ?? undefined,
    winningBidId: auction.winningBidId ?? undefined,
    lastBidAtUtc: auction.lastBidAtUtc ?? undefined,
    isEnded: auction.isEnded,
  };
}

function mapCartItem(item: {
  id: string;
  lotId: string;
  category: string;
  lotTitle: string;
  sellerName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}): CartItem {
  return {
    id: item.id,
    lotId: item.lotId,
    category: item.category.toLowerCase() as CartItem["category"],
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
  items: Array<{
    id: string;
    lotId: string;
    category: string;
    lotTitle: string;
    sellerName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
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

function mapForumSection(section: string): ForumPost["section"] {
  if (section === "Agrology") return "Агрономия";
  if (section === "Equipment") return "Техника";
  return "Торговля";
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
  attachments?: Array<{
    id: string;
    name: string;
    type: "image" | "video" | "file";
    url: string;
    mimeType?: string | null;
    size?: number | null;
  }>;
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
    attachments: topic.attachments?.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      mimeType: attachment.mimeType ?? undefined,
      size: attachment.size ?? undefined,
    })),
    createdAt: topic.createdAt,
    verifiedAnswer: topic.verifiedAnswer ?? undefined,
  };
}

function mapForumReply(reply: {
  id: string;
  topicId: string;
  authorName: string;
  rating: number;
  content: string;
  createdAt: string;
  attachments?: Array<{
    id: string;
    name: string;
    type: "image" | "video" | "file";
    url: string;
    mimeType?: string | null;
    size?: number | null;
  }>;
}): ForumReply {
  return {
    id: reply.id,
    postId: reply.topicId,
    authorName: reply.authorName,
    rating: reply.rating,
    content: reply.content,
    createdAt: reply.createdAt,
    attachments: reply.attachments?.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      type: attachment.type,
      url: attachment.url,
      mimeType: attachment.mimeType ?? undefined,
      size: attachment.size ?? undefined,
    })),
    likes: 0,
    dislikes: 0,
    status: "published",
  };
}

function mapNotification(notification: {
  id: string;
  userId: string;
  message: string;
  viewed: boolean;
  createdAt: string;
}): NotificationItem {
  return {
    id: notification.id,
    userId: notification.userId,
    message: notification.message,
    viewed: notification.viewed,
    createdAt: notification.createdAt,
  };
}

function mapSellerApplication(app: {
  id: string;
  userId: string;
  inn: string;
  ogrn: string;
  companyName: string;
  docPhotoUrl: string;
  status: string;
  submittedAt: string;
}): SellerApplication {
  return {
    id: app.id,
    userId: app.userId,
    inn: app.inn,
    ogrn: app.ogrn,
    companyName: app.companyName,
    docPhotoUrl: app.docPhotoUrl,
    status: app.status.toLowerCase() as SellerApplication["status"],
    submittedAt: app.submittedAt,
  };
}

function normalizeSubscriptionPlan(plan: string | null | undefined): SubscriptionState["plan"] {
  const normalized = plan?.toLowerCase();
  if (!normalized) return null;
  if (normalized === 'corporate' || normalized === 'enterprise') return 'corporate';
  if (normalized === 'professional' || normalized === 'pro' || normalized === 'yearly' || normalized === 'quarterly') return 'professional';
  return 'basic';
}

function mapSubscription(subscription: {
  userId: string;
  isActive: boolean;
  plan: string | null;
  expiresAt: string | null;
}): SubscriptionState {
  return {
    isActive: subscription.isActive,
    plan: normalizeSubscriptionPlan(subscription.plan),
    expiresAt: subscription.expiresAt,
  };
}

function mapNewsArticle(article: {
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
}): NewsArticle {
  const section =
    article.section === "Мировые новости" ? "Новости СНГ" : article.section;
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

function mapPriceRecord(record: {
  id: string;
  culture: string;
  region: string;
  day: number;
  weekChange: number;
}): PriceRecord {
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
  currentUserId: "",
  grainLots: [],
  equipmentLots: [],
  serviceLots: [],
  auctionSummaries: [],
  news: [],
  prices: [],
  analytics: [],
  cart: [],
  orders: [],
  posts: [],
  replies: [],
  forumReplyReactions: {},
  notifications: [],
  sellerApplications: [],
  subscription: { isActive: false, plan: null, expiresAt: null },
  referenceCatalogs: {},
  forumExpertApplications: [],
  forumExperts: defaultForumExperts(),
  forumTopicViews: {},

  loadAll: async () => {
    const [snapshot, ...references] = await Promise.all([
      portalApi.getSnapshot(),
      ...referenceCategories.map((category) =>
        portalApi.getReferences(category),
      ),
    ]);

    const users = snapshot.users.map(mapUser);
    const currentUserId =
      snapshot.currentUserId &&
      snapshot.currentUserId !== "00000000-0000-0000-0000-000000000000"
        ? snapshot.currentUserId
        : "";
    const forumLocal = readForumLocalState();
    const marketplaceLocal = readMarketplaceLocalState();

    setSession({ userId: currentUserId || null });

    const forumTopics = snapshot.forumTopics.map(mapForumTopic);
    const forumReplies = snapshot.forumReplies.map(mapForumReply);

    let forumExpertApplications: ForumExpertApplication[] = [];
    try {
      const dtoList = await portalApi.getForumExpertApplications();
      forumExpertApplications = dtoList.map(mapForumExpertApplicationDto);
    } catch {
      // API not available — keep empty list
      forumExpertApplications = [];
    }

    set({
      users,
      currentUserId,
      grainLots: snapshot.grainLots.map(mapGrainLot),
      equipmentLots: snapshot.equipmentLots.map(mapEquipmentLot),
      auctionSummaries: snapshot.auctionSummaries.map(mapAuctionSummary),
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
      posts: forumTopics,
      replies: mergeForumReplies(
        forumReplies,
        forumLocal.pendingReplies,
        forumLocal.replyVotesByUser,
      ),
      notifications: snapshot.notifications.map(mapNotification),
      sellerApplications: snapshot.sellerApplications.map(mapSellerApplication),
      subscription: mapSubscription(snapshot.subscription),
      referenceCatalogs: Object.fromEntries(
        referenceCategories.map((category, index) => [
          category,
          references[index].map(mapReferenceCatalogItem),
        ]),
      ),
      forumExpertApplications,
      forumExperts: deriveForumExperts(forumExpertApplications),
      forumTopicViews: forumLocal.topicViews,
      forumReplyReactions: Object.fromEntries(
        [...forumReplies, ...forumLocal.pendingReplies].map((reply) => {
          const counts = summarizeReplyVotes(
            reply,
            forumLocal.replyVotesByUser[reply.id],
          );
          return [reply.id, counts];
        }),
      ),
      serviceLots: marketplaceLocal.serviceLots.map(mapServiceLot),
    });
  },

  setCurrentUser: async (userId) => {
    setSession({ userId });
    set({ currentUserId: userId });
    await get().loadAll();
  },

  addToCart: async (lot) => {
    if (lot.sellerId === get().currentUserId) {
      throw new Error("Нельзя купить собственный лот");
    }
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

  addServiceLot: async (payload) => {
    const lot: ServiceLot = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      category: "service",
    };

    const next = (() => {
      const current = readMarketplaceLocalState();
      return { serviceLots: [lot, ...current.serviceLots] };
    })();

    persistMarketplaceLocalState(next);
    set({ serviceLots: next.serviceLots });
  },

  addPost: async (payload) => {
    await portalApi.createTopic(payload);
    await get().loadAll();
  },

  addReply: async (payload) => {
    const reply: ForumReply = {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      likes: payload.likes ?? 0,
      dislikes: payload.dislikes ?? 0,
      status: payload.status ?? "pending",
    };

    const next = saveForumLocalState((state) => ({
      topicViews: state.topicViews,
      pendingReplies: [reply, ...state.pendingReplies],
      replyVotesByUser: state.replyVotesByUser,
    }));
    const mergedReply = {
      ...reply,
      ...summarizeReplyVotes(reply, next.replyVotesByUser[reply.id]),
    };

    set({
      replies: [
        mergedReply,
        ...get().replies.filter((item) => item.id !== reply.id),
      ],
      forumReplyReactions: {
        ...get().forumReplyReactions,
        [reply.id]: {
          likes: mergedReply.likes ?? 0,
          dislikes: mergedReply.dislikes ?? 0,
        },
      },
    });

    return reply.id;
  },

  voteForumReply: (replyId, vote) => {
    const currentUserId = get().currentUserId || "anonymous";
    const next = saveForumLocalState((state) => {
      const currentVotes = state.replyVotesByUser[replyId] ?? {};
      const previousVote = currentVotes[currentUserId];
      if (previousVote === vote) {
        return state;
      }

      return {
        topicViews: state.topicViews,
        pendingReplies: state.pendingReplies,
        replyVotesByUser: {
          ...state.replyVotesByUser,
          [replyId]: {
            ...currentVotes,
            [currentUserId]: vote,
          },
        },
      };
    });

    set((state) => ({
      forumReplyReactions: Object.fromEntries(
        state.replies.map((reply) => {
          const counts = summarizeReplyVotes(
            reply,
            next.replyVotesByUser[reply.id],
          );
          return [reply.id, counts];
        }),
      ),
      replies: state.replies.map((reply) => {
        if (reply.id !== replyId) return reply;
        const reactions = summarizeReplyVotes(
          reply,
          next.replyVotesByUser[reply.id],
        );
        return {
          ...reply,
          likes: reactions.likes,
          dislikes: reactions.dislikes,
        };
      }),
    }));
  },

  submitForumExpertApplication: async (payload) => {
    const dto = await portalApi.submitForumExpertApplication({
      section: payload.section,
      topicId: payload.topicId ?? null,
      specialization: payload.specialization,
      experienceYears: payload.experienceYears,
      experienceSummary: payload.experienceSummary,
      proof: payload.proof,
      contact: payload.contact,
    });
    const application = mapForumExpertApplicationDto(dto);
    set((state) => ({
      forumExpertApplications: [application, ...state.forumExpertApplications],
      forumExperts: deriveForumExperts([application, ...state.forumExpertApplications]),
    }));
  },

  updateForumExpertApplication: async (applicationId, payload) => {
    const dto = await portalApi.updateForumExpertApplication(applicationId, {
      section: payload.section,
      topicId: payload.topicId ?? null,
      specialization: payload.specialization,
      experienceYears: payload.experienceYears,
      experienceSummary: payload.experienceSummary,
      proof: payload.proof,
      contact: payload.contact,
    });
    const updated = mapForumExpertApplicationDto(dto);
    set((state) => ({
      forumExpertApplications: state.forumExpertApplications.map((app) =>
        app.id === applicationId ? updated : app,
      ),
      forumExperts: deriveForumExperts(
        state.forumExpertApplications.map((app) =>
          app.id === applicationId ? updated : app,
        ),
      ),
    }));
  },

  withdrawForumExpertApplication: async (applicationId) => {
    const dto = await portalApi.withdrawForumExpertApplication(applicationId);
    const updated = mapForumExpertApplicationDto(dto);
    set((state) => ({
      forumExpertApplications: state.forumExpertApplications.map((app) =>
        app.id === applicationId ? updated : app,
      ),
      forumExperts: deriveForumExperts(
        state.forumExpertApplications.map((app) =>
          app.id === applicationId ? updated : app,
        ),
      ),
    }));
  },

  approveForumExpertApplication: async (applicationId) => {
    const dto = await portalApi.approveForumExpertApplication(applicationId);
    const updated = mapForumExpertApplicationDto(dto);
    set((state) => ({
      forumExpertApplications: state.forumExpertApplications.map((app) =>
        app.id === applicationId ? updated : app,
      ),
      forumExperts: deriveForumExperts(
        state.forumExpertApplications.map((app) =>
          app.id === applicationId ? updated : app,
        ),
      ),
    }));
  },

  rejectForumExpertApplication: async (applicationId) => {
    const dto = await portalApi.rejectForumExpertApplication(applicationId);
    const updated = mapForumExpertApplicationDto(dto);
    set((state) => ({
      forumExpertApplications: state.forumExpertApplications.map((app) =>
        app.id === applicationId ? updated : app,
      ),
      forumExperts: deriveForumExperts(
        state.forumExpertApplications.map((app) =>
          app.id === applicationId ? updated : app,
        ),
      ),
    }));
  },

  loadAllForumExpertApplications: async () => {
    try {
      const dtoList = await portalApi.getAdminForumExpertApplications();
      const apps = dtoList.map(mapForumExpertApplicationDto);
      set({
        forumExpertApplications: apps,
        forumExperts: deriveForumExperts(apps),
      });
    } catch {
      // fallback to user-scoped list
      await get().loadAll();
    }
  },

  markForumTopicViewed: (topicId) => {
    const next = saveForumLocalState((state) => ({
      topicViews: {
        ...state.topicViews,
        [topicId]: (state.topicViews[topicId] ?? 0) + 1,
      },
      pendingReplies: state.pendingReplies,
      replyVotesByUser: state.replyVotesByUser,
    }));

    set({ forumTopicViews: next.topicViews });
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
