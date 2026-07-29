import { X } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClosableBadgeProps extends BadgeProps {
  onClose?: () => void;
  label: string;
}

export function ClosableBadge({
  label,
  onClose,
  className,
  variant = "secondary",
  ...props
}: ClosableBadgeProps) {
  return (
    <Badge
      variant={variant}
      className={cn(
        "pl-2 pr-1 py-0.5 gap-1 text-xs font-medium transition-all",
        className
      )}
      {...props}
    >
      <span className="truncate max-w-[200px]">{label}</span>
      {onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            "rounded-full p-0.5 outline-none",
            "hover:bg-foreground/20 hover:text-foreground",
            "focus-visible:ring-1 focus-visible:ring-ring",
            "transition-colors"
          )}
          aria-label={`Remove ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}