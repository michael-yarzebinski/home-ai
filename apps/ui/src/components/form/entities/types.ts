import { FieldValues, UseFormReturn } from "react-hook-form";

export type FormViewMode = 'CREATE' | 'EDIT' | 'READ';

/**
 * The standard props for any Entity Form component in the system.
 */
export interface EntityFormProps<TFieldValues extends FieldValues, TEntity = any> {
  /** The data to populate the form (e.g. from an API or selection) */
  initialData?: Partial<TEntity>;
  /** CREATE / EDIT / READ */
  viewMode: FormViewMode;
  /** Callback for a valid form submission */
  onSubmit: (data: TFieldValues) => void;
  /** Global loading state (e.g. while the mutation is pending) */
  isLoading?: boolean;
  /** * Optional: Allows the parent (like a Modal) to access the RHF instance 
   * for external triggering of submit/reset.
   */
  onFormInstance?: (form: UseFormReturn<TFieldValues>) => void;
}