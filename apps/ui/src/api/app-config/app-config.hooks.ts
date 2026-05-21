import { useQuery } from '@tanstack/react-query';
import { appConfigApi } from '@/api/app-config/app-config.api';
import { appConfigKeys } from '@/api/app-config/app-config.keys';

export function useAppConfigList() {
  return useQuery({
    queryKey: appConfigKeys.list(),
    queryFn: () => appConfigApi.getAll(),
  });
}

export function useAppConfigById(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: appConfigKeys.detail(id ?? ''),
    queryFn: () => appConfigApi.getById(id!),
    enabled: enabled && Boolean(id),
  });
}
