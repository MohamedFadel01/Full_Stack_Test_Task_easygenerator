import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { ApiError } from '@/lib/api-client';
import * as authApi from '@/lib/auth-api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';
import type { SafeUser } from '@/types/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: SafeUser | null;
  status: AuthStatus;
  setSession: (user: SafeUser, accessToken: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const setSession = useCallback((nextUser: SafeUser, accessToken: string) => {
    setAccessToken(accessToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logoutSession();
    } catch {
      // Clear local session even if the network call fails.
    }
    clearAccessToken();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const existingToken = getAccessToken();
      if (existingToken) {
        try {
          const { user: currentUser } = await authApi.getMe(existingToken);
          if (!cancelled) {
            setUser(currentUser);
            setStatus('authenticated');
          }
          return;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            clearAccessToken();
          }
        }
      }

      try {
        const session = await authApi.refreshSession();
        if (!cancelled) {
          setSession(session.user, session.accessToken);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setSession]);

  const value = useMemo(
    () => ({
      user,
      status,
      setSession,
      logout,
    }),
    [user, status, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
