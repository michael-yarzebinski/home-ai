import { useMemo } from 'react';
import { FieldValues } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { EntitySelectInput, EntityOption } from "./entity-select-input";
import { useAuth } from "@/contexts/auth-context";
import { useAdminUserSearch } from '@/api/users/admin/users.admin.hooks';
import { useUserSearch } from '@/api/users/users.hooks';

interface UserSelectInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  /** If true, includes inactive users. Admin only. */
  includeInactive?: boolean;
  /** Filter users by a specific role string if supported by criteria */
  roleFilter?: string;
}

export function UserSelectInput<T extends FieldValues>({
  includeInactive = true,
  roleFilter,
  ...props
}: UserSelectInputProps<T>) {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // We set a large pageSize to ensure we get the full list for the dropdown
  const criteria = useMemo(() => ({
    page: 1,
    pageSize: 1000, 
    includeInactive: isAdmin ? includeInactive : false,
    role: roleFilter
  }), [isAdmin, includeInactive, roleFilter]);

  // 1. Trigger the correct search hook based on role
  const adminQuery = useAdminUserSearch(criteria, { 
    enabled: isAdmin 
  });
  
  const userQuery = useUserSearch(criteria, { 
    enabled: !isAdmin 
  });

  const query = isAdmin ? adminQuery : userQuery;

  // 2. Map the Paginated<User> items into EntityOptions
  const options = useMemo((): EntityOption[] => {
    // Note: accessing .items because the return type is Paginated<User>
    const userList = query.data?.items || [];

    return userList.map((u) => ({
      id: u.id,
      label: u.name,
      subLabel: u.phoneNumber,
    }));
  }, [query.data, isAdmin]);

  return (
    <EntitySelectInput
      {...props}
      options={options}
      isLoading={query.isLoading}
      placeholder={props.placeholder || "Select a user..."}
      emptyMessage="No users found"
    />
  );
}