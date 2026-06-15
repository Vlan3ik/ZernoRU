export interface SessionState {
  token: string | null;
  userId: string | null;
}

const SESSION_STORAGE_KEY = 'zernoagromir-session-v1';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredSession(): SessionState {
  if (!canUseStorage()) {
    return { token: null, userId: null };
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return { token: null, userId: null };
    }

    const parsed = JSON.parse(raw) as Partial<SessionState>;
    return {
      token: typeof parsed.token === 'string' && parsed.token.length ? parsed.token : null,
      userId: typeof parsed.userId === 'string' && parsed.userId.length ? parsed.userId : null,
    };
  } catch {
    return { token: null, userId: null };
  }
}

function persistSession(next: SessionState) {
  if (!canUseStorage()) {
    return;
  }

  if (!next.token && !next.userId) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
}

let session: SessionState = readStoredSession();

export function getSession(): SessionState {
  return session;
}

export function setSession(next: Partial<SessionState>): SessionState {
  session = { ...session, ...next };
  persistSession(session);
  return session;
}

export function clearSession(): void {
  session = { token: null, userId: null };
  persistSession(session);
}
