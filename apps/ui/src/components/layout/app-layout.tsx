import { useState, type ReactNode } from 'react';
import { TopNav } from './top-nav';
import { SideNav } from './side-nav';
import { MOCK_PENDING_ACTIONS_COUNT, MOCK_USER, PENDING_ACTIONS_ROLES } from '@/mock/user';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );

  const hasPendingActionsPermission = PENDING_ACTIONS_ROLES.includes(MOCK_USER.role);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopNav
        onToggleSidebar={() => setSidebarExpanded((prev) => !prev)}
        hasPendingActionsPermission={hasPendingActionsPermission}
        pendingActionsCount={MOCK_PENDING_ACTIONS_COUNT}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <SideNav
          expanded={sidebarExpanded}
          onClose={() => setSidebarExpanded(false)}
          user={MOCK_USER}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
