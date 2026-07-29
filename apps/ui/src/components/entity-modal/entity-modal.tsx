import { ReactNode, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface EntityModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;

  // ── External-submit footer (formId mode) ───────────────────────────────────
  // When formId is provided the modal manages its own footer: a Save button on
  // the right that submits the <form id={formId}> and an optional Delete button
  // on the left with a two-step confirmation. Pass saveLabel to customise the
  // Save button text.
  formId?: string;
  saveLabel?: string;
  isLoading?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;

  // ── Legacy / custom footer ─────────────────────────────────────────────────
  // Passing footer={null} suppresses the footer entirely (form owns its submit).
  // Passing a ReactNode renders it as a fully custom footer.
  // Omitting footer renders the default Save / Cancel buttons (uses onSave).
  footer?: ReactNode | null;
  onSave?: () => void;
}

export function EntityModal({
  title,
  isOpen,
  onClose,
  children,
  formId,
  saveLabel = "Save changes",
  isLoading,
  onDelete,
  isDeleting,
  footer,
  onSave,
}: EntityModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmingDelete(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border/50 p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 flex-shrink-0">
          <DialogTitle className="text-sm font-bold uppercase tracking-widest text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 overflow-y-auto">
          {children}
        </div>

        {/* ── Unified footer when formId is provided ── */}
        {formId ? (
          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/5 flex-shrink-0 flex items-center justify-between gap-3">
            {/* Delete — left side */}
            <div className="flex items-center gap-2">
              {onDelete && !confirmingDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={isDeleting || isLoading}
                >
                  <Trash2 size={12} className="mr-1.5" />
                  Delete
                </Button>
              )}
              {onDelete && confirmingDelete && (
                <>
                  <span className="text-xs text-destructive font-medium">Are you sure?</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete()}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <><Loader2 size={12} className="mr-1.5 animate-spin" />Deleting…</>
                      : <><Trash2 size={12} className="mr-1.5" />Yes, delete</>
                    }
                  </Button>
                </>
              )}
            </div>

            {/* Save — right side */}
            <Button
              type="submit"
              form={formId}
              disabled={isLoading || isDeleting}
              className="h-9 px-6 text-xs font-bold uppercase tracking-widest"
            >
              {isLoading && <Loader2 size={14} className="mr-2 animate-spin" />}
              {isLoading ? 'Saving…' : saveLabel}
            </Button>
          </DialogFooter>
        ) : footer !== null ? (
          /* ── Custom or default footer ── */
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
        ) : null /* footer={null} → no footer at all */}
      </DialogContent>
    </Dialog>
  );
}
