import { describe, expect, it, beforeEach } from 'vitest';
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

describe('app store bootstrap integration', () => {
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

  it('stores seeded entities in zustand state', () => {
    const state = useAppStore.getState();

    expect(state.users.length).toBeGreaterThan(0);
    expect(state.grainLots.length).toBeGreaterThan(0);
    expect(state.equipmentLots.length).toBeGreaterThan(0);
    expect(state.posts.length).toBeGreaterThan(0);
  });
});
