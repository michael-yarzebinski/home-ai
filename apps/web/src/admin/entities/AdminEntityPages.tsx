import {
  AIAuditDto,
  AppConfigDto,
  AuditDto,
  DeviceDto,
  FactDto,
  LogDto,
  NotificationDto,
  RecipeDto,
  TaskDto,
  TaskRequestDto,
  UserDto,
} from '@home-ai/shared';
import { DetailList } from '../components/DetailList';
import { EntityAdminPage } from '../components/EntityAdminPage';
import { HomeAssistantCatalogPanel } from '../components/HomeAssistantCatalogPanel';
import type { Column } from '../components/DataTable';
import { DeviceMutationForm } from '../devices/DeviceMutationForm';

function fmtDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function UsersAdminEntityPage() {
  const columns: Column<UserDto>[] = [
    { id: 'name', header: 'Name', cell: (u) => <span className="font-medium">{u.name}</span> },
    { id: 'role', header: 'Role', cell: (u) => u.role },
    { id: 'messagingId', header: 'Messaging ID', cell: (u) => u.messagingId || '—' },
    { id: 'active', header: 'Active', cell: (u) => (u.active ? 'Yes' : 'No') },
    { id: 'updatedAt', header: 'Updated', cell: (u) => fmtDate(u.updatedAt) },
  ];
  return (
    <EntityAdminPage<UserDto>
      title="Users"
      description="Manage sign-in users and roles."
      queryKeyRoot="users"
      searchPath="/api/admin/users/search"
      columns={columns}
      getRowKey={(u) => u.id}
      detailTitle={(u) => u.name}
      detailSubtitle={(u) => `ID: ${u.id}`}
      renderDetails={(u) => (
        <DetailList
          fields={[
            { label: 'ID', value: u.id },
            { label: 'Name', value: u.name },
            { label: 'Role', value: u.role },
            { label: 'Messaging ID', value: u.messagingId },
            { label: 'Quiet Start', value: u.quietStart },
            { label: 'Quiet End', value: u.quietEnd },
            { label: 'Active', value: u.active },
            { label: 'Created', value: fmtDate(u.createdAt) },
            { label: 'Updated', value: fmtDate(u.updatedAt) },
          ]}
        />
      )}
      createConfig={{
        label: 'Add user',
        buttonLabel: 'Add user',
        endpoint: () => '/api/admin/users',
        method: 'POST',
        getInitialPayload: () => ({ name: '', role: 'user', messagingId: '', accessCode: '' }),
      }}
      updateConfig={{
        label: 'Edit user',
        buttonLabel: 'Edit',
        endpoint: (u) => `/api/admin/users/${encodeURIComponent(u?.id ?? '')}`,
        method: 'PATCH',
        getInitialPayload: (u) => ({
          name: u?.name ?? '',
          role: u?.role ?? '',
          messagingId: u?.messagingId ?? '',
          quietStart: u?.quietStart ?? null,
          quietEnd: u?.quietEnd ?? null,
          active: u?.active ?? true,
        }),
      }}
    />
  );
}

export function DevicesAdminEntityPage() {
  const columns: Column<DeviceDto>[] = [
    { id: 'friendlyName', header: 'Name', cell: (d) => <span className="font-medium">{d.friendlyName}</span> },
    { id: 'slug', header: 'Slug', cell: (d) => d.deviceIdSlug },
    { id: 'ha', header: 'HA Entity', cell: (d) => d.haEntityId ?? '—' },
    { id: 'active', header: 'Active', cell: (d) => (d.active ? 'Yes' : 'No') },
    { id: 'updated', header: 'Updated', cell: (d) => fmtDate(d.updatedAt) },
  ];
  return (
    <div className="space-y-10">
      <HomeAssistantCatalogPanel />
      <EntityAdminPage<DeviceDto>
      title="Devices"
      description="Manage connected devices available to automations."
      wideMutationDialog
      queryKeyRoot="devices"
      searchPath="/api/admin/devices/search"
      columns={columns}
      getRowKey={(d) => d.id}
      detailTitle={(d) => d.friendlyName}
      detailSubtitle={(d) => `ID: ${d.id}`}
      renderDetails={(d) => (
        <DetailList
          fields={[
            { label: 'ID', value: d.id },
            { label: 'Name', value: d.friendlyName },
            { label: 'Slug', value: d.deviceIdSlug },
            { label: 'HA Entity', value: d.haEntityId },
            { label: 'Visible Roles', value: d.visibleToRoles },
            { label: 'Notification Guidance', value: d.notificationGuidance },
            { label: 'Metadata', value: d.metadata },
            { label: 'Active', value: d.active },
            { label: 'Created', value: fmtDate(d.createdAt) },
            { label: 'Updated', value: fmtDate(d.updatedAt) },
          ]}
        />
      )}
      createConfig={{
        label: 'Add device',
        buttonLabel: 'Add device',
        endpoint: () => '/api/admin/devices',
        method: 'POST',
        getInitialPayload: () => ({
          deviceIdSlug: '',
          friendlyName: '',
          haEntityId: '',
          visibleToRoles: [],
          notificationGuidance: [
            {
              enabled: true,
              instruction: 'Describe when to notify (state thresholds, entity patterns, etc.).',
              entityPattern: '',
              rolesToNotify: [],
            },
          ],
          metadata: {},
        }),
      }}
      updateConfig={{
        label: 'Edit device',
        buttonLabel: 'Edit',
        endpoint: (d) => `/api/admin/devices/${encodeURIComponent(d?.id ?? '')}`,
        method: 'PATCH',
        includeActiveInPayload: true,
        getInitialPayload: (d) => ({
          deviceIdSlug: d?.deviceIdSlug ?? '',
          friendlyName: d?.friendlyName ?? '',
          haEntityId: d?.haEntityId ?? null,
          visibleToRoles: d?.visibleToRoles ?? [],
          notificationGuidance: Array.isArray(d?.notificationGuidance) ? d.notificationGuidance : [],
          metadata: d?.metadata ?? {},
          active: d?.active ?? true,
        }),
      }}
      renderCustomMutationForm={(props) => <DeviceMutationForm {...props} />}
    />
    </div>
  );
}

export function TasksAdminEntityPage() {
  const columns: Column<TaskDto>[] = [
    { id: 'taskName', header: 'Task', cell: (t) => <span className="font-medium">{t.taskName}</span> },
    { id: 'description', header: 'Description', cell: (t) => t.description },
    { id: 'active', header: 'Active', cell: (t) => (t.active ? 'Yes' : 'No') },
    { id: 'version', header: 'Version', cell: (t) => t.version },
    { id: 'updated', header: 'Updated', cell: (t) => fmtDate(t.updatedAt) },
  ];
  return (
    <EntityAdminPage<TaskDto>
      title="Tasks"
      description="Task catalog used by orchestration."
      queryKeyRoot="tasks"
      searchPath="/api/admin/tasks/search"
      columns={columns}
      getRowKey={(t) => t.taskName}
      detailTitle={(t) => t.taskName}
      renderDetails={(t) => (
        <DetailList
          fields={[
            { label: 'Task', value: t.taskName },
            { label: 'Description', value: t.description },
            { label: 'Request Roles', value: t.requestRoles },
            { label: 'Execute Roles', value: t.executeRoles },
            { label: 'Notify Roles', value: t.notifyRoles },
            { label: 'Parameters', value: t.parameters },
            { label: 'Active', value: t.active },
            { label: 'Version', value: t.version },
            { label: 'Created', value: fmtDate(t.createdAt) },
            { label: 'Updated', value: fmtDate(t.updatedAt) },
          ]}
        />
      )}
    />
  );
}

export function TaskRequestsAdminEntityPage() {
  const columns: Column<TaskRequestDto>[] = [
    { id: 'readableId', header: 'ID', cell: (r) => String(r.readableId) },
    { id: 'taskName', header: 'Task', cell: (r) => r.taskName },
    { id: 'status', header: 'Status', cell: (r) => r.status },
    { id: 'requester', header: 'Requester', cell: (r) => r.requesterUserId ?? '—' },
    { id: 'updated', header: 'Updated', cell: (r) => fmtDate(r.updatedAt) },
  ];
  return (
    <EntityAdminPage<TaskRequestDto>
      title="Task requests"
      description="Review and manage requested task executions."
      queryKeyRoot="task-requests"
      searchPath="/api/admin/task-requests/search"
      columns={columns}
      getRowKey={(r) => r.id}
      detailTitle={(r) => `Request #${r.readableId}`}
      detailSubtitle={(r) => `ID: ${r.id}`}
      supportsIncludeInactive={false}
      renderDetails={(r) => (
        <DetailList
          fields={[
            { label: 'ID', value: r.id },
            { label: 'Readable ID', value: r.readableId },
            { label: 'Task', value: r.taskName },
            { label: 'Status', value: r.status },
            { label: 'Requester', value: r.requesterUserId },
            { label: 'Executor', value: r.executorUserId },
            { label: 'Requires Approval', value: r.requiresApproval },
            { label: 'Approved By', value: r.approvedByUserId },
            { label: 'Approved At', value: fmtDate(r.approvedAt) },
            { label: 'Quiet Hours Queued', value: r.quietHoursQueued },
            { label: 'Scheduled For', value: fmtDate(r.scheduledFor) },
            { label: 'Executed At', value: fmtDate(r.executedAt) },
            { label: 'Device ID', value: r.deviceId },
            { label: 'Parameters', value: r.parameters },
            { label: 'Attachments', value: r.attachments },
            { label: 'Notes', value: r.notes },
            { label: 'Created', value: fmtDate(r.createdAt) },
            { label: 'Updated', value: fmtDate(r.updatedAt) },
          ]}
        />
      )}
      updateConfig={{
        label: 'Update request status',
        buttonLabel: 'Edit',
        endpoint: (r) => `/api/admin/task-requests/${encodeURIComponent(r?.id ?? '')}/status`,
        method: 'PATCH',
        getInitialPayload: (r) => ({ status: r?.status ?? 'pending', executorUserId: r?.executorUserId ?? null }),
      }}
    />
  );
}

export function FactsAdminEntityPage() {
  const columns: Column<FactDto>[] = [
    { id: 'key', header: 'Key', cell: (f) => <span className="font-medium">{f.key}</span> },
    { id: 'value', header: 'Value', cell: (f) => f.value },
    { id: 'owner', header: 'Owner', cell: (f) => f.ownerUserId ?? '—' },
    { id: 'updated', header: 'Updated', cell: (f) => fmtDate(f.updatedAt) },
  ];
  return (
    <EntityAdminPage<FactDto>
      title="Facts"
      description="Knowledge facts used by assistant context."
      queryKeyRoot="facts"
      searchPath="/api/admin/facts/search"
      supportsIncludeInactive={false}
      columns={columns}
      getRowKey={(f) => f.id}
      detailTitle={(f) => f.key}
      detailSubtitle={(f) => `ID: ${f.id}`}
      renderDetails={(f) => (
        <DetailList
          fields={[
            { label: 'ID', value: f.id },
            { label: 'Key', value: f.key },
            { label: 'Value', value: f.value },
            { label: 'Owner User ID', value: f.ownerUserId },
            { label: 'Visible Roles', value: f.visibleToRoles },
            { label: 'Created', value: fmtDate(f.createdAt) },
            { label: 'Updated', value: fmtDate(f.updatedAt) },
          ]}
        />
      )}
      createConfig={{
        label: 'Add fact',
        buttonLabel: 'Add fact',
        endpoint: () => '/api/admin/facts',
        method: 'POST',
        getInitialPayload: () => ({ key: '', value: '', ownerUserId: null, visibilityRoles: [] }),
      }}
      updateConfig={{
        label: 'Edit fact',
        buttonLabel: 'Edit',
        endpoint: (f) => `/api/admin/facts/${encodeURIComponent(f?.id ?? '')}`,
        method: 'PATCH',
        getInitialPayload: (f) => ({
          key: f?.key ?? '',
          value: f?.value ?? '',
          ownerUserId: f?.ownerUserId ?? null,
          visibleToRoles: f?.visibleToRoles ?? [],
        }),
      }}
    />
  );
}

export function RecipesAdminEntityPage() {
  const columns: Column<RecipeDto>[] = [
    { id: 'title', header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> },
    { id: 'readableId', header: 'Readable ID', cell: (r) => String(r.readableId) },
    { id: 'active', header: 'Active', cell: (r) => (r.active ? 'Yes' : 'No') },
    { id: 'updated', header: 'Updated', cell: (r) => fmtDate(r.updatedAt) },
  ];
  return (
    <EntityAdminPage<RecipeDto>
      title="Recipes"
      description="Manage recipe library and indexing metadata."
      queryKeyRoot="recipes"
      searchPath="/api/admin/recipes/search"
      columns={columns}
      getRowKey={(r) => r.id}
      detailTitle={(r) => r.title}
      detailSubtitle={(r) => `ID: ${r.id}`}
      renderDetails={(r) => (
        <DetailList
          fields={[
            { label: 'ID', value: r.id },
            { label: 'Readable ID', value: r.readableId },
            { label: 'Title', value: r.title },
            { label: 'Source URL', value: r.sourceUrl },
            { label: 'PDF Path', value: r.pdfPath },
            { label: 'Raw Text', value: r.rawText },
            { label: 'Metadata', value: r.metadata },
            { label: 'Active', value: r.active },
            { label: 'Created', value: fmtDate(r.createdAt) },
            { label: 'Updated', value: fmtDate(r.updatedAt) },
          ]}
        />
      )}
      createConfig={{
        label: 'Add recipe',
        buttonLabel: 'Add recipe',
        endpoint: () => '/api/admin/recipes',
        method: 'POST',
        getInitialPayload: () => ({ title: '', sourceUrl: '', pdfPath: '', rawText: '', metadata: {} }),
      }}
      updateConfig={{
        label: 'Edit recipe',
        buttonLabel: 'Edit',
        endpoint: (r) => `/api/admin/recipes/${encodeURIComponent(r?.id ?? '')}`,
        method: 'PATCH',
        getInitialPayload: (r) => ({
          title: r?.title ?? '',
          sourceUrl: r?.sourceUrl ?? '',
          pdfPath: r?.pdfPath ?? '',
          rawText: r?.rawText ?? null,
          metadata: r?.metadata ?? {},
          active: r?.active ?? true,
        }),
      }}
    />
  );
}

export function AppConfigAdminEntityPage() {
  const columns: Column<AppConfigDto>[] = [
    { id: 'key', header: 'Key', cell: (c) => <span className="font-medium">{c.key}</span> },
    { id: 'description', header: 'Description', cell: (c) => c.description ?? '—' },
    { id: 'active', header: 'Active', cell: (c) => (c.active ? 'Yes' : 'No') },
    { id: 'updated', header: 'Updated', cell: (c) => fmtDate(c.updatedAt) },
  ];
  return (
    <EntityAdminPage<AppConfigDto>
      title="App config"
      description="System configuration persisted in database."
      queryKeyRoot="app-config"
      searchPath="/api/admin/app-config/search"
      columns={columns}
      getRowKey={(c) => c.id}
      detailTitle={(c) => c.key}
      detailSubtitle={(c) => `ID: ${c.id}`}
      renderDetails={(c) => (
        <DetailList
          fields={[
            { label: 'ID', value: c.id },
            { label: 'Key', value: c.key },
            { label: 'Value', value: c.value },
            { label: 'Description', value: c.description },
            { label: 'Active', value: c.active },
            { label: 'Created', value: fmtDate(c.createdAt) },
            { label: 'Updated', value: fmtDate(c.updatedAt) },
          ]}
        />
      )}
      updateConfig={{
        label: 'Set active flag',
        buttonLabel: 'Set active',
        endpoint: (c) => `/api/admin/app-config/${encodeURIComponent(c?.key ?? '')}/active`,
        method: 'PATCH',
        getInitialPayload: (c) => ({ active: !(c?.active ?? true) }),
      }}
    />
  );
}

export function NotificationsAdminEntityPage() {
  const columns: Column<NotificationDto>[] = [
    { id: 'message', header: 'Message', cell: (n) => n.messageText },
    { id: 'status', header: 'Status', cell: (n) => n.status },
    { id: 'recipient', header: 'Recipient', cell: (n) => n.recipientUserId ?? '—' },
    { id: 'created', header: 'Created', cell: (n) => fmtDate(n.createdAt) },
  ];
  return (
    <EntityAdminPage<NotificationDto>
      title="Notifications"
      description="Notification queue and delivery states."
      queryKeyRoot="notifications"
      searchPath="/api/admin/notifications/search"
      supportsIncludeInactive={false}
      columns={columns}
      getRowKey={(n) => n.id}
      detailTitle={(n) => `Notification ${n.id}`}
      renderDetails={(n) => (
        <DetailList
          fields={[
            { label: 'ID', value: n.id },
            { label: 'Message', value: n.messageText },
            { label: 'Status', value: n.status },
            { label: 'Recipient User ID', value: n.recipientUserId },
            { label: 'Task Request ID', value: n.taskRequestId },
            { label: 'Scheduled Send After', value: fmtDate(n.scheduledSendAfter) },
            { label: 'Sent At', value: fmtDate(n.sentAt) },
            { label: 'Notes', value: n.notes },
            { label: 'Created', value: fmtDate(n.createdAt) },
            { label: 'Updated', value: fmtDate(n.updatedAt) },
          ]}
        />
      )}
    />
  );
}

export function AuditAdminEntityPage() {
  const columns: Column<AuditDto>[] = [
    { id: 'timestamp', header: 'Timestamp', cell: (a) => fmtDate(a.timestamp) },
    { id: 'entityType', header: 'Entity', cell: (a) => a.entityType },
    { id: 'entityId', header: 'Entity ID', cell: (a) => a.entityId },
    { id: 'action', header: 'Action', cell: (a) => a.action },
  ];
  return (
    <EntityAdminPage<AuditDto>
      title="Audit log"
      description="Entity-level audit trail."
      queryKeyRoot="audit"
      searchPath="/api/admin/audit/search"
      supportsIncludeInactive={false}
      columns={columns}
      getRowKey={(a) => a.id}
      detailTitle={(a) => `${a.action} ${a.entityType}`}
      renderDetails={(a) => (
        <DetailList
          fields={[
            { label: 'ID', value: a.id },
            { label: 'Timestamp', value: fmtDate(a.timestamp) },
            { label: 'Entity Type', value: a.entityType },
            { label: 'Entity ID', value: a.entityId },
            { label: 'Action', value: a.action },
            { label: 'User ID', value: a.userId },
            { label: 'Changes', value: a.changes },
            { label: 'Metadata', value: a.metadata },
            { label: 'Notes', value: a.notes },
          ]}
        />
      )}
    />
  );
}

export function AIAuditAdminEntityPage() {
  const columns: Column<AIAuditDto>[] = [
    { id: 'timestamp', header: 'Timestamp', cell: (a) => fmtDate(a.timestamp) },
    { id: 'eventType', header: 'Event', cell: (a) => a.eventType },
    { id: 'taskName', header: 'Task', cell: (a) => a.taskName ?? '—' },
    { id: 'model', header: 'Model', cell: (a) => a.model ?? '—' },
  ];
  return (
    <EntityAdminPage<AIAuditDto>
      title="AI audit log"
      description="AI interaction and model metadata."
      queryKeyRoot="ai-audit"
      searchPath="/api/admin/ai-audit/search"
      supportsIncludeInactive={false}
      columns={columns}
      getRowKey={(a) => a.id}
      detailTitle={(a) => `${a.eventType} ${fmtDate(a.timestamp)}`}
      renderDetails={(a) => (
        <DetailList
          fields={[
            { label: 'ID', value: a.id },
            { label: 'Timestamp', value: fmtDate(a.timestamp) },
            { label: 'Event Type', value: a.eventType },
            { label: 'User ID', value: a.userId },
            { label: 'Task Request ID', value: a.taskRequestId },
            { label: 'Task Name', value: a.taskName },
            { label: 'Model', value: a.model },
            { label: 'Model Input', value: a.modelInput },
            { label: 'Model Output', value: a.modelOutput },
            { label: 'Latency (ms)', value: a.latencyMs },
            { label: 'Metadata', value: a.metadata },
            { label: 'Notes', value: a.notes },
          ]}
        />
      )}
    />
  );
}

export function LogsAdminEntityPage() {
  const columns: Column<LogDto>[] = [
    { id: 'createdAt', header: 'Created', cell: (l) => fmtDate(l.createdAt) },
    { id: 'severity', header: 'Severity', cell: (l) => l.severity ?? '—' },
    { id: 'message', header: 'Message', cell: (l) => l.message ?? '—' },
    { id: 'userId', header: 'User', cell: (l) => l.userId ?? '—' },
  ];
  return (
    <EntityAdminPage<LogDto>
      title="Application logs"
      description="System log records."
      queryKeyRoot="logs"
      searchPath="/api/admin/logs/search"
      supportsIncludeInactive={false}
      columns={columns}
      getRowKey={(l) => l.id}
      detailTitle={(l) => `${l.severity ?? 'Log'} ${fmtDate(l.createdAt)}`}
      renderDetails={(l) => (
        <DetailList
          fields={[
            { label: 'ID', value: l.id },
            { label: 'Created', value: fmtDate(l.createdAt) },
            { label: 'Severity', value: l.severity },
            { label: 'Message', value: l.message },
            { label: 'User ID', value: l.userId },
            { label: 'Data', value: l.data },
          ]}
        />
      )}
    />
  );
}
