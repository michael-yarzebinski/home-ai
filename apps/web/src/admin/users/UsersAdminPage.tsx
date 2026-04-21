import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AdminPanel } from '../components/AdminPanel';
import { AdminButton } from '../components/buttons';
import { CrudDialog } from '../components/CrudDialog';
import { DataTable, type Column } from '../components/DataTable';
import { apiFetch } from '../../api';
import { parseApiError } from '../lib/parseApiError';
import { UserForm, USER_FORM_ID } from './UserForm';
import type { UserPublic } from './types';

async function fetchUsers(): Promise<UserPublic[]> {
  const res = await apiFetch('/api/admin/users/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  const data = (await res.json()) as { items: UserPublic[]; total: number };
  return data.items;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

function quietLabel(u: UserPublic) {
  const a = u.quietStart?.toString().slice(0, 5) ?? '';
  const b = u.quietEnd?.toString().slice(0, 5) ?? '';
  if (!a && !b) {
    return '—';
  }
  return `${a || '—'} → ${b || '—'}`;
}

export function UsersAdminPage() {
  const qc = useQueryClient();
  const listQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: fetchUsers });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<UserPublic | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const t = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(t);
  }, [banner]);

  const createUser = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res));
      }
      return res.json() as Promise<UserPublic>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDialogOpen(false);
      setMutationError(null);
      setBanner('User created');
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res));
      }
      return res.json() as Promise<UserPublic>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDialogOpen(false);
      setMutationError(null);
      setBanner('User updated');
    },
  });

  const busy = createUser.isPending || updateUser.isPending;

  function openCreate() {
    setDialogMode('create');
    setEditingUser(null);
    setMutationError(null);
    setDialogOpen(true);
  }

  function openEdit(user: UserPublic) {
    setDialogMode('edit');
    setEditingUser(user);
    setMutationError(null);
    setDialogOpen(true);
  }

  async function handleFormSubmit(body: Record<string, unknown>) {
    setMutationError(null);
    try {
      if (dialogMode === 'create') {
        await createUser.mutateAsync(body);
      } else if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, body });
      }
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : 'Request failed');
    }
  }

  const columns: Column<UserPublic>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (u) => <span className="font-medium">{u.name}</span>,
    },
    {
      id: 'role',
      header: 'Role',
      className: 'whitespace-nowrap',
      cell: (u) => (
        <span
          className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          {u.role}
        </span>
      ),
    },
    {
      id: 'messaging',
      header: 'Messaging ID',
      cell: (u) => (
        <span className="font-mono text-xs text-pretty break-all">{u.messagingId || '—'}</span>
      ),
    },
    {
      id: 'active',
      header: 'Active',
      className: 'whitespace-nowrap',
      cell: (u) => (u.active ? 'Yes' : 'No'),
    },
    {
      id: 'quiet',
      header: 'Quiet hours',
      className: 'whitespace-nowrap text-xs',
      cell: (u) => quietLabel(u),
    },
    {
      id: 'updated',
      header: 'Updated',
      className: 'whitespace-nowrap text-xs',
      cell: (u) => formatWhen(u.updatedAt),
    },
    {
      id: 'actions',
      header: '',
      className: 'w-28 text-right',
      cell: (u) => (
        <AdminButton type="button" variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => openEdit(u)}>
          Edit
        </AdminButton>
      ),
    },
  ];

  return (
    <>
      <AdminPanel
        title="Users"
        description="Create and manage people who can sign in, use chat, and appear in task permissions."
        actions={
          <AdminButton type="button" onClick={openCreate}>
            Add user
          </AdminButton>
        }
      >
        {banner ? (
          <div
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/35 dark:text-emerald-100"
            role="status"
          >
            {banner}
          </div>
        ) : null}

        {listQuery.isError ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load users'}
          </div>
        ) : null}

        <DataTable<UserPublic>
          columns={columns}
          rows={listQuery.data ?? []}
          getRowKey={(u) => u.id}
          emptyMessage="No users yet. Add the first account to get started."
          isLoading={listQuery.isPending}
        />
      </AdminPanel>

      <CrudDialog
        open={dialogOpen}
        onClose={() => {
          if (busy) {
            return;
          }
          setDialogOpen(false);
        }}
        title={dialogMode === 'create' ? 'Add user' : 'Edit user'}
        subtitle={
          dialogMode === 'edit' && editingUser
            ? `ID ${editingUser.id}`
            : 'Access code must be at least 5 characters.'
        }
        formId={USER_FORM_ID}
        busy={busy}
        footer={
          <>
            <AdminButton
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                if (!busy) {
                  setDialogOpen(false);
                }
              }}
            >
              Cancel
            </AdminButton>
            <AdminButton type="submit" form={USER_FORM_ID} disabled={busy}>
              {busy ? 'Saving…' : dialogMode === 'create' ? 'Create user' : 'Save changes'}
            </AdminButton>
          </>
        }
      >
        <UserForm
          key={`${dialogMode}-${editingUser?.id ?? 'new'}`}
          mode={dialogMode}
          user={editingUser}
          disabled={busy}
          apiError={mutationError}
          onSubmit={handleFormSubmit}
        />
      </CrudDialog>
    </>
  );
}
