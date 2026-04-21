type DetailField = {
  label: string;
  value: unknown;
};

type DetailListProps = {
  fields: DetailField[];
};

function renderValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--muted)' }}>—</span>;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }
  return (
    <pre
      className="rounded-md border px-2 py-1 text-xs overflow-auto max-h-52"
      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function DetailList({ fields }: DetailListProps) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
      {fields.map((field) => (
        <div key={field.label} className="contents">
          <dt className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            {field.label}
          </dt>
          <dd className="text-sm break-words" style={{ color: 'var(--fg)' }}>
            {renderValue(field.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
