import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { CabinetPage } from '../pages/CabinetPage';
import {
  CountryDetailPage,
  CultureDetailPage,
  DirectoryEntityPage,
  DirectoryItemPage,
  OrganizationProfilePage,
} from '../pages/CatalogDetailPages';
import { CountriesPage, CulturesPage, DirectoriesPage } from '../pages/CatalogPages';
import { ForumCreateTopicPage, ForumPage, ForumSectionPage, ForumTopicPage } from '../pages/ForumPage';
import { HomePage } from '../pages/HomePage';
import { LogisticsPage } from '../pages/LogisticsPage';
import { LotDetailPage } from '../pages/LotDetailPage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { NewsDetailPage, NewsPage } from '../pages/NewsPage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { PriceDetailPage, PricesPage } from '../pages/PricesPage';
import { SearchResultsPage } from '../pages/SearchResultsPage';
import { SellerVerificationPage } from '../pages/SellerRegistrationPage';
import {
  AnalyticsDemoPage,
  AnalyticsSubscriptionPage,
  AnalyticsTariffsPage,
  BillingPage,
  buildStaticSections,
  CartPage,
  CheckoutPage,
  ComparePage,
  ContentArticlePage,
  DealsPage,
  DocumentsPage,
  FavoritesPage,
  HelpPage,
  MessagesPage,
  NotificationsPage,
  OrderDetailPage,
  OrdersPage,
  PriceArchivePage,
} from '../pages/ServicePages';
import { AnalyticsPage } from '../pages/SubscriptionPage';

export function AppRouter() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:newsId" element={<NewsDetailPage />} />

        <Route path="/prices" element={<PricesPage />} />
        <Route path="/prices/archive" element={<PriceArchivePage />} />
        <Route path="/prices/:slug" element={<PriceDetailPage />} />

        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/lot/:lotId" element={<LotDetailPage />} />

        <Route path="/directories" element={<DirectoriesPage />} />
        <Route path="/directories/:entity" element={<DirectoryEntityPage />} />
        <Route path="/directories/:entity/:itemId" element={<DirectoryItemPage />} />

        <Route path="/countries" element={<CountriesPage />} />
        <Route path="/countries/:slug" element={<CountryDetailPage />} />

        <Route path="/cultures" element={<CulturesPage />} />
        <Route path="/cultures/:slug" element={<CultureDetailPage />} />

        <Route path="/logistics" element={<LogisticsPage />} />
        <Route path="/logistics/:sub" element={<LogisticsPage />} />

        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/section/:sectionId" element={<ForumSectionPage />} />
        <Route path="/forum/topic/:topicId" element={<ForumTopicPage />} />
        <Route path="/forum/new" element={<ForumCreateTopicPage />} />

        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/analytics/tariffs" element={<AnalyticsTariffsPage />} />
        <Route path="/analytics/demo" element={<AnalyticsDemoPage />} />
        <Route path="/analytics/subscription" element={<AnalyticsSubscriptionPage />} />

        <Route path="/cabinet" element={<CabinetPage />} />
        <Route path="/cabinet/:section" element={<CabinetPage />} />
        <Route path="/seller-verification" element={<SellerVerificationPage />} />

        <Route path="/search" element={<SearchResultsPage />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/help" element={<HelpPage />} />

        <Route path="/about" element={<ContentArticlePage title="О сервисе" sections={buildStaticSections('О сервисе')} />} />
        <Route path="/advertising" element={<ContentArticlePage title="Реклама" sections={buildStaticSections('Реклама')} />} />
        <Route path="/contacts" element={<ContentArticlePage title="Контакты" sections={buildStaticSections('Контакты')} />} />
        <Route path="/forum-rules" element={<ContentArticlePage title="Правила форума" sections={buildStaticSections('Правила форума')} />} />
        <Route path="/lot-rules" element={<ContentArticlePage title="Правила размещения лотов" sections={buildStaticSections('Правила размещения лотов')} />} />
        <Route path="/privacy" element={<ContentArticlePage title="Политика конфиденциальности" sections={buildStaticSections('Политика конфиденциальности')} />} />
        <Route path="/terms" element={<ContentArticlePage title="Пользовательское соглашение" sections={buildStaticSections('Пользовательское соглашение')} />} />

        <Route path="/exchange" element={<PlaceholderPage title="Биржевые котировки" description="Ключевые биржевые индикаторы по зерновым рынкам." />} />
        <Route path="/duties" element={<PlaceholderPage title="Пошлины" description="Экспортные и внутренние пошлины по культурам и направлениям." />} />
        <Route path="/rail-tariffs" element={<PlaceholderPage title="Ж/д тарифы" description="Тарифы, ограничения и сезонные коэффициенты по железнодорожным перевозкам." />} />
        <Route path="/routes" element={<PlaceholderPage title="Маршруты" description="Типовые маршруты поставки и сроки доставки по регионам." />} />

        <Route path="/organizations" element={<Navigate to="/directories/organizations" replace />} />
        <Route path="/organizations/:orgId" element={<OrganizationProfilePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

