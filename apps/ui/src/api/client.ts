// ---------------------------------------------------------------------------
// Storage keys — must match apps/ui/src/contexts/auth-context.tsx usage
// (same string values as apps/ui/src/lib/api.ts).
// ---------------------------------------------------------------------------

export const API_TOKEN_KEY = 'home-ai:token';
export const API_SESSION_KEY = 'home-ai:session';

export const apiAuth = {
  getToken: () => localStorage.getItem(API_TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(API_TOKEN_KEY, token),
  /** Clears token and user session — used on logout and 401 expiry */
  clearSession: () => {
    localStorage.removeItem(API_TOKEN_KEY);
    localStorage.removeItem(API_SESSION_KEY);
  },
} as const;

// ---------------------------------------------------------------------------
// Core fetch wrapper (Vite proxies `/api` → server)
// ---------------------------------------------------------------------------

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = apiAuth.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401) {
    if (token) {
      apiAuth.clearSession();
      window.location.href = '/login';
    }
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Typed HTTP helpers
// ---------------------------------------------------------------------------

export const apiClient = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
} as const;
