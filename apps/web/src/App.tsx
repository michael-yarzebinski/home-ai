import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { StatusPage } from './pages/StatusPage';
import { ChatPage } from './pages/ChatPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import {
  AIAuditAdminEntityPage,
  AppConfigAdminEntityPage,
  AuditAdminEntityPage,
  DevicesAdminEntityPage,
  FactsAdminEntityPage,
  LogsAdminEntityPage,
  NotificationsAdminEntityPage,
  RecipesAdminEntityPage,
  TaskRequestsAdminEntityPage,
  TasksAdminEntityPage,
  UsersAdminEntityPage,
} from './admin/entities/AdminEntityPages';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/status" replace />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="login" element={null} />
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<UsersAdminEntityPage />} />
          <Route path="devices" element={<DevicesAdminEntityPage />} />
          <Route path="facts" element={<FactsAdminEntityPage />} />
          <Route path="app-config" element={<AppConfigAdminEntityPage />} />
          <Route path="tasks" element={<TasksAdminEntityPage />} />
          <Route path="task-requests" element={<TaskRequestsAdminEntityPage />} />
          <Route path="recipes" element={<RecipesAdminEntityPage />} />
          <Route path="notifications" element={<NotificationsAdminEntityPage />} />
          <Route path="audit" element={<AuditAdminEntityPage />} />
          <Route path="ai-audit" element={<AIAuditAdminEntityPage />} />
          <Route path="logs" element={<LogsAdminEntityPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
