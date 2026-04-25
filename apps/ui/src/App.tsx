import { SHARED_PACKAGE_VERSION } from '@home-ai/shared/version';

export function App() {
  return (
    <main className="app">
      <h1>Home AI</h1>
      <p className="muted">Web UI (Vite + React)</p>
      <p className="badge">@home-ai/shared {SHARED_PACKAGE_VERSION}</p>
      <p className="hint">
        API calls to <code>/api/...</code> are proxied to <code>http://localhost:3000</code> in dev.
      </p>
    </main>
  );
}
