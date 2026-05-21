import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plug, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { InsertableDevice } from '@home-ai/shared/domain/device/device';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeviceForm } from '@/components/form/entities/device/device-form';
import type { FormViewMode } from '@/components/form/entities/types';
import { useAdminDeviceById, useAdminDeviceSearch } from '@/api/devices/admin/devices.admin.hooks';
import { useUpdateDevice } from '@/api/devices/devices.hooks';
import { adminDeviceKeys } from '@/api/devices/admin/devices.admin.keys';
import { api } from '@/lib/api';

const SEARCH_CRITERIA = {
  query: '',
  page: 1,
  pageSize: 100,
  includeInactive: true,
} as const;

type DialogState =
  | { mode: 'create' }
  | { mode: 'view' | 'edit'; deviceId: string };

function modeToFormView(mode: DialogState['mode']): FormViewMode {
  if (mode === 'create') return 'CREATE';
  if (mode === 'edit') return 'EDIT';
  return 'READ';
}

/**
 * Dev-only: list devices (admin search) and open {@link DeviceForm} for view / edit / create.
 * Route: `/dev/automation-rule-playground`
 */
export function AutomationRulePlaygroundPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminDeviceSearch(SEARCH_CRITERIA, {
    staleTime: 15_000,
  });
  const updateDevice = useUpdateDevice();
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const detailId = dialog && dialog.mode !== 'create' ? dialog.deviceId : undefined;
  const {
    data: detailDevice,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
  } = useAdminDeviceById(detailId, Boolean(detailId));

  const createDevice = useMutation({
    mutationFn: (body: InsertableDevice) =>
      api.post<unknown>('/v1/admin/devices', body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminDeviceKeys.lists() });
    },
  });

  const closeDialog = useCallback(() => setDialog(null), []);

  const handleSubmit = useCallback(
    async (formData: InsertableDevice) => {
      if (!dialog) return;
      try {
        if (dialog.mode === 'create') {
          await createDevice.mutateAsync(formData);
          toast.success('Device created');
        } else if (dialog.mode === 'edit') {
          await updateDevice.mutateAsync({ id: dialog.deviceId, body: formData });
          toast.success('Device updated');
        }
        closeDialog();
      } catch (e) {
        toast.error((e as Error)?.message ?? 'Request failed');
      }
    },
    [closeDialog, createDevice, dialog, updateDevice],
  );

  const items = data?.items ?? [];
  const formBusy = updateDevice.isPending || createDevice.isPending;
  const showFormBody =
    dialog &&
    (dialog.mode === 'create' ||
      (!detailLoading && !detailError && detailDevice != null));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
            <Plug size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Dev — devices</h1>
            <p className="text-xs text-muted-foreground">
              Admin device list for local testing. Uses <code className="font-mono text-[10px]">DeviceForm</code> in a
              dialog.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
          >
            <RefreshCw className={isFetching ? 'size-3.5 animate-spin' : 'size-3.5'} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setDialog({ mode: 'create' })}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create device
          </button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading devices…</p>}
      {isError && (
        <p className="text-sm text-destructive">{(error as Error)?.message ?? 'Failed to load devices'}</p>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <p className="text-sm text-muted-foreground">No devices returned.</p>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Slug</th>
                <th className="px-3 py-2">Room</th>
                <th className="px-3 py-2 w-[1%] whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-b border-border/80 last:border-0">
                  <td className="px-3 py-2 font-medium">{d.friendlyName}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{d.slug}</td>
                  <td className="px-3 py-2 text-muted-foreground">{d.room ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-1 text-[11px] hover:bg-accent"
                        onClick={() => setDialog({ mode: 'view', deviceId: d.id })}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="rounded border border-border px-2 py-1 text-[11px] hover:bg-accent"
                        onClick={() => setDialog({ mode: 'edit', deviceId: d.id })}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialog != null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === 'create'
                ? 'Create device'
                : dialog?.mode === 'edit'
                  ? 'Edit device'
                  : 'Device'}
            </DialogTitle>
            <DialogDescription className="sr-only">Device form for developer testing.</DialogDescription>
          </DialogHeader>

          {dialog && dialog.mode !== 'create' && detailLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="size-7 animate-spin" />
            </div>
          )}
          {dialog && dialog.mode !== 'create' && detailError && (
            <p className="text-sm text-destructive">
              {(detailErr as Error)?.message ?? 'Failed to load device'}
            </p>
          )}

          {dialog && showFormBody && (
            <DeviceForm
              key={
                dialog.mode === 'create'
                  ? 'create'
                  : `${dialog.mode}-${dialog.deviceId}-${detailDevice?.updatedAt ?? ''}`
              }
              viewMode={modeToFormView(dialog.mode)}
              initialData={dialog.mode === 'create' ? undefined : detailDevice ?? undefined}
              isLoading={dialog.mode !== 'view' ? formBusy : false}
              onSubmit={dialog.mode === 'view' ? () => {} : handleSubmit}
            />
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
              onClick={closeDialog}
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
