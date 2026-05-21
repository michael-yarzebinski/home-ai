import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface EntityModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void; // Now optional
  isLoading?: boolean;
  children: ReactNode;
  saveLabel?: string;
  footer?: ReactNode | null; // New Prop
}

export function EntityModal({
  title,
  isOpen,
  onClose,
  onSave,
  isLoading,
  children,
  saveLabel = "Save Changes",
  footer,
}: EntityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border/50 p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 flex-shrink-0">
          <DialogTitle className="text-sm font-bold uppercase tracking-widest text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Area for Form */}
        <div className="px-6 py-6 overflow-y-auto">
          {children}
        </div>

        {/* Render Footer only if not explicitly null */}
        {footer !== null && (
          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/5 flex-shrink-0">
            {footer ? (
              footer
            ) : (
              <>
                <Button variant="ghost" onClick={onClose} className="text-xs font-bold uppercase tracking-wider">
                  Cancel
                </Button>
                <Button 
                  onClick={onSave} 
                  disabled={isLoading}
                  className="h-9 px-6 text-xs font-bold uppercase tracking-widest"
                >
                  {isLoading && <Loader2 size={14} className="mr-2 animate-spin" />}
                  {saveLabel}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}