import { useMemo } from 'react';
import { FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { EntitySelectInput, EntityOption } from "./entity-select-input";
import { useAuth } from "@/contexts/auth-context";
import { useAdminChecklistSearch } from '@/api/checklists/admin/checklists.admin.hooks';
import { useChecklistSearch } from '@/api/checklists/checklists.hooks';

interface ChecklistSelectInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  /** If true, includes inactive checklists. Admin only. */
  includeInactive?: boolean;
}

export function ChecklistSelectInput<T extends FieldValues>({
  includeInactive = true,
  ...props
}: ChecklistSelectInputProps<T>) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Define search criteria - consistent across both hooks
  const criteria = useMemo(() => ({
    page: 1,
    pageSize: 100,
    includeInactive: isAdmin ? includeInactive : false,
  }), [isAdmin, includeInactive]);

  // 1. Fetch data based on role using search hooks for both
  const adminQuery = useAdminChecklistSearch(criteria, { 
    enabled: isAdmin 
  });
  
  const userQuery = useChecklistSearch(criteria, { 
    enabled: !isAdmin 
  });

  const query = isAdmin ? adminQuery : userQuery;

  // 2. Map Paginated<Checklist> to EntityOptions
  const options = useMemo((): EntityOption[] => {
    // Both hooks now return a paginated object with an .items array
    const checklistList = query.data?.items || [];

    return checklistList.map((c) => ({
      id: c.id,
      label: c.name,
      // Sublabel shows the description for better selection context
      subLabel: c.description || (c.active ? 'Active' : 'Inactive'),
    }));
  }, [query.data]);

  return (
    <EntitySelectInput
      {...props}
      options={options}
      isLoading={query.isLoading}
      placeholder={props.placeholder || "Select a checklist..."}
      emptyMessage="No checklists found"
    />
  );
}