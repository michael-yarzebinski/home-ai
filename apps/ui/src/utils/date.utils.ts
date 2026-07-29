/** Parse API / JSON date values into a local {@link Date}, or null if invalid. */
export function parseApiDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format a date value with {@link Intl.DateTimeFormat} options.
 * Returns null when the value is missing or not parseable.
 */
export function formatDate(
  value: unknown,
  format: Intl.DateTimeFormatOptions,
  locale?: Intl.LocalesArgument,
): string | null {
  const date = parseApiDate(value);
  if (!date) return null;

  const hasTime =
    format.hour !== undefined ||
    format.minute !== undefined ||
    format.second !== undefined ||
    format.timeStyle !== undefined;

  if (hasTime) {
    return date.toLocaleString(locale, format);
  }

  return date.toLocaleDateString(locale, format);
}
