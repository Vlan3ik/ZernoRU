import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';

export function useCurrentUser() {
  const users = useAppStore((s) => s.users);
  const currentUserId = useAppStore((s) => s.currentUserId);

  return useMemo(() => users.find((u) => u.id === currentUserId), [users, currentUserId]);
}


