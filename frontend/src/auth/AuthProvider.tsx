import { useCallback, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { Session } from '../types';
import { AuthContext, type AuthContextValue } from './useAuth';

const SESSION_KEY = 'autovault.session';

/**
 * The token is kept in localStorage so a reload keeps the user signed in.
 * Trade-off: readable by any script on the page (XSS), unlike an httpOnly
 * cookie; acceptable here given the 1h token lifetime and that the API
 * re-checks the account on every request.
 */
function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    return typeof parsed.token === 'string' && parsed.user ? (parsed as Session) : null;
  } catch {
    return null; // Corrupted or blocked storage: start signed out
  }
}

function writeStoredSession(session: Session | null): void {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage unavailable (e.g. private mode): the session still works until reload
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);

  const startSession = useCallback((next: Session | null) => {
    writeStoredSession(next);
    setSession(next);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => startSession(await authApi.login(email, password)),
    [startSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await authApi.register(name, email, password);
      startSession(await authApi.login(email, password));
    },
    [startSession],
  );

  const logout = useCallback(() => startSession(null), [startSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, login, register, logout }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
