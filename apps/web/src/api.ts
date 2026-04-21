const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function getStoredToken(): string | null {
  return localStorage.getItem('home_ai_token');
}

export function setSession(token: string): void {
  localStorage.setItem('home_ai_token', token);
}

export function clearSession(): void {
  localStorage.removeItem('home_ai_token');
}

export async function apiFetch(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const { token = getStoredToken(), ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, { ...rest, headers });
}
