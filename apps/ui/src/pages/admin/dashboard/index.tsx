import { TemporalIntelligence } from './temporal';
import { SystemOperations } from './system-ops';

export function AdminDashboard() {
  return (
    <div className="space-y-12 pb-12">
      <TemporalIntelligence />
      <SystemOperations />
    </div>
  );
}
