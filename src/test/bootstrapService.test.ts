import { describe, expect, it, beforeEach } from 'vitest';
import { seedUsers } from '../data/seedData';
import { bootstrapData } from '../services/bootstrapService';
import { STORAGE_KEYS } from '../utils/storageKeys';

describe('bootstrapData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('seeds localStorage with initial marketplace data', () => {
    bootstrapData();

    const usersRaw = localStorage.getItem(STORAGE_KEYS.users);
    const postsRaw = localStorage.getItem(STORAGE_KEYS.forumPosts);
    const bootstrapped = localStorage.getItem(STORAGE_KEYS.bootstrapped);

    expect(bootstrapped).toBe('1');
    expect(usersRaw).not.toBeNull();
    expect(postsRaw).not.toBeNull();

    const users = JSON.parse(usersRaw ?? '[]') as Array<{ id: string }>;
    expect(users).toHaveLength(seedUsers.length);
  });

  it('does not overwrite existing data after first bootstrap', () => {
    bootstrapData();

    const alteredUsers = [{ id: 'custom_user' }];
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(alteredUsers));

    bootstrapData();

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) ?? '[]') as Array<{ id: string }>;
    expect(users).toEqual(alteredUsers);
  });
});

