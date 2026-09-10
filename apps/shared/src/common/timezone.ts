/** Eastern Time. Use this instead of the abbreviation EST (which ignores DST). */
export const DEFAULT_TIMEZONE = "America/New_York";

/** Household/server timezone in `app_config`. */
export const TIMEZONE_CONFIG_KEY = "TIMEZONE";

export function resolveTimezone(timezone?: string | null): string {
  if (!timezone?.trim()) {
    return DEFAULT_TIMEZONE;
  }

  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

export function formatInTimezone(
  date: Date,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}
