import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Plug } from 'lucide-react';
import { toast } from 'sonner';
import { Role } from '@home-ai/shared/domain/role/role';
import type { InsertableDevice, UpdatableDevice } from '@home-ai/shared/domain/device/device';
import { useDeviceById, useUpdateDevice, useSoftDeleteDevice } from '@/api/devices/devices.hooks';
import { useDeviceEventsInfiniteForDevice } from '@/api/device-events/device-events.hooks';
import { useHomeAssistantDeviceStatus } from '@/api/home-assistant/home-assistant.hooks';
import { useAuth } from '@/contexts/auth-context';
import { EntityModal } from '@/components/entity-modal/entity-modal';
import { DeviceForm } from '@/components/form/entities/device/device-form';
import { Button } from '@/components/ui/button';
import { DeviceDetailsSummary } from './device-details-summary';
import { DeviceEventsPanel } from './device-events-panel';

function userHasWriteAccess(writeRoles: Role[], userRole: string | undefined): boolean {
  if (!userRole) return false;
  return writeRoles.includes(userRole as Role);
}

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: device, isLoading, isError, error } = useDeviceById(id);
  const {
    data: status,
    isLoading: isStatusLoading,
    error: statusError,
  } = useHomeAssistantDeviceStatus(id, Boolean(device));
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    isError: isEventsError,
    error: eventsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDeviceEventsInfiniteForDevice(id, 20, Boolean(device));

  const { mutate: updateDevice, isPending: isUpdating } = useUpdateDevice();
  const { mutate: deleteDevice, isPending: isDeleting } = useSoftDeleteDevice();

  const canWrite = device ? userHasWriteAccess(device.writeRoles as Role[], user?.role) : false;

  const events = useMemo(
    () => eventsData?.pages.flatMap((p) => p.items) ?? [],
    [eventsData],
  );
  const eventsTotal = eventsData?.pages[0]?.total ?? 0;

  const handleDeleteDevice = () => {
    if (!id) return;
    deleteDevice(id, {
      onSuccess: () => {
        toast.success('Device deleted');
        navigate('/devices/all');
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleUpdateDevice = (formData: InsertableDevice) => {
    if (!id) return;
    const body: UpdatableDevice = {
      friendlyName: formData.friendlyName,
      aliases: formData.aliases,
      room: formData.room,
      category: formData.category,
      readRoles: formData.readRoles,
      writeRoles: formData.writeRoles,
      llmModelType: formData.llmModelType,
      extraMetadata: formData.extraMetadata,
    };
    updateDevice(
      { id, body },
      {
        onSuccess: () => {
          toast.success('Device saved');
          setIsEditModalOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Missing device id.{' '}
        <Link to="/devices/all" className="text-primary hover:underline">
          Back to all devices
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        Loading device…
      </div>
    );
  }

  if (isError || !device) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-destructive">{error?.message ?? 'Device not found.'}</p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/devices/all">
            <ArrowLeft className="size-4 mr-2" />
            All devices
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
            <Plug className="h-6 w-6 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {device.friendlyName}
            </h1>
            <p className="text-xs font-mono text-muted-foreground/80 mt-0.5 truncate">{device.slug}</p>
          </div>
        </div>
        {canWrite && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 text-xs font-bold uppercase tracking-wider"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil className="size-3.5 mr-1.5" />
            Edit device
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <DeviceDetailsSummary
            device={device}
            status={status}
            statusLoading={isStatusLoading}
            statusError={statusError}
          />
        </div>

        <div className="min-w-0 w-full shrink-0 lg:flex lg:max-h-[calc(100vh-10rem)] lg:w-80 lg:flex-col lg:sticky lg:top-4">
          <DeviceEventsPanel
            events={events}
            total={eventsTotal}
            isLoading={isEventsLoading}
            isError={isEventsError}
            error={eventsError}
            hasNextPage={!!hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        </div>
      </div>

      <EntityModal
        title="Edit device"
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formId="edit-device-form"
        saveLabel="Update Configuration"
        isLoading={isUpdating}
        onDelete={canWrite ? handleDeleteDevice : undefined}
        isDeleting={isDeleting}
      >
        <DeviceForm
          key={String(device.updatedAt ?? device.id)}
          formId="edit-device-form"
          viewMode="EDIT"
          isLoading={isUpdating}
          onSubmit={handleUpdateDevice}
          initialData={device}
        />
      </EntityModal>
    </div>
  );
}
