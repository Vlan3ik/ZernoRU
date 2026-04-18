import { UserProfile } from '../types/domain';
import { getStorage } from './localStorageService';
import { STORAGE_KEYS } from '../utils/storageKeys';

export const userService = {
  list(): UserProfile[] {
    return getStorage<UserProfile[]>(STORAGE_KEYS.users, []);
  },

  getById(userId: string): UserProfile | undefined {
    return this.list().find((u) => u.id === userId);
  },
};


