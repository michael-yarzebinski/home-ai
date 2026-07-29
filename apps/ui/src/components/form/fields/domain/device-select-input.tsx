import { useMemo } from 'react';
import { FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { EntitySelectInput, EntityOption } from "./entity-select-input";
import { useAuth } from "@/contexts/auth-context";
import { useAdminDeviceSearch } from '@/api/devices/admin/devices.admin.hooks';
import { useDeviceSearch } from '@/api/devices/devices.hooks';

interface DeviceSelectInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  /** If true, includes inactive/offline devices. Admin only. */
  includeInactive?: boolean;
  /** Filter by device type (e.g., 'sensor', 'actuator', 'camera') */
  typeFilter?: string;
}

export function DeviceSelectInput<T extends FieldValues>({
  includeInactive = true,
  typeFilter,
  ...props
}: DeviceSelectInputProps<T>) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Define search criteria for pagination
  const criteria = useMemo(() => ({
    page: 1,
    pageSize: 100,
    includeInactive: isAdmin ? includeInactive : false,
    type: typeFilter
  }), [isAdmin, includeInactive, typeFilter]);

  // 1. Fetch data based on role
  const adminQuery = useAdminDeviceSearch(criteria, { 
    enabled: isAdmin 
  });
  
  const userQuery = useDeviceSearch(criteria, { 
    enabled: !isAdmin 
  });

  const query = isAdmin ? adminQuery : userQuery;

  // 2. Map Paginated<Device> to EntityOptions
  const options = useMemo((): EntityOption[] => {
    const deviceList = query.data?.items || [];

    return deviceList.map((d) => ({
      id: d.id,
      label: d.friendlyName || d.slug || 'Unknown Device',
      // Sublabel shows the location/room or the device type for clarity
      subLabel: d.room ? `Location: ${d.room}` : d.category,
    }));
  }, [query.data]);

  return (
    <EntitySelectInput
      {...props}
      options={options}
      isLoading={query.isLoading}
      placeholder={props.placeholder || "Select a device..."}
      emptyMessage="No devices found"
    />
  );
}