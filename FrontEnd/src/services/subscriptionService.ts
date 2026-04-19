import { seedAnalytics, seedCourses } from '../data/seedData';
import { AnalyticsPoint, CourseMaterial, SubscriptionState } from '../types/domain';
import { getStorage, setStorage } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';

interface SubscriptionMap {
  [userId: string]: SubscriptionState;
}

export const subscriptionService = {
  getMaterials(): CourseMaterial[] {
    return seedCourses;
  },

  getAnalytics(): AnalyticsPoint[] {
    return seedAnalytics;
  },

  getSubscription(userId: string): SubscriptionState {
    const map = getStorage<SubscriptionMap>(STORAGE_KEYS.subscriptions, {});
    return map[userId] ?? { isActive: false, plan: null, expiresAt: null };
  },

  activateSubscription(userId: string, plan: 'monthly' | 'yearly'): SubscriptionState {
    const map = getStorage<SubscriptionMap>(STORAGE_KEYS.subscriptions, {});
    const expires = new Date();
    expires.setMonth(expires.getMonth() + (plan === 'monthly' ? 1 : 12));

    map[userId] = {
      isActive: true,
      plan,
      expiresAt: expires.toISOString(),
    };

    setStorage(STORAGE_KEYS.subscriptions, map);
    return map[userId];
  },
};


