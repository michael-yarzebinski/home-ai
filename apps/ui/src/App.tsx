import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Login } from '@/scenes/auth/login';
import { AdminDashboard } from '@/scenes/admin/dashboard';
import { Chat } from '@/scenes/user/chat';
import { SettingsAutomationRules } from '@/scenes/user/settings/automation-rules';
import { AutomationRulePlaygroundPage } from '@/scenes/dev';
import { EntitySearch } from './scenes/admin/entity-search';
import { ChecklistHome } from './scenes/checklists/home/home';
import { ChecklistsAll } from './scenes/checklists/all/all';
import ChecklistDetails from './scenes/checklists/details/details';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>,
  },
  {
    path: '/entities',
    element: <ProtectedRoute><AppLayout><EntitySearch /></AppLayout></ProtectedRoute>,
  },
  {
    path: '/chat',
    element: <ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>,
  },
  {
    path: '/settings/automation-rules',
    element: <ProtectedRoute><AppLayout><SettingsAutomationRules /></AppLayout></ProtectedRoute>,
  },
  {
    path: '/dev/automation-rule-playground',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <AutomationRulePlaygroundPage />
        </AppLayout>
      </ProtectedRoute>
    ),
  },

  {
    path: '/checklists',
    element: <ProtectedRoute><AppLayout><Outlet /></AppLayout></ProtectedRoute>,
    children: [
      { path: 'home', element: <ChecklistHome /> },
      { path: 'all', element: <ChecklistsAll /> },
      { path: 'details/:id', element: <ChecklistDetails /> },
    ]
  },
  // Catch-all → dashboard (ProtectedRoute will redirect to /login if unauthenticated)
  {
    path: '*',
    element: <ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>,
  },
]);

export function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
