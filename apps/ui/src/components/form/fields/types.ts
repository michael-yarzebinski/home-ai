import { FieldValues, Path } from "react-hook-form";

export type FieldViewMode = 'READ' | 'EDIT' | 'CREATE';

export interface BaseFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  viewMode: FieldViewMode;
  forceReadMode?: boolean;
  placeholder?: string;
  description?: string;
  className?: string;
}

export interface ReadOnlyFieldProps {
  label: string;
  value?: string | number | Date;
  className?: string;
}