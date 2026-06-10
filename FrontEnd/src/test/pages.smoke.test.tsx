import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { DashboardPage } from '../pages/DashboardPage';
import { ForumPage } from '../pages/ForumPage';
import { MarketplacePage } from '../pages/MarketplacePage';
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

function renderWithProviders(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ConfigProvider locale={ruRU}>
        <AntApp>{ui}</AntApp>
      </ConfigProvider>
    </MemoryRouter>,
  );
}

describe('pages smoke', () => {
  beforeEach(() => {
    useAppStore.setState({
      users: seedUsers,
      currentUserId: 'u_buyer_1',
      grainLots: seedGrainLots,
      equipmentLots: seedEquipmentLots,
      posts: seedForumPosts,
      replies: seedForumReplies,
      notifications: seedNotifications,
      sellerApplications: seedSellerApplications,
      cart: [],
      orders: [],
      subscription: { isActive: false, plan: null, expiresAt: null },
    });
  });

  it('renders home dashboard blocks', () => {
    const { container } = renderWithProviders(<DashboardPage />);

    expect(container.querySelector('.section-card')).not.toBeNull();
    expect(container.querySelectorAll('.home-hero-stat').length).toBeGreaterThanOrEqual(4);
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
  });
});
