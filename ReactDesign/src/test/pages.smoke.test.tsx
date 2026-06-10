import { App as AntApp, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { DashboardPage } from '../pages/DashboardPage';
import { ForumPage } from '../pages/ForumPage';
import { MarketplacePage } from '../pages/MarketplacePage';
import { bootstrapData } from '../services/bootstrapService';
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
    localStorage.clear();
    bootstrapData();
    useAppStore.setState({ currentUserId: 'u_buyer_1' });
    useAppStore.getState().loadAll();
  });

  it('renders home dashboard blocks', () => {
    const { container } = renderWithProviders(<DashboardPage />);

    expect(container.querySelector('.hero-card')).not.toBeNull();
    expect(container.querySelectorAll('.metric-card').length).toBeGreaterThanOrEqual(4);
  });

  it('renders marketplace cards with filters', () => {
    const { container } = renderWithProviders(<MarketplacePage />);

    expect(container.querySelectorAll('.lot-card').length).toBeGreaterThan(0);
    expect(container.querySelector('.ant-tabs')).not.toBeNull();
  });

  it('renders forum page with sections and active topics', () => {
    const { container } = renderWithProviders(<ForumPage />);

    expect(container.textContent).toContain('Разделы форума');
    expect(container.textContent).toContain('Активные темы');
  });
});
