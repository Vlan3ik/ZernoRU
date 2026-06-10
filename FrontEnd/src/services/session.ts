export interface SessionState {
  token: string | null;
  userId: string | null;
}

let session: SessionState = {
  token: null,
  userId: null,
};

export function getSession(): SessionState {
  return session;
}

export function setSession(next: Partial<SessionState>): SessionState {
  session = { ...session, ...next };
  return session;
}

export function clearSession(): void {
  session = { token: null, userId: null };
}
