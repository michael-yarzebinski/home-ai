import { SyntheticEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFormContext, useWatch, Controller, FieldValues, ControllerRenderProps, Path } from "react-hook-form";
import { JsonEditor, type JsonEditorProps } from '@dileep/modern-json-react';
import '@dileep/modern-json-react/styles.css';
import { BaseFieldProps } from "../types";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** JSON specific props */
export interface JsonInputProps<T extends FieldValues> extends BaseFieldProps<T> {
  editorProps?: Omit<JsonEditorProps, 'value' | 'onChange' | 'readOnly'>;
}

export function JsonInput<T extends FieldValues>(props: JsonInputProps<T>) {
  const { viewMode, forceReadMode } = props;
  const isReadMode = viewMode === 'READ' || forceReadMode;

  return (
    <div className="flex flex-col gap-1.5">
      <Label>{props.label}</Label>
      {isReadMode ? <JsonView {...props} /> : <JsonEdit {...props} />}
      {props.description && !isReadMode && (
        <p className="text-xs text-muted-foreground">{props.description}</p>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---

function JsonView<T extends FieldValues>({ name }: JsonInputProps<T>) {
  const { control } = useFormContext<T>();
  const value = useWatch({ control, name });

  if (value === undefined || value === null) {
    return <div className="py-1 text-sm text-muted-foreground italic">No data</div>;
  }

  return (
    <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words max-h-80 overflow-auto rounded-md border bg-muted/20 p-4 shadow-inner">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function JsonEdit<T extends FieldValues>(props: JsonInputProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      name={props.name}
      control={control}
      render={({ field, fieldState }) => (
        <JsonEditorRhfBridge
          field={field}
          errorMessage={fieldState.error?.message}
          {...props}
        />
      )}
    />
  );
}

// --- LOGIC HELPERS (The "Bridge") ---

function JsonEditorRhfBridge<T extends FieldValues>({
  field,
  label,
  errorMessage,
  editorProps,
}: { field: ControllerRenderProps<T, Path<T>>; errorMessage?: string } & JsonInputProps<T>) {
  
  const [rawText, setRawText] = useState(() => editorTextFromFormValue(field.value));
  const rawTextRef = useRef(rawText);
  rawTextRef.current = rawText;

  const [editorKey, setEditorKey] = useState(0);
  const [detachValueProp, setDetachValueProp] = useState(false);

  // Prevents jumping/auto-format while typing
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => setDetachValueProp(true));
    return () => cancelAnimationFrame(frame);
  }, [editorKey]);

  useEffect(() => {
    if (!detachValueProp) return;
    if (bufferMatchesForm(field.value, rawTextRef.current)) return;
    setRawText(editorTextFromFormValue(field.value));
    setDetachValueProp(false);
    setEditorKey((k) => k + 1);
  }, [field.value, detachValueProp]);

  const preventSubmit = (e: SyntheticEvent) => {
    const button = (e.target as HTMLElement).closest('button');
    if (button && button.type !== 'button') e.preventDefault();
  };

  return (
    <div 
      className="json-input-editor-root rounded-md border overflow-hidden" 
      onClickCapture={preventSubmit}
    >
      <JsonEditor
        key={editorKey}
        value={detachValueProp ? undefined : rawText}
        onChange={(parsed: unknown, raw: string) => {
          setRawText(raw);
          field.onChange(parsed);
        }}
        onBlur={field.onBlur}
        theme="auto"
        height={320}
        validationMode="onBlur"
        className={cn(errorMessage && "ring-1 ring-destructive")}
        {...editorProps}
      />
    </div>
  );
}

// Formatting helpers remain the same as your logic
function editorTextFromFormValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function bufferMatchesForm(formValue: unknown, raw: string): boolean {
  const t = raw.trim();
  if (t === '') return formValue === undefined || formValue === null;
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed) === JSON.stringify(formValue);
  } catch {
    return true; // Keep buffer if JSON is currently invalid
  }
}