import { describe, expect, it, beforeEach } from 'vitest';
import { bootstrapData } from '../services/bootstrapService';
import { useAppStore } from '../store/appStore';

describe('app store bootstrap integration', () => {
  beforeEach(() => {
    localStorage.clear();
    bootstrapData();
    useAppStore.setState({ currentUserId: 'u_buyer_1' });
    useAppStore.getState().loadAll();
  });

  it('loads seeded entities into zustand store', () => {
    const state = useAppStore.getState();

    expect(state.users.length).toBeGreaterThan(0);
    expect(state.grainLots.length).toBeGreaterThan(0);
    expect(state.equipmentLots.length).toBeGreaterThan(0);
    expect(state.posts.length).toBeGreaterThan(0);
  });

  it('changes current user and reloads dependent slices', () => {
    const initialUserId = useAppStore.getState().currentUserId;
    expect(initialUserId).toBe('u_buyer_1');

    useAppStore.getState().setCurrentUser('u_seller_1');
    const nextState = useAppStore.getState();

    expect(nextState.currentUserId).toBe('u_seller_1');
    expect(nextState.notifications.every((item) => item.userId === 'u_seller_1')).toBe(true);
  });
});

