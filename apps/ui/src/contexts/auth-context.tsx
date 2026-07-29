import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, apiToken, SESSION_KEY } from '@/lib/api';
import { Role } from '@home-ai/shared/domain/role/role';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  /** User role from JWT */
  role: string;
  /** Two-letter initials, upper-cased */
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean | null;
  /** Calls POST /v1/auth/login, stores JWT, returns success/error */
  login: (name: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; name?: string; role?: string };
    if (!parsed.id || !parsed.name) return null;
    return {
      id: parsed.id,
      name: parsed.name,
      role: parsed.role ?? 'guest',
      initials: toInitials(parsed.name),
    };
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: user.id, name: user.name, role: user.role }),
  );
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const session = loadSession();
    if (session) setUser(session);
  }, []);

  const login = useCallback(
    async (name: string, code: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await api.post<{
          accessToken: string;
          userId: string;
          name: string;
          role: string;
        }>('/v1/auth/login', { name, code });

        apiToken.set(result.accessToken);

        const authUser: AuthUser = {
          id: result.userId,
          name: result.name,
          role: result.role,
          initials: toInitials(result.name),
        };
        saveSession(authUser);
        setUser(authUser);
        return { success: true };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    apiToken.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin: user ? user.role === Role.ADMIN : null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
