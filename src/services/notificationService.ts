import { NotificationItem } from '../types/domain';
import { getStorage, setStorage, uid } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';

export const notificationService = {
  list(userId: string): NotificationItem[] {
    const all = getStorage<NotificationItem[]>(STORAGE_KEYS.notifications, []);
    return all.filter((n) => n.userId === userId);
  },

  push(userId: string, message: string): NotificationItem {
    const all = getStorage<NotificationItem[]>(STORAGE_KEYS.notifications, []);
    const item: NotificationItem = {
      id: uid('notif'),
      userId,
      message,
      createdAt: new Date().toISOString(),
      viewed: false,
    };

    setStorage(STORAGE_KEYS.notifications, [item, ...all]);
    return item;
  },

  markAllViewed(userId: string): void {
    const all = getStorage<NotificationItem[]>(STORAGE_KEYS.notifications, []);
    const next = all.map((item) => (item.userId === userId ? { ...item, viewed: true } : item));
    setStorage(STORAGE_KEYS.notifications, next);
  },
};


