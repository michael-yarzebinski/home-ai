import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredToken } from '../../api';
import { AdminSignIn } from './AdminSignIn';
import { AdminSidebar } from './AdminSidebar';

export function AdminLayout() {
  const token = getStoredToken();
  const { pathname } = useLocation();

  if (!token) {
    if (pathname !== '/admin/login') {
      return <Navigate to="/admin/login" replace />;
    }
    return <AdminSignIn />;
  }

  if (pathname === '/admin/login') {
    return <Navigate to="/admin/users" replace />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <AdminSidebar />
        <div className="flex-1 min-w-0 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
