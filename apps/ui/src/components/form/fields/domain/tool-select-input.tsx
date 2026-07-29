import { useMemo } from 'react';
import { FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { EntitySelectInput, EntityOption } from "./entity-select-input";
import { useAuth } from "@/contexts/auth-context";
import { useAdminToolSearch } from '@/api/tools/admin/tools.admin.hooks';
import { useToolList } from '@/api/tools/tools.hooks';

interface ToolSelectInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  /** If true, includes inactive/disabled tools. Admin only. */
  includeInactive?: boolean;
}

export function ToolSelectInput<T extends FieldValues>({
  includeInactive = true,
  ...props
}: ToolSelectInputProps<T>) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Define search criteria for admin pagination
  const criteria = useMemo(() => ({
    page: 1,
    pageSize: 100,
    includeInactive: isAdmin ? includeInactive : false,
  }), [isAdmin, includeInactive]);

  // 1. Fetch data based on role
  const adminQuery = useAdminToolSearch(criteria, { 
    enabled: isAdmin 
  });
  
  const userQuery = useToolList({ 
    enabled: !isAdmin 
  });

  const query = isAdmin ? adminQuery : userQuery;

  // 2. Map disparate data structures (Paginated vs Array) to EntityOptions
  const options = useMemo((): EntityOption[] => {
    // Admin hook returns .data.items (Paginated), User hook returns .data (Array)
    const toolList = isAdmin 
      ? (adminQuery.data?.items || []) 
      : (userQuery.data || []);

    return toolList.map((t) => ({
      // Display name
      label: t.friendlyName || t.name,
      // Value required by AutomationRule Trigger/Action schemas
      value: t.name, 
      // Internal ID for keying
      id: t.id,
      // Sublabel provides technical name if friendly name is different
      subLabel: t.name !== t.friendlyName ? `System: ${t.name}` : undefined,
    }));
  }, [adminQuery.data, userQuery.data, isAdmin]);

  return (
    <EntitySelectInput
      {...props}
      options={options}
      isLoading={query.isLoading}
      placeholder={props.placeholder || "Select a tool..."}
      emptyMessage="No tools found"
    />
  );
}