export interface PortalSubItem {
  key: string;
  label: string;
  path: string;
}

export interface PortalNavItem {
  key: string;
  label: string;
  path: string;
  children: PortalSubItem[];
}

export const regions = ['Россия', 'ЦФО', 'ЮФО', 'ПФО', 'Сибирь', 'Дальний Восток'];

export const topQuickLinks = [
  { key: 'sign-in', label: 'Вход', path: '/auth' },
  { key: 'cabinet', label: 'Кабинет', path: '/cabinet' },
  { key: 'favorites', label: 'Избранное', path: '/favorites' },
  { key: 'notifications', label: 'Уведомления', path: '/notifications' },
];

export const mainNavigation: PortalNavItem[] = [
  {
    key: 'home',
    label: 'Главная',
    path: '/',
    children: [
      { key: 'home-summary', label: 'Рыночная сводка', path: '/' },
      { key: 'home-lots', label: 'Новые лоты', path: '/marketplace' },
      { key: 'home-logistics', label: 'Логистика', path: '/logistics' },
      { key: 'home-analytics', label: 'Аналитика и прогнозы', path: '/analytics' },
    ],
  },
  {
    key: 'news',
    label: 'Новости',
    path: '/news',
    children: [
      { key: 'news-main', label: 'Главные новости', path: '/news?section=main' },
      { key: 'news-russia', label: 'Новости России', path: '/news?section=russia' },
      { key: 'news-world', label: 'Мировые новости', path: '/news?section=world' },
      { key: 'news-analytics', label: 'Аналитика', path: '/news?section=analytics' },
      { key: 'news-press', label: 'Пресс-релизы', path: '/news?section=press' },
    ],
  },
  {
    key: 'prices',
    label: 'Цены',
    path: '/prices',
    children: [
      { key: 'prices-wheat3', label: 'Пшеница 3 класса', path: '/prices/pw-3' },
      { key: 'prices-wheat4', label: 'Пшеница 4 класса', path: '/prices/pw-4' },
      { key: 'prices-wheat5', label: 'Пшеница 5 класса', path: '/prices/pw-5' },
      { key: 'prices-by-region', label: 'Пшеница по регионам', path: '/prices/regions' },
      { key: 'prices-corn', label: 'Кукуруза', path: '/prices/corn' },
      { key: 'prices-barley', label: 'Ячмень', path: '/prices/barley' },
      { key: 'prices-exchange', label: 'Биржевые котировки', path: '/exchange' },
      { key: 'prices-trades', label: 'Торги', path: '/prices/trades' },
      { key: 'prices-duties', label: 'Пошлины', path: '/duties' },
      { key: 'prices-archive', label: 'Архив цен', path: '/prices/archive' },
    ],
  },
  {
    key: 'marketplace',
    label: 'Торговая площадка',
    path: '/marketplace',
    children: [
      { key: 'marketplace-grain', label: 'Зерно', path: '/marketplace?tab=grain' },
      { key: 'marketplace-equipment', label: 'Техника', path: '/marketplace?tab=equipment' },
      { key: 'marketplace-services', label: 'Услуги', path: '/marketplace?tab=services' },
      { key: 'marketplace-favorites', label: 'Избранные лоты', path: '/favorites' },
      { key: 'marketplace-compare', label: 'Сравнение', path: '/compare' },
    ],
  },
  {
    key: 'directories',
    label: 'Справочники',
    path: '/directories',
    children: [
      { key: 'dir-regions', label: 'Регионы', path: '/directories/regions' },
      { key: 'dir-cities', label: 'Города', path: '/directories/cities' },
      { key: 'dir-org-types', label: 'Типы организаций', path: '/directories/org-types' },
      { key: 'dir-organizations', label: 'Организации', path: '/organizations' },
      { key: 'dir-people', label: 'Люди', path: '/directories/people' },
      { key: 'dir-elevators', label: 'Элеваторы', path: '/directories/elevators' },
      { key: 'dir-ports', label: 'Порты', path: '/directories/ports' },
      { key: 'dir-labs', label: 'Лаборатории', path: '/directories/labs' },
    ],
  },
  {
    key: 'countries',
    label: 'Страны',
    path: '/countries',
    children: [
      { key: 'country-russia', label: 'Россия', path: '/countries/russia' },
      { key: 'country-kazakhstan', label: 'Казахстан', path: '/countries/kazakhstan' },
      { key: 'country-ukraine', label: 'Украина', path: '/countries/ukraine' },
      { key: 'country-belarus', label: 'Белоруссия', path: '/countries/belarus' },
      { key: 'country-kyrgyzstan', label: 'Киргизия', path: '/countries/kyrgyzstan' },
      { key: 'country-uzbekistan', label: 'Узбекистан', path: '/countries/uzbekistan' },
      { key: 'country-armenia', label: 'Армения', path: '/countries/armenia' },
      { key: 'country-turkey', label: 'Турция', path: '/countries/turkey' },
      { key: 'country-egypt', label: 'Египет', path: '/countries/egypt' },
      { key: 'country-world-economy', label: 'Мировая экономика', path: '/countries/world-economy' },
    ],
  },
  {
    key: 'cultures',
    label: 'Культуры',
    path: '/cultures',
    children: [
      { key: 'culture-grain', label: 'Зерновые', path: '/cultures/grain' },
      { key: 'culture-wheat', label: 'Пшеница', path: '/cultures/wheat' },
      { key: 'culture-barley', label: 'Ячмень', path: '/cultures/barley' },
      { key: 'culture-corn', label: 'Кукуруза', path: '/cultures/corn' },
      { key: 'culture-rye', label: 'Рожь', path: '/cultures/rye' },
      { key: 'culture-rice', label: 'Рис', path: '/cultures/rice' },
      { key: 'culture-buckwheat', label: 'Гречиха', path: '/cultures/buckwheat' },
      { key: 'culture-flour', label: 'Мука', path: '/cultures/flour' },
      { key: 'culture-soy', label: 'Соя', path: '/cultures/soy' },
      { key: 'culture-fertilizers', label: 'Удобрения', path: '/cultures/fertilizers' },
    ],
  },
  {
    key: 'logistics',
    label: 'Логистика и ж/д',
    path: '/logistics',
    children: [
      { key: 'logistics-calc', label: 'Маршруты', path: '/logistics' },
      { key: 'logistics-rzd', label: 'Ж/д тарифы', path: '/rail-tariffs' },
      { key: 'logistics-auto', label: 'Порты', path: '/logistics/ports' },
      { key: 'logistics-routes', label: 'Ограничения', path: '/routes' },
      { key: 'logistics-storage', label: 'Перевозчики', path: '/logistics/carriers' },
    ],
  },
  {
    key: 'forum',
    label: 'Форум',
    path: '/forum',
    children: [
      { key: 'forum-main', label: 'Разделы', path: '/forum' },
      { key: 'forum-active', label: 'Активные темы', path: '/forum?sort=discussed' },
      { key: 'forum-new', label: 'Задать вопрос', path: '/forum/new' },
      { key: 'forum-rules', label: 'Правила форума', path: '/forum-rules' },
    ],
  },
  {
    key: 'analytics',
    label: 'Аналитика',
    path: '/analytics',
    children: [
      { key: 'analytics-reviews', label: 'Обзоры рынка', path: '/analytics' },
      { key: 'analytics-signals', label: 'Сигналы по посевам', path: '/analytics/demo' },
      { key: 'analytics-subscription', label: 'Подписка на аналитику', path: '/analytics/subscription' },
      { key: 'analytics-demo', label: 'Демо', path: '/analytics/demo' },
      { key: 'analytics-tariffs', label: 'Тарифы аналитики', path: '/analytics/tariffs' },
    ],
  },
  {
    key: 'service',
    label: 'Сервис',
    path: '/about',
    children: [
      { key: 'service-about', label: 'О сервисе', path: '/about' },
      { key: 'service-ad', label: 'Реклама', path: '/advertising' },
      { key: 'service-contacts', label: 'Контакты', path: '/contacts' },
      { key: 'service-help', label: 'Помощь', path: '/help' },
      { key: 'service-rules', label: 'Правила размещения лотов', path: '/lot-rules' },
      { key: 'service-terms', label: 'Пользовательское соглашение', path: '/terms' },
      { key: 'service-privacy', label: 'Политика конфиденциальности', path: '/privacy' },
    ],
  },
  {
    key: 'cabinet',
    label: 'Кабинет',
    path: '/cabinet',
    children: [
      { key: 'cabinet-summary', label: 'Сводка', path: '/cabinet' },
      { key: 'cabinet-purchases', label: 'Мои закупки', path: '/cabinet/purchases' },
      { key: 'cabinet-sales', label: 'Мои продажи', path: '/cabinet/sales' },
      { key: 'cabinet-orders', label: 'Заказы', path: '/orders' },
      { key: 'cabinet-messages', label: 'Сообщения', path: '/messages' },
      { key: 'cabinet-docs', label: 'Документы', path: '/documents' },
      { key: 'cabinet-settings', label: 'Настройки профиля', path: '/cabinet/settings' },
    ],
  },
];

export const footerColumns = [
  {
    title: 'Разделы',
    links: [
      { label: 'Главная', path: '/' },
      { label: 'Новости', path: '/news' },
      { label: 'Цены и котировки', path: '/prices' },
      { label: 'Торговая площадка', path: '/marketplace' },
      { label: 'Форум', path: '/forum' },
    ],
  },
  {
    title: 'Сервисы',
    links: [
      { label: 'Логистика', path: '/logistics' },
      { label: 'Справочники', path: '/directories' },
      { label: 'Центр сообщений', path: '/messages' },
      { label: 'Центр документов', path: '/documents' },
      { label: 'Помощь и поддержка', path: '/help' },
    ],
  },
  {
    title: 'О сервисе',
    links: [
      { label: 'О сервисе', path: '/about' },
      { label: 'Реклама', path: '/advertising' },
      { label: 'Контакты', path: '/contacts' },
      { label: 'Правила форума', path: '/forum-rules' },
      { label: 'Правила размещения лотов', path: '/lot-rules' },
    ],
  },
  {
    title: 'Юридическая информация',
    links: [
      { label: 'Политика конфиденциальности', path: '/privacy' },
      { label: 'Пользовательское соглашение', path: '/terms' },
    ],
  },
];

export const marketRailWidgets = {
  exchanges: [
    'MATIF пшеница: 248,4 EUR (+1,3%)',
    'CBOT кукуруза: 4,86 USD (+0,7%)',
    'FOB Новороссийск: 243 USD (+0,9%)',
  ],
  indices: [
    'Индекс внутреннего рынка ЦФО: 16 840 ₽/т',
    'Индекс экспортного спроса: 71,2',
    'Индекс логистической нагрузки: 58,4',
  ],
  duties: ['Пшеница: 3 480 ₽/т', 'Ячмень: 1 930 ₽/т', 'Кукуруза: 2 740 ₽/т'],
  quotes: [
    'Пшеница 3 класс (ЦФО): 16 800 ₽/т',
    'Пшеница 4 класс (Поволжье): 15 620 ₽/т',
    'Ячмень (ЮФО): 13 950 ₽/т',
  ],
  comments: [
    'Экспортная премия по протеину 12,5% сохраняется.',
    'В портах наблюдается рост заявок на майские отгрузки.',
  ],
  priceChanges: [
    'Пшеница 3 класс: +220 ₽ за день / +640 ₽ за неделю',
    'Кукуруза: +110 ₽ за день / +380 ₽ за неделю',
  ],
  quickReviews: [
    { label: 'Обзор рынка ЦФО', path: '/analytics' },
    { label: 'Баланс спроса и предложения', path: '/analytics/demo' },
    { label: 'Риски по экспортным каналам', path: '/countries/world-economy' },
  ],
};
