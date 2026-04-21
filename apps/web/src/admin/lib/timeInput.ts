/** Normalize DB / API time values for `<input type="time" />` (expects `HH:mm`). */
export function toTimeInputValue(value: string | null | undefined): string {
  if (value == null || value === '') {
    return '';
  }
  const s = String(value).trim();
  if (/^\d{2}:\d{2}/.test(s)) {
    return s.slice(0, 5);
  }
  return '';
}
