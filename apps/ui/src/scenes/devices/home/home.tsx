import { Link } from 'react-router-dom';
import { Home, Loader2, Plug } from 'lucide-react';
import { DeviceHomeCard } from './device-home-card';
import { useDeviceHomeData } from './use-device-home-data';

export function DeviceHome() {
  const { devicesWithStatus, isLoading, isLoadingDevices } = useDeviceHomeData();

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-accent rounded-xl border border-border/50 shrink-0">
            <Home className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Devices</h1>
            <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
              Your registered devices and live status
            </p>
          </div>
        </div>

        <Link
          to="/devices/all"
          className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline shrink-0 pt-1"
        >
          View all devices
        </Link>
      </div>

      {isLoadingDevices ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin mr-2" />
          Loading devices…
        </div>
      ) : devicesWithStatus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Plug className="size-8 mb-3 opacity-40" />
          <p className="text-sm font-medium">No devices available</p>
          <p className="text-xs mt-1 max-w-xs">
            Devices you can read will appear here once they are registered.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devicesWithStatus.map(({ device, status, statusLoading, statusError }) => (
            <DeviceHomeCard
              key={device.id}
              device={device}
              status={status}
              statusLoading={statusLoading}
              statusError={statusError}
            />
          ))}
        </div>
      )}

      {isLoading && !isLoadingDevices && devicesWithStatus.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Refreshing live status…
        </p>
      )}
    </div>
  );
}
