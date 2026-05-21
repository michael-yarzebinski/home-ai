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
  
  const selectedItems = watch(name) || [];
  const error = errors[name]?.message as string | undefined;

  // 2. Combine and filter items based on the provided type
  const availableOptions = useMemo(() => {
    if (!details) return [];
    
    const standard = itemType === 'RECURRING' ? [] : details.checklistItems.map(i => ({ ...i, isRecurring: false }));
    const recurring = itemType === 'STANDARD' ? [] : details.recurringChecklistItems.map(i => ({ ...i, isRecurring: true }));
    
    return [...standard, ...recurring];
  }, [details, itemType]);

  const toggleItem = (item: any) => {
    const isSelected = selectedItems.some((selected: any) => selected.id === item.id);
    if (isSelected) {
      setValue(name, selectedItems.filter((selected: any) => selected.id !== item.id) as any);
    } else {
      setValue(name, [...selectedItems, item] as any);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px] bg-background">
        {!checklistId ? (
          <span className="text-sm text-muted-foreground italic">Please select a checklist first...</span>
        ) : isLoading ? (
          <span className="text-sm text-muted-foreground">Loading items...</span>
        ) : availableOptions.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">No items found in this checklist.</span>
        ) : (
          availableOptions.map((item) => {
            const isSelected = selectedItems.some((selected: any) => selected.id === item.id);
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