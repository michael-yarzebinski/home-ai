/** Shared helpers for user DTO transforms and validation (no I/O). */
export class UserUtils {
  static readonly quietTimePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

  static trimQuietCreate(value: unknown): string | undefined {
    if (value == null || String(value).trim() === '') {
      return undefined;
    }
    return String(value).trim().slice(0, 5);
  }

  static trimQuietUpdate(value: unknown): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || String(value).trim() === '') {
      return null;
    }
    return String(value).trim().slice(0, 5);
  }
}
