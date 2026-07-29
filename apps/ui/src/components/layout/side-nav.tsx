import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  ChefHat,
  ClipboardList,
  Home,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Plug,
  Radio,
  Recycle,
  Search,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Role } from '@home-ai/shared/domain/role/role';
import type { User } from '@home-ai/shared/domain/user/user';

// ---------------------------------------------------------------------------
// Nav data model
// ---------------------------------------------------------------------------

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  /** When set, item stays active for paths under this prefix (e.g. /checklists/home, /checklists/all) */
  activePathPrefix?: string;
  /** If set, item is only rendered when the current user's role is included */
  requiredRoles?: Role[];
}

interface NavSection {
  label: string;
  /** If set, the entire section is hidden when user lacks the role */
  requiredRoles?: Role[];
  items: NavItem[];
  /** Renders a full-width divider line above this section */
  dividerBefore?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Admin',
    requiredRoles: [Role.ADMIN],
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
      { icon: Search, label: 'Entity Search', href: '/entities' },
      { icon: Recycle, label: 'Forms playground', href: '/dev/automation-rule-playground' },
    ],
  },

  {
    label: 'User',
    items: [
      { icon: Home, label: 'Home', href: '/home' },
      {
        icon: ClipboardList,
        label: 'Pending Actions',
        href: '/pending-actions',
        requiredRoles: [Role.ADMIN, Role.PARENT],
      },
      { icon: MessageSquare, label: 'Chat', href: '/chat' },
      {
        icon: ListChecks,
        label: 'Checklists',
        href: '/checklists/home',
        activePathPrefix: '/checklists',
      },
    ],
  },
  {
    label: 'Library',
    dividerBefore: true,
    items: [
      {
        icon: Plug,
        label: 'Devices',
        href: '/devices/home',
        activePathPrefix: '/devices',
      },
      { icon: BookOpen, label: 'Facts', href: '/facts/home', activePathPrefix: '/facts' },
      { icon: ChefHat, label: 'Recipes', href: '/recipes/home', activePathPrefix: '/recipes' },
    ],
  },
];

const HUB_MODE_ITEM: NavItem = {
  icon: Radio,
  label: 'Hub Mode',
  href: '/hub',
};

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------

function canAccess(userRole: Role, requiredRoles?: Role[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return requiredRoles.includes(userRole);
}

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  const prefix = item.activePathPrefix;
  if (prefix) {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }
  return false;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

interface SideNavProps {
  expanded: boolean;
  onClose: () => void;
  user: User;
}

export function SideNav({ expanded, onClose, user }: SideNavProps) {
  const { pathname } = useLocation();

  const handleNavigate = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'flex flex-col flex-shrink-0 bg-card border-r border-border overflow-hidden',
          'transition-[width,transform] duration-200 ease-in-out',
          // Mobile: absolute overlay
          'absolute inset-y-0 left-0 z-50 w-60',
          expanded ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, width toggles
          'md:relative md:z-auto md:translate-x-0',
          expanded ? 'md:w-60' : 'md:w-[60px]',
        )}
        aria-label="Main navigation"
      >
        {/* Scrollable nav sections */}
        <nav className="flex flex-col gap-0 p-2 pt-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {NAV_SECTIONS.map((section, index) => {
            if (!canAccess(user.role, section.requiredRoles)) return null;

            const visibleItems = section.items.filter((item) =>
              canAccess(user.role, item.requiredRoles),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={index} className="flex flex-col">
                {/* Divider between sections */}
                {section.dividerBefore && (
                  <div className="my-2 border-t border-border" />
                )}

                {/* Section label (only when expanded) */}
                {expanded && (
                  <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                    {section.label}
                  </p>
                )}

                {/* Items */}
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map((item) => (
                    <SideNavItem
                      key={item.href}
                      item={item}
                      expanded={expanded}
                      active={isNavItemActive(pathname, item)}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Pushes Hub Mode to the bottom */}
          <div className="flex-1" />

          {/* Hub Mode — pinned to bottom */}
          <div className="mt-2">
            <SideNavItem
              item={HUB_MODE_ITEM}
              expanded={expanded}
              active={pathname === HUB_MODE_ITEM.href}
              variant="subtle"
              onNavigate={handleNavigate}
            />
          </div>
        </nav>
      </aside>
    </>
  );
}

interface SideNavItemProps {
  item: NavItem;
  expanded: boolean;
  active: boolean;
  variant?: 'default' | 'subtle';
  onNavigate: () => void;
}

function SideNavItem({ item, expanded, active, variant = 'default', onNavigate }: SideNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      title={!expanded ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2.5',
        'text-sm font-medium transition-colors',
        active
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        variant === 'subtle' && !active && 'text-muted-foreground/60 hover:text-muted-foreground',
        !expanded && 'md:justify-center md:px-0',
      )}
    >
      <Icon size={18} className="flex-shrink-0" aria-hidden="true" />

      <span className={cn('truncate leading-none', !expanded && 'md:hidden')}>
        {item.label}
      </span>
    </Link>
  );
}
