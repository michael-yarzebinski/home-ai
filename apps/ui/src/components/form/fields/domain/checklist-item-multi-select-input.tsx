import { useMemo } from 'react';
import { FieldValues, useFormContext } from "react-hook-form";
import { BaseFieldProps } from "../types";
import { useChecklistDetail } from '@/api/checklists/checklists.hooks';

interface ChecklistItemMultiSelectProps<T extends FieldValues> extends BaseFieldProps<T> {
  checklistId: string | undefined;
  itemType: 'STANDARD' | 'RECURRING';
}

export function ChecklistItemMultiSelectInput<T extends FieldValues>({
  name,
  label,
  viewMode,
  checklistId,
  itemType
}: ChecklistItemMultiSelectProps<T>) {
  const { watch, setValue, formState: { errors } } = useFormContext();
  
  // 1. Fetch the details for the specific checklist
  const { data: details, isLoading } = useChecklistDetail(checklistId);
  
  const selectedItems: unknown[] = watch(name) || [];
  const error = errors[name]?.message as string | undefined;

  const isItemSelected = (itemId: string) =>
    selectedItems.some((selected) =>
      typeof selected === 'string' ? selected === itemId : (selected as { id: string }).id === itemId,
    );

  // 2. Combine and filter items based on the provided type
  const availableOptions = useMemo(() => {
    if (!details) return [];
    
    const standard = itemType === 'RECURRING' ? [] : details.checklistItems.map(i => ({ ...i, isRecurring: false }));
    const recurring = itemType === 'STANDARD' ? [] : details.recurringChecklistItems.map(i => ({ ...i, isRecurring: true }));
    
    return [...standard, ...recurring];
  }, [details, itemType]);

  const toggleItem = (item: { id: string }) => {
    const isSelected = isItemSelected(item.id);
    if (isSelected) {
      setValue(
        name,
        selectedItems.filter((selected) =>
          typeof selected === 'string' ? selected !== item.id : (selected as { id: string }).id !== item.id,
        ) as never,
      );
    } else {
      setValue(name, [...selectedItems, item.id] as never);
    }
  };

  const isEmptyState =
    !checklistId || isLoading || availableOptions.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      <div
        className={`flex flex-wrap gap-2 rounded-md border border-border/50 bg-muted/20 p-3 min-h-[3.5rem] ${
          isEmptyState ? 'items-center justify-center' : ''
        }`}
      >
        {!checklistId ? (
          <span className="text-sm text-muted-foreground italic text-center">
            Select a parent checklist first.
          </span>
        ) : isLoading ? (
          <span className="text-sm text-muted-foreground">Loading items…</span>
        ) : availableOptions.length === 0 ? (
          <span className="text-sm text-muted-foreground italic text-center">
            No other items in this checklist yet.
          </span>
        ) : (
          availableOptions.map((item) => {
            const isSelected = isItemSelected(item.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={viewMode === 'READ'}
                onClick={() => toggleItem(item)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-2 ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-secondary text-secondary-foreground border-transparent hover:border-muted-foreground'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {item.isRecurring && <span className="opacity-70 text-[10px]">🔄</span>}
                {item.title}
              </button>
            );
          })
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}