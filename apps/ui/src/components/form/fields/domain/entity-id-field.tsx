import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';

export function EntityIdField({ value }: { value?: string }) {
  const { user } = useAuth();
  
  // Only show for Admins and only if the ID exists (not on CREATE)
  if (user?.role !== 'admin' || !value) return null;

  return (
    <div className="mb-6 pb-4 border-b border-muted">
      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
        Record ID
      </Label>
      <p className="mt-1 font-mono text-sm text-foreground select-all bg-muted/30 px-2 py-1 rounded w-fit">
        {value}
      </p>
    </div>
  );
}