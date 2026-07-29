import { useState, KeyboardEvent } from 'react';
import { useFormContext, useWatch, Controller, FieldValues } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { ClosableBadge } from '@/components/ui/closable-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BaseFieldProps } from "../types";
import { cn } from '@/lib/utils';

export function ArrayInput<T extends FieldValues>(props: BaseFieldProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-2">
      <Label>{props.label}</Label>
      {isReadMode ? <ArrayView {...props} /> : <ArrayEdit {...props} />}
      {props.description && !isReadMode && (
        <p className="text-xs text-muted-foreground">{props.description}</p>
      )}
    </div>
  );
}

/**
 * READ VIEW
 * Displays the array as a series of outline badges.
 */
function ArrayView<T extends FieldValues>({ name }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name }) || [];
  const tags = Array.isArray(value) ? value : [];

  if (tags.length === 0) {
    return <div className="text-sm text-muted-foreground italic py-1">None</div>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 py-1">
      {tags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="outline" className="font-normal">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

/**
 * EDIT VIEW
 * Handles the interactive logic for adding/removing items in the array.
 */
function ArrayEdit<T extends FieldValues>({ name, placeholder }: BaseFieldProps<T>) {
  const { control } = useFormContext<T>();
  const [draft, setDraft] = useState('');

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const tags: string[] = Array.isArray(field.value) ? field.value : [];

        const addTag = () => {
          // Strip commas and trim whitespace
          const trimmed = draft.trim().replace(/,/g, '');
          if (trimmed && !tags.includes(trimmed)) {
            field.onChange([...tags, trimmed]);
            setDraft('');
          }
        };

        const removeTag = (tagToRemove: string) => {
          field.onChange(tags.filter((t) => t !== tagToRemove));
        };

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
            // Remove the last item if backspace is pressed on an empty input
            removeTag(tags[tags.length - 1]);
          }
        };

        return (
          <div className="space-y-3">
            {/* Visual Pills Section */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <ClosableBadge
                    key={tag}
                    label={tag}
                    onClose={() => removeTag(tag)}
                  />
                ))}
              </div>
            )}
            
            {/* Input Section */}
            <div className="relative">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (draft.trim()) addTag();
                }}
                placeholder={tags.length === 0 ? (placeholder || "Type and hit enter...") : "Add more..."}
                className={cn(fieldState.error && "border-destructive")}
              />
              <div className="mt-1.5 flex justify-between items-center px-1">
                <span className="text-[10px] text-muted-foreground">
                  Press <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Enter</kbd> to add
                </span>
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}