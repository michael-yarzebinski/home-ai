import { NavLink, useNavigate } from 'react-router-dom';
import { clearSession } from '../../api';

const links: { to: string; label: string }[] = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/tasks', label: 'Tasks' },
  { to: '/admin/task-requests', label: 'Task requests' },
  { to: '/admin/facts', label: 'Facts' },
  { to: '/admin/recipes', label: 'Recipes' },
  { to: '/admin/app-config', label: 'App config' },
  { to: '/admin/notifications', label: 'Notifications' },
  { to: '/admin/audit', label: 'Audit log' },
  { to: '/admin/ai-audit', label: 'AI audit' },
  { to: '/admin/logs', label: 'Logs' },
];

export function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <aside
      className="w-52 shrink-0 rounded-xl border p-3 flex flex-col gap-1"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>
        Data
      </div>
      <nav className="flex flex-col gap-0.5">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `rounded-md px-2 py-1.5 text-sm transition-colors ${
                isActive ? 'font-medium' : 'opacity-80 hover:opacity-100'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--border)' : 'transparent',
              color: 'var(--fg)',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        className="mt-4 text-left text-sm underline opacity-80 hover:opacity-100"
        style={{ color: 'var(--muted)' }}
        onClick={() => {
          clearSession();
          navigate('/admin/login', { replace: true });
        }}
      >
        Sign out
      </button>
    </aside>
  );
}
