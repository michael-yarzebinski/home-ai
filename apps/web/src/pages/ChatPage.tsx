import { FormEvent, useState } from 'react';
import { apiFetch, clearSession, getStoredToken, setSession } from '../api';

type ChatMsg = { role: 'user' | 'assistant'; text: string; status?: string };

export function ChatPage() {
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const token = getStoredToken();

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
      setSessionError((await res.json().catch(() => ({}))).message ?? (await res.text()));
      return;
    }
    const data = (await res.json()) as { access_token: string };
    setSession(data.access_token);
    setAccessCode('');
    window.location.reload();
  }

  function signOut() {
    clearSession();
    window.location.reload();
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !token) return;
    const userText = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: userText }]);
    setBusy(true);
    try {
      const res = await apiFetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      const data = (await res.json()) as {
        success: boolean;
        reply?: string;
        status?: string;
        error?: string;
      };
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: data.reply ?? data.error ?? 'No reply',
          status: data.status,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Sign in with your account name and access code. A JWT is stored in the browser for this session.
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <button
          type="button"
          onClick={signOut}
          className="text-sm underline"
          style={{ color: 'var(--muted)' }}
        >
          Sign out
        </button>
      </div>
      <div
        className="flex-1 overflow-y-auto space-y-3 rounded-xl border p-3 mb-3"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        {messages.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Send a message to the assistant.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 max-w-[90%] ${
              msg.role === 'user' ? 'ml-auto' : ''
            }`}
            style={{
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--border)',
              color: msg.role === 'user' ? '#fff' : 'var(--fg)',
            }}
          >
            <div className="text-xs opacity-80 mb-1">{msg.role}</div>
            <div className="whitespace-pre-wrap">{msg.text}</div>
            {msg.status && (
              <div className="text-xs mt-1 opacity-75">status: {msg.status}</div>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border px-3 py-2 bg-transparent"
          style={{ borderColor: 'var(--border)' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message…"
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg px-4 py-2 text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
