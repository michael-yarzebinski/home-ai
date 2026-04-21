import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setSession } from '../../api';

export function AdminSignIn() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setSessionError(null);
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      token: null,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, accessCode }),
    });
    if (!res.ok) {
      let msg = await res.text();
      try {
        const j = JSON.parse(msg) as { message?: string | string[] };
        if (typeof j.message === 'string') msg = j.message;
        else if (Array.isArray(j.message)) msg = j.message.join('; ');
      } catch {
        /* keep text */
      }
      setSessionError(msg);
      return;
    }
    const data = (await res.json()) as { access_token: string };
    setSession(data.access_token);
    setAccessCode('');
    navigate('/admin/users', { replace: true });
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-2xl font-semibold">Admin sign in</h1>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Admin routes require an <strong>admin</strong> role. Use your account <strong>name</strong> and
        access code.
      </p>
      <form onSubmit={signIn} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            className="w-full rounded border px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Access code</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2 bg-transparent"
            style={{ borderColor: 'var(--border)' }}
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {sessionError && <p className="text-sm text-red-600 dark:text-red-400">{sessionError}</p>}
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-white"
          style={{ background: 'var(--accent)' }}
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
