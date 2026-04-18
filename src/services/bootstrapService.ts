import {
  defaultSubscription,
  seedEquipmentLots,
  seedForumPosts,
  seedForumReplies,
  seedGrainLots,
  seedNotifications,
  seedSellerApplications,
  seedUsers,
} from '../data/seedData';
import { setStorage } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';

export function bootstrapData(): void {
  if (localStorage.getItem(STORAGE_KEYS.bootstrapped)) return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    if (key !== STORAGE_KEYS.bootstrapped) {
      localStorage.removeItem(key);
    }
  });

  setStorage(STORAGE_KEYS.users, seedUsers);
  setStorage(STORAGE_KEYS.sellerApplications, seedSellerApplications);
  setStorage(STORAGE_KEYS.grainLots, seedGrainLots);
  setStorage(STORAGE_KEYS.equipmentLots, seedEquipmentLots);
  setStorage(STORAGE_KEYS.forumPosts, seedForumPosts);
  setStorage(STORAGE_KEYS.forumReplies, seedForumReplies);
  setStorage(STORAGE_KEYS.notifications, seedNotifications);
  setStorage(STORAGE_KEYS.carts, {});
  setStorage(STORAGE_KEYS.orders, []);
  setStorage(STORAGE_KEYS.subscriptions, {
    u_buyer_1: defaultSubscription,
    u_seller_1: defaultSubscription,
    u_seller_2: defaultSubscription,
  });
  localStorage.setItem(STORAGE_KEYS.bootstrapped, '1');
}


