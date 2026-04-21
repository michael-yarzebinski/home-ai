import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';

export function AppLayout() {
  const { theme, setTheme } = useTheme();
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="border-b px-4 py-3 flex flex-wrap items-center gap-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <span className="font-semibold text-lg" style={{ color: 'var(--fg)' }}>
          Home AI
        </span>
        <nav className="flex gap-3 text-sm">
          <NavLink
            to="/status"
            className={({ isActive }) =>
              isActive ? 'font-medium' : 'opacity-70 hover:opacity-100'
            }
            style={{ color: 'var(--accent)' }}
          >
            Status
          </NavLink>
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              isActive ? 'font-medium' : 'opacity-70 hover:opacity-100'
            }
            style={{ color: 'var(--accent)' }}
          >
            Chat
          </NavLink>
          <NavLink
            to="/admin"
            className={() =>
              pathname.startsWith('/admin') ? 'font-medium' : 'opacity-70 hover:opacity-100'
            }
            style={{ color: 'var(--accent)' }}
          >
            Admin
          </NavLink>        </nav>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm" style={{ color: 'var(--muted)' }}>
            Theme
          </label>
          <select
            value={theme ?? 'system'}
            onChange={(e) => setTheme(e.target.value)}
            className="rounded border px-2 py-1 text-sm bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </header>
      <main
        className={`flex-1 p-4 mx-auto w-full ${pathname.startsWith('/admin') ? 'max-w-[100rem]' : 'max-w-5xl'}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
