import { STORAGE_KEYS } from './storageKeys';

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.authToken);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.authToken, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEYS.authToken);
}
