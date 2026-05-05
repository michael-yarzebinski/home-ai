import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { DashboardPeriod, DashboardResult } from '@home-ai/shared/domain/admin/dashboard/dashboard';
import { TemporalIntelligence } from './temporal';
import { SystemOperations } from './system-ops';

export function AdminDashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>('24h');
  const [data, setData] = useState<DashboardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<DashboardResult>(`/v1/admin/dashboard?period=${period}`)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [period]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-red-400">
        Failed to load dashboard: {error}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <TemporalIntelligence
        period={period}
        onPeriodChange={setPeriod}
        data={data?.temporal ?? null}
        loading={loading}
      />
      <SystemOperations data={data?.system ?? null} loading={loading} />
    </div>
  );
}
