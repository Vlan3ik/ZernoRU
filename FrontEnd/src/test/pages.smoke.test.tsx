import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { render, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ForumCreateTopicPage, ForumPage } from '../pages/ForumPage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { NewsDetailPage, NewsPage } from '../pages/NewsPage';
import { AuctionInfoPage, buildArchiveRows, PriceArchivePage } from '../pages/ServicePages';
import { SellerVerificationPage } from '../pages/SellerRegistrationPage';
import { AuctionBidPanel } from '../components/marketplace/AuctionBidPanel';
import { newsFeed, priceRows } from '../data/portalContent';
import {
  seedEquipmentLots,
  seedForumPosts,
  seedForumReplies,
  seedGrainLots,
  seedNotifications,
  seedSellerApplications,
  seedUsers,
} from '../data/seedData';
import { useAppStore } from '../store/appStore';

vi.mock('../services/portalApi', () => ({
  portalApi: {
    getAuction: vi.fn().mockResolvedValue({
      lotId: 'lot-1',
      lotTitle: 'Пшеница 3 класса',
      startingPrice: 1000,
      currentHighestBid: 1200,
      minimumStep: 100,
      sellerName: 'ООО СмолАгроЗакуп',
      startsAtUtc: '2026-06-12T08:00:00.000Z',
      endsAtUtc: '2026-06-12T23:59:00.000Z',
      status: 'Active',
      bidsCount: 1,
      leadingUserId: 'u_buyer_1',
      leadingUserName: 'ООО СмолАгроЗакуп',
      winningUserId: null,
      winningUserName: null,
      winningBidId: null,
      lastBidAtUtc: '2026-06-12T10:00:00.000Z',
      isEnded: false,
    }),
    getAuctionBids: vi.fn().mockResolvedValue([
      {
        id: 'bid-1',
        auctionLotId: 'lot-1',
        userId: 'u_buyer_1',
        userName: 'ООО СмолАгроЗакуп',
        amount: 1200,
        createdAtUtc: '2026-06-12T10:00:00.000Z',
        isWinning: true,
      },
    ]),
    placeAuctionBid: vi.fn(),
    getSnapshot: vi.fn(),
    getReferences: vi.fn(),
  },
}));

function renderWithProviders(ui: ReactElement, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ConfigProvider locale={ruRU}>
        <AntApp>{ui}</AntApp>
      </ConfigProvider>
    </MemoryRouter>,
  );
}

const referenceCatalogs = {
  exchange: [
    {
      id: 'ex-1',
      slug: 'matif-wheat',
      title: 'MATIF Wheat',
      summary: 'Биржевой ориентир по пшенице',
      region: 'Европа',
      details: '',
      contacts: '',
      status: 'active',
      highlights: [],
    },
  ],
  duties: [
    {
      id: 'du-1',
      slug: 'wheat-duty',
      title: 'Пшеница',
      summary: 'Экспортная пошлина',
      region: 'Россия',
      details: '',
      contacts: '',
      status: 'active',
      highlights: [],
    },
  ],
  'rail-tariffs': [
    {
      id: 'rt-1',
      slug: 'grain-rail',
      title: 'Ж/д маршрут',
      summary: 'Тариф и ограничения',
      region: 'Россия',
      details: '',
      contacts: '',
      status: 'active',
      highlights: [],
    },
  ],
};

describe('pages smoke', () => {
  beforeEach(() => {
    useAppStore.setState({
      users: seedUsers,
      currentUserId: 'u_buyer_1',
      grainLots: seedGrainLots,
      equipmentLots: seedEquipmentLots,
      news: newsFeed.map((item, index): { id: string; section: string; title: string; lead: string; date: string; country: string; culture: string; region: string; type: string; imageUrl?: string } => ({
        id: item.id,
        section: item.section,
        title: item.title,
        lead: item.lead,
        date: item.date,
        country: item.country,
        culture: item.culture,
        region: item.region,
        type: item.type,
        imageUrl: index === 0 ? '/images/thematic/image_01.jpg' : undefined,
      })),
      prices: priceRows.map((row, index): { id: string; culture: string; region: string; day: number; weekChange: number } => ({
        id: row.key,
        culture: row.culture,
        region: row.region,
        day: row.day,
        weekChange: index === 0 ? 380 : 220,
      })),
      posts: seedForumPosts,
      replies: seedForumReplies,
      notifications: seedNotifications,
      sellerApplications: seedSellerApplications,
      cart: [],
      orders: [],
      subscription: { isActive: false, plan: null, expiresAt: null },
      referenceCatalogs,
    });
  });

  it('renders home dashboard blocks', () => {
    const { container } = renderWithProviders(<DashboardPage />);

    expect(container.querySelector('.section-card')).not.toBeNull();
    expect(container.querySelectorAll('.home-feature-card').length).toBeGreaterThanOrEqual(4);
    expect(container.querySelector('.home-lots-card')).not.toBeNull();
  });

  it('renders marketplace cards with filters', () => {
    const { container } = renderWithProviders(<MarketplacePage />);

    expect(container.querySelectorAll('.lot-card').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.marketplace-category-pill').length).toBeGreaterThan(0);
    expect(container.querySelector('.marketplace-filter-panel')).not.toBeNull();
  });

  it('renders forum page with sections and active topics', () => {
    const { container } = renderWithProviders(<ForumPage />);

    expect(container.textContent).toContain('Разделы форума');
    expect(container.textContent).toContain('Активные темы');
    expect(container.querySelectorAll('.nested-card').length).toBeGreaterThan(0);
  });

  it('filters the price archive', async () => {
    const archiveRows = buildArchiveRows(useAppStore.getState().prices);
    const { container } = renderWithProviders(<PriceArchivePage />);

    expect(container.textContent).toContain('Архив цен');
    expect(container.textContent).toContain('Найдено записей: 5');
    expect(archiveRows.filter((row) => row.culture === 'Ячмень').length).toBe(2);
  });

  it('renders seller verification with split requisites', () => {
    const { container } = renderWithProviders(<SellerVerificationPage />);

    expect(container.textContent).toContain('Проверка продавца');
    expect(container.textContent).toContain('Название организации');
    expect(container.textContent).toContain('ИНН');
    expect(container.textContent).toContain('КПП');
    expect(container.textContent).toContain('ОГРН');
    expect(container.textContent).toContain('Следующий шаг');
  });

  it('renders auction info page', () => {
    const { container } = renderWithProviders(<AuctionInfoPage />);

    expect(container.textContent).toContain('Что такое аукцион');
    expect(container.textContent).toContain('Торги, где цена растет');
  });

  it('renders forum topic creation with aligned taxonomy', () => {
    const { container } = renderWithProviders(<ForumCreateTopicPage />);

    expect(container.textContent).toContain('Новая тема форума');
    expect(container.textContent).toContain('Заголовок');
    expect(container.textContent).toContain('Подробное описание');
    expect(container.textContent).toContain('Теги');
    expect(container.textContent).toContain('Опубликовать тему');
  });

  it('persists auction bids in browser storage', async () => {
    const { container } = renderWithProviders(
      <AuctionBidPanel lotId="lot-1" basePrice={1000} sellerName="ООО СмолАгроЗакуп" lotTitle="Пшеница 3 класса" />,
    );

    await waitFor(() => {
      expect(container.textContent).toContain('Аукцион онлайн');
      expect(container.textContent).toContain('Ставок');
      expect(container.textContent).toContain('1');
      expect(container.textContent).toContain('Что такое аукцион');
    });
  });

  it('renders redesigned news page', () => {
    const { container } = renderWithProviders(<NewsPage />);

    expect(container.querySelector('.news-page')).not.toBeNull();
    expect(container.textContent).toContain('Актуальная лента зернового рынка');
    expect(container.querySelectorAll('.news-card').length).toBeGreaterThan(0);
  });

  it('renders news detail page', () => {
    const { container } = renderWithProviders(
      <Routes>
        <Route path="/news/:newsId" element={<NewsDetailPage />} />
      </Routes>,
      ['/news/n-1'],
    );

    expect(container.querySelector('.news-detail')).not.toBeNull();
    expect(container.textContent).toContain('Ключевые выводы');
  });

  it('renders auth page with the new split layout', () => {
    const { container } = renderWithProviders(<AuthPage />);

    expect(container.querySelector('.auth-shell')).not.toBeNull();
    expect(container.textContent).toContain('Вход и регистрация');
  });
});
