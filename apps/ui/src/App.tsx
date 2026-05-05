import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { Login } from '@/pages/auth/login';
import { AdminDashboard } from '@/pages/admin/dashboard';
import { EntitySearch } from '@/pages/admin/entity-search';
import { Chat } from '@/pages/user/chat';
import { SettingsAutomationRules } from '@/pages/user/settings/automation-rules';

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
  // Catch-all → dashboard (ProtectedRoute will redirect to /login if unauthenticated)
  {
    path: '*',
    element: <ProtectedRoute><Navigate to="/" replace /></ProtectedRoute>,
  },
]);

export function App() {
  return (
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
  );
}
