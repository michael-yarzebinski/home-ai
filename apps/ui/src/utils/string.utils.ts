/** Uppercase the first character; leaves the rest of the string unchanged. */
export function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Uppercase the first character of each whitespace-separated word. */
export function capitalizeWords(value: string): string {
  if (!value) return value;
  return value
    .split(/(\s+)/)
    .map((part) => (/\s/.test(part) ? part : capitalizeFirst(part)))
    .join('');
}
