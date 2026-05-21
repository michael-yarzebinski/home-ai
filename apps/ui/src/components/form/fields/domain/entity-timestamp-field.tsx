import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';

export function EntityTimestampField({ createdAt, updatedAt }: { createdAt?: Date; updatedAt?: Date }) {
  const { user } = useAuth();

  if (user?.role !== 'admin' || !createdAt) return null;

  const formatDate = (d: Date) => format(new Date(d), 'MMM d, yyyy h:mm a');

  return (
    <div className="mt-10 pt-4 border-t border-dashed flex flex-wrap gap-x-8 gap-y-2 opacity-60">
      <div className="text-[11px]">
        <span className="font-semibold uppercase mr-2 text-muted-foreground">Created:</span>
        <span className="text-foreground">{formatDate(createdAt)}</span>
      </div>
      {updatedAt && (
        <div className="text-[11px]">
          <span className="font-semibold uppercase mr-2 text-muted-foreground">Modified:</span>
          <span className="text-foreground">{formatDate(updatedAt)}</span>
        </div>
      )}
    </div>
  );
}