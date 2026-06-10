export interface NewsItem {
  id: string;
  title: string;
  lead: string;
  section: string;
  country: string;
  culture: string;
  region: string;
  type: 'Новость' | 'Аналитика' | 'Пресс-релиз';
  date: string;
  source: string;
  imageUrl?: string;
}

export let newsFeed: NewsItem[] = [
  {
    id: 'n-1',
    title: 'Экспорт пшеницы из Черноморского бассейна ускорился в середине апреля',
    lead: 'Рост спроса на продовольственную пшеницу поддержал портовые цены и усилил конкуренцию за партии.',
    section: 'Главные новости',
    country: 'Россия',
    culture: 'Пшеница',
    region: 'ЮФО',
    type: 'Новость',
    date: '17.04.2026 09:30',
    source: 'Редакция ЗерноРУ',
  },
  {
    id: 'n-2',
    title: 'В ЦФО сохраняется дефицит вагонов-зерновозов на коротком плече',
    lead: 'Ставки на ж/д отправки выросли, участники рынка переходят на комбинированные маршруты.',
    section: 'Новости России',
    country: 'Россия',
    culture: 'Пшеница',
    region: 'ЦФО',
    type: 'Новость',
    date: '17.04.2026 08:20',
    source: 'Служба логистики',
  },
  {
    id: 'n-3',
    title: 'Импорт кукурузы в страны Ближнего Востока вырос на 4,8% за квартал',
    lead: 'Переработчики увеличили закупки в ожидании сезонного удорожания фрахта.',
    section: 'Мировые новости',
    country: 'Турция',
    culture: 'Кукуруза',
    region: 'Черноморский регион',
    type: 'Новость',
    date: '16.04.2026 18:10',
    source: 'Международный обзор',
  },
  {
    id: 'n-4',
    title: 'Баланс спроса и предложения по ячменю: обзор на май-июнь',
    lead: 'Аналитики ожидают сужение предложения в южных регионах и умеренный рост спотовых цен.',
    section: 'Аналитика',
    country: 'Россия',
    culture: 'Ячмень',
    region: 'ЮФО',
    type: 'Аналитика',
    date: '16.04.2026 15:45',
    source: 'Аналитический центр',
  },
  {
    id: 'n-5',
    title: 'Открыта приемка заявок на майские отгрузки через порт Азов',
    lead: 'Терминал обновил условия и график подачи транспорта для зерновых партий.',
    section: 'Пресс-релизы',
    country: 'Россия',
    culture: 'Пшеница',
    region: 'ЮФО',
    type: 'Пресс-релиз',
    date: '16.04.2026 11:00',
    source: 'Пресс-служба терминала',
  },
];

export interface PriceRow {
  key: string;
  culture: string;
  region: string;
  port: string;
  day: number;
  week: number;
  month: number;
}

export let priceRows: PriceRow[] = [
  { key: 'pw3', culture: 'Пшеница 3 класса', region: 'ЦФО', port: 'Новороссийск', day: 16800, week: 16420, month: 16050 },
  { key: 'pw4', culture: 'Пшеница 4 класса', region: 'Поволжье', port: 'Тамань', day: 15620, week: 15340, month: 14980 },
  { key: 'pw5', culture: 'Пшеница 5 класса', region: 'Сибирь', port: 'Нет', day: 14750, week: 14530, month: 14280 },
  { key: 'barley', culture: 'Ячмень', region: 'ЮФО', port: 'Азов', day: 13950, week: 13690, month: 13240 },
  { key: 'corn', culture: 'Кукуруза', region: 'ЮФО', port: 'Новороссийск', day: 15120, week: 14870, month: 14410 },
];

export const forumSections = [
  'Агрономия',
  'Торговля',
  'Техника',
  'Логистика',
  'Документы и право',
  'Экспорт',
  'Хранение и переработка',
  'Цены и рынок',
];

export const globalSearchTabs = ['Новости', 'Цены', 'Лоты', 'Организации', 'Темы форума', 'Аналитика', 'Справочники'];

export const supportPages = [
  { path: '/cart', title: 'Корзина', description: 'Проверка лотов перед оформлением сделки.' },
  { path: '/checkout', title: 'Оформление заказа', description: 'Подтверждение условий и расчет итоговой стоимости.' },
  { path: '/orders', title: 'История заказов', description: 'Все активные и завершенные заказы.' },
  { path: '/deals', title: 'История сделок', description: 'История согласований и выполненных отгрузок.' },
  { path: '/favorites', title: 'Избранные лоты', description: 'Сохраненные предложения по зерну, технике и услугам.' },
  { path: '/compare', title: 'Сравнение', description: 'Сравнение параметров и условий лотов.' },
  { path: '/messages', title: 'Центр сообщений', description: 'Диалоги по сделкам, логистике и документам.' },
  { path: '/documents', title: 'Центр документов', description: 'Сертификаты, договоры, счета и закрывающие документы.' },
  { path: '/billing', title: 'Счета и оплаты', description: 'Оплата услуг и контроль статусов платежей.' },
  { path: '/notifications', title: 'Уведомления', description: 'События по ценам, лотам, заказам и сообщениям.' },
  { path: '/help', title: 'Помощь и поддержка', description: 'Поддержка пользователей и база ответов.' },
  { path: '/about', title: 'О сервисе', description: 'О портале, принципах работы и данных рынка.' },
  { path: '/advertising', title: 'Реклама', description: 'Размещение рекламы и информационных кампаний.' },
  { path: '/contacts', title: 'Контакты', description: 'Контакты редакции, торгового и технического отделов.' },
  { path: '/forum-rules', title: 'Правила форума', description: 'Требования к публикациям и модерации.' },
  { path: '/lot-rules', title: 'Правила размещения лотов', description: 'Требования к карточкам и документам лота.' },
  { path: '/privacy', title: 'Политика конфиденциальности', description: 'Порядок обработки персональных данных.' },
  { path: '/terms', title: 'Пользовательское соглашение', description: 'Правила использования сервиса.' },
  { path: '/exchange', title: 'Биржевые котировки', description: 'Ключевые биржевые индикаторы по зерновым.' },
  { path: '/duties', title: 'Страница пошлин', description: 'Экспортные и внутренние пошлины по культурам.' },
  { path: '/rail-tariffs', title: 'Страница ж/д данных', description: 'Тарифы и ограничения по железнодорожным перевозкам.' },
  { path: '/routes', title: 'Маршруты', description: 'Типовые маршруты отгрузки и сроки доставки.' },
  { path: '/organizations', title: 'Каталог организаций', description: 'Компании рынка, статусы и специализация.' },
  { path: '/analytics/tariffs', title: 'Тарифы аналитики', description: 'Планы и условия подключения аналитических продуктов.' },
  { path: '/analytics/demo', title: 'Демо-аналитика', description: 'Демонстрация индексов, прогнозов и сигналов.' },
  { path: '/analytics/subscription', title: 'Управление подпиской', description: 'Активные услуги, продление и настройки уведомлений.' },
  { path: '/prices/archive', title: 'Архив цен', description: 'История цен за недели и месяцы.' },
];

export function setPortalContent(payload: { news?: NewsItem[]; prices?: PriceRow[] }): void {
  if (payload.news) {
    newsFeed = payload.news;
  }

  if (payload.prices) {
    priceRows = payload.prices;
  }
}

