import { useEffect, useRef, useState } from 'react';
import { ClipboardList, LogOut, Menu, Settings, User, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface TopNavProps {
  onToggleSidebar: () => void;
  pendingActionsCount?: number;
  hasPendingActionsPermission?: boolean;
}

export function TopNav({
  onToggleSidebar,
  pendingActionsCount = 0,
  hasPendingActionsPermission = false,
}: TopNavProps) {
  return (
    <header className="h-14 flex items-center gap-2 px-3 bg-card border-b border-border flex-shrink-0 z-30">
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-md',
          'text-muted-foreground hover:text-foreground hover:bg-accent',
          'transition-colors',
        )}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2 select-none">
        <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
          <span className="text-primary text-[10px] font-bold">AI</span>
        </div>
        <span className="font-semibold text-foreground text-base tracking-tight leading-none">
          Home AI
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right-side actions */}
      <div className="flex items-center gap-0.5">
        {hasPendingActionsPermission && (
          <NavIconButton label={`Pending actions${pendingActionsCount > 0 ? ` (${pendingActionsCount})` : ''}`}>
            <ClipboardList size={18} />
            {pendingActionsCount > 0 && (
              <span
                className={cn(
                  'absolute top-1 right-1',
                  'flex h-[14px] min-w-[14px] items-center justify-center',
                  'rounded-full bg-primary px-[3px]',
                  'text-[9px] font-semibold text-primary-foreground leading-none',
                )}
              >
                {pendingActionsCount > 99 ? '99+' : pendingActionsCount}
              </span>
            )}
          </NavIconButton>
        )}

        <SettingsDropdown />

        <UserDropdown />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Settings dropdown
// ---------------------------------------------------------------------------

function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        aria-label="Settings"
        aria-expanded={open}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-md',
          'text-muted-foreground hover:text-foreground hover:bg-accent',
          'transition-colors',
          open && 'bg-accent text-foreground',
        )}
      >
        <Settings size={18} />
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 w-56',
            'rounded-lg border border-border bg-card shadow-xl',
            'py-1 z-50',
          )}
        >
          {/* Section label */}
          <span className="block px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            My Settings
          </span>

          <DropdownLink
            to="/settings/automation-rules"
            icon={<Zap size={14} className="text-amber-400" />}
            label="Automation Rules"
            description="Triggers, actions & schedules"
            onClick={() => setOpen(false)}
          />

          {/* Divider — placeholder area for future items */}
          <div className="mx-2 my-1 border-t border-border" />

          <span className="block px-3 pb-1 pt-0.5 text-[10px] text-muted-foreground/40 italic">
            More settings coming soon
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// User dropdown — initials avatar → name + sign out
// ---------------------------------------------------------------------------

function UserDropdown() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title={user?.name ?? 'User'}
        aria-label="User menu"
        aria-expanded={open}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-md',
          'transition-colors',
          open ? 'bg-accent' : 'hover:bg-accent',
        )}
      >
        {user ? (
          /* Initials avatar */
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full',
              'bg-primary/20 text-primary text-[11px] font-semibold leading-none select-none',
              open && 'ring-1 ring-primary/50',
            )}
          >
            {user.initials}
          </span>
        ) : (
          <User size={18} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 w-52',
            'rounded-lg border border-border bg-card shadow-xl',
            'py-1 z-50',
          )}
        >
          {/* Identity block */}
          {user && (
            <div className="px-3 py-2.5 flex items-center gap-2.5 border-b border-border/60 mb-1">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold select-none">
                {user.initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground/50">Signed in</p>
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left',
              'text-muted-foreground hover:text-red-400 hover:bg-red-500/8',
            )}
          >
            <LogOut size={14} />
            <span className="text-sm">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

interface DropdownLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
}

function DropdownLink({ to, icon, label, description, onClick }: DropdownLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-[11px] text-muted-foreground/60 leading-tight truncate">
            {description}
          </span>
        )}
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Generic nav icon button
// ---------------------------------------------------------------------------

interface NavIconButtonProps {
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavIconButton({ label, children, onClick }: NavIconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-md',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        'transition-colors',
      )}
    >
      {children}
    </button>
  );
}
