import {
  AnalyticsPoint,
  CourseMaterial,
  EquipmentLot,
  ForumPost,
  ForumReply,
  GrainLot,
  NotificationItem,
  SellerApplication,
  SubscriptionState,
  UserProfile,
} from '../types/domain';

const now = new Date().toISOString();

export const seedUsers: UserProfile[] = [
  {
    id: 'u_buyer_1',
    email: 'buyer1@zerno.local',
    name: 'ООО СмолАгроЗакуп',
    role: 'buyer',
    region: 'Смоленская область',
    farmType: 'Закупщик зерна',
  },
  {
    id: 'u_seller_1',
    email: 'seller1@zerno.local',
    name: 'КФХ Вяземские Поля',
    role: 'seller',
    region: 'Смоленская область',
    farmType: 'Производитель зерновых',
    inn: '6732012345',
    ogrn: '1216700001122',
    isVerifiedSeller: true,
  },
  {
    id: 'u_seller_2',
    email: 'seller2@zerno.local',
    name: 'ИП АгроТехСнаб',
    role: 'seller',
    region: 'Смоленская область',
    farmType: 'Поставщик техники',
    inn: '6732098765',
    ogrn: '319673200013211',
    isVerifiedSeller: true,
  },
];

export const seedSellerApplications: SellerApplication[] = [
  {
    id: 'app_1',
    userId: 'u_seller_1',
    inn: '6732012345',
    ogrn: '1216700001122',
    companyName: 'КФХ Вяземские Поля',
    docPhotoUrl:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80',
    status: 'approved',
    submittedAt: now,
  },
];

export const seedGrainLots: GrainLot[] = [
  {
    id: 'grain_1',
    category: 'grain',
    sellerId: 'u_seller_1',
    sellerName: 'КФХ Вяземские Поля',
    title: 'Пшеница 3 класса урожай 2025',
    grainType: 'Пшеница',
    grade: '3 класс',
    volumeTons: 180,
    pricePerTon: 16800,
    region: 'Смоленская область, Вяземский район',
    qualityScore: 92,
    description: 'Натура 770 г/л, влажность 12.5%, протеин 14.1%.',
    hasOwnTransport: true,
    auctionEnabled: false,
    mercuryCertificate: 'МЕРК-2025-1129',
    declarationOfConformity: 'ЕАЭС N RU Д-RU.РА07.В.22591/25',
    storageContract: 'Договор хранения N 45/25',
    createdAt: now,
  },
  {
    id: 'grain_2',
    category: 'grain',
    sellerId: 'u_seller_1',
    sellerName: 'КФХ Вяземские Поля',
    title: 'Ячмень фуражный',
    grainType: 'Ячмень',
    grade: 'Фуражный',
    volumeTons: 90,
    pricePerTon: 13200,
    region: 'Смоленская область, Гагарин',
    qualityScore: 86,
    description: 'Подходит для комбикормов, хранение на элеваторе до 6 мес.',
    hasOwnTransport: false,
    auctionEnabled: true,
    mercuryCertificate: 'МЕРК-2025-2044',
    declarationOfConformity: 'ЕАЭС N RU Д-RU.РА07.В.99812/25',
    storageContract: 'Договор хранения N 18/25',
    createdAt: now,
  },
];

export const seedEquipmentLots: EquipmentLot[] = [
  {
    id: 'eq_1',
    category: 'equipment',
    sellerId: 'u_seller_2',
    sellerName: 'ИП АгроТехСнаб',
    title: 'Трактор МТЗ 1221.3',
    brand: 'МТЗ',
    year: 2022,
    condition: 'used',
    price: 2950000,
    region: 'Смоленск',
    description: 'Наработка 1100 м/ч, ТО по регламенту, ПСМ в наличии.',
    createdAt: now,
  },
  {
    id: 'eq_2',
    category: 'equipment',
    sellerId: 'u_seller_2',
    sellerName: 'ИП АгроТехСнаб',
    title: 'Комбайн Ростсельмаш ACROS 595',
    brand: 'Ростсельмаш',
    year: 2024,
    condition: 'new',
    price: 12600000,
    region: 'Ярцево',
    description: 'Новый, гарантия 2 года, доступен трейд-ин.',
    createdAt: now,
  },
];

export const seedForumPosts: ForumPost[] = [
  {
    id: 'post_1',
    section: 'Агрономия',
    authorId: 'u_buyer_1',
    authorName: 'ООО СмолАгроЗакуп',
    title: 'Севооборот под пшеницу после рапса: есть риски?',
    content: 'Подскажите, как лучше скорректировать азотное питание в Смоленском районе?',
    tags: ['#смоленск', '#пшеница', '#севооборот'],
    createdAt: now,
    verifiedAnswer: 'Проверить запас минерального азота по слоям 0-30 и 30-60 см.',
  },
  {
    id: 'post_2',
    section: 'Техника',
    authorId: 'u_seller_2',
    authorName: 'ИП АгроТехСнаб',
    title: 'Какой комбайн лучше для небольших полей?',
    content: 'Нужны рекомендации по маневренности и расходу топлива.',
    tags: ['#техника', '#комбайн'],
    createdAt: now,
  },
];

export const seedForumReplies: ForumReply[] = [
  {
    id: 'reply_1',
    postId: 'post_1',
    authorName: 'Эксперт СГАА',
    rating: 4.9,
    content: 'Добавьте листовую диагностику на фазе кущения и внесите серу.',
    createdAt: now,
  },
];

export const seedNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'u_seller_1',
    message: 'Ваш лот "Пшеница 3 класса" получил 8 просмотров за сутки.',
    createdAt: now,
    viewed: false,
  },
];

export const seedCourses: CourseMaterial[] = [
  {
    id: 'course_1',
    title: 'Севооборот и питание зерновых культур',
    type: 'course',
    duration: '2 ч 40 мин',
    level: 'Базовый',
    provider: 'Смоленская аграрная академия',
  },
  {
    id: 'course_2',
    title: 'NDVI и полевой мониторинг: практика сезона',
    type: 'video',
    duration: '58 мин',
    level: 'Продвинутый',
    provider: 'Аналитика и прогнозы',
  },
  {
    id: 'course_3',
    title: 'Вебинар: Рынок зерна ЦФО 2026',
    type: 'webinar',
    duration: '1 ч 20 мин',
    level: 'Продвинутый',
    provider: 'СГАА + отраслевые аналитики',
  },
];

export const seedAnalytics: AnalyticsPoint[] = [
  { month: 'Янв', ndvi: 0.38, ssi: 0.64, priceForecast: 15100, demand: 82, supply: 76 },
  { month: 'Фев', ndvi: 0.42, ssi: 0.58, priceForecast: 15450, demand: 85, supply: 77 },
  { month: 'Мар', ndvi: 0.51, ssi: 0.49, priceForecast: 15800, demand: 88, supply: 79 },
  { month: 'Апр', ndvi: 0.56, ssi: 0.44, priceForecast: 16100, demand: 90, supply: 80 },
  { month: 'Май', ndvi: 0.63, ssi: 0.4, priceForecast: 16500, demand: 94, supply: 82 },
  { month: 'Июн', ndvi: 0.69, ssi: 0.36, priceForecast: 16900, demand: 96, supply: 83 },
];

export const defaultSubscription: SubscriptionState = {
  isActive: false,
  plan: null,
  expiresAt: null,
};

