import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  name: string;
  /** Two-letter initials, upper-cased */
  initials: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** Returns success/error; validates name non-empty and code ≥ 4 digits */
  login: (name: string, code: string) => { success: boolean; error?: string };
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const SESSION_KEY = 'home-ai:session';

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
    const parsed = JSON.parse(raw) as { name?: string };
    if (!parsed.name) return null;
    return { name: parsed.name, initials: toInitials(parsed.name) };
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
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

  const login = useCallback((name: string, code: string): { success: boolean; error?: string } => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: 'Name is required.' };

    const codeClean = code.trim();
    if (!/^\d+$/.test(codeClean)) return { success: false, error: 'Code must contain only digits.' };
    if (codeClean.length < 4) return { success: false, error: 'Code must be at least 4 digits.' };

    const authUser: AuthUser = { name: trimmed, initials: toInitials(trimmed) };
    saveSession(authUser);
    setUser(authUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
