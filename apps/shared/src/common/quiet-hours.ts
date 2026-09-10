import { DEFAULT_TIMEZONE } from "./timezone";

/** Default zone until user.timezone is wired through. */
export const DEFAULT_QUIET_HOURS_TIMEZONE = DEFAULT_TIMEZONE;

export type QuietHoursClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function parseClockTime(
  value: string | undefined,
): { hour: number; minute: number } | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) {
    return undefined;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return undefined;
  }

  return { hour, minute };
}

export function zonedClock(date: Date, timeZone: string): QuietHoursClock {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function isInQuietHours(
  now: Date,
  quietHoursStart: string | undefined,
  quietHoursEnd: string | undefined,
  timeZone: string = DEFAULT_QUIET_HOURS_TIMEZONE,
): boolean {
  const start = parseClockTime(quietHoursStart);
  const end = parseClockTime(quietHoursEnd);
  if (!start || !end) {
    return false;
  }

  const clock = zonedClock(now, timeZone);
  const nowMinutes = clock.hour * 60 + clock.minute;
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }

  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

export function nextQuietHoursEnd(
  now: Date,
  quietHoursStart: string | undefined,
  quietHoursEnd: string | undefined,
  timeZone: string = DEFAULT_QUIET_HOURS_TIMEZONE,
): Date {
  const start = parseClockTime(quietHoursStart);
  const end = parseClockTime(quietHoursEnd);
  if (!start || !end) {
    return now;
  }

  const clock = zonedClock(now, timeZone);
  const nowMinutes = clock.hour * 60 + clock.minute;
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  const overnight = startMinutes > endMinutes;
  const endIsTomorrow = overnight
    ? nowMinutes >= startMinutes
    : nowMinutes >= endMinutes;

  const endDate = addLocalDays(
    { ...clock, hour: end.hour, minute: end.minute },
    endIsTomorrow ? 1 : 0,
  );

  return zonedWallTimeToUtc(timeZone, endDate);
}

function addLocalDays(clock: QuietHoursClock, days: number): QuietHoursClock {
  const utc = Date.UTC(
    clock.year,
    clock.month - 1,
    clock.day + days,
    clock.hour,
    clock.minute,
  );
  const shifted = new Date(utc);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

function zonedWallTimeToUtc(
  timeZone: string,
  wall: QuietHoursClock,
): Date {
  const wanted = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
  );
  const guess = new Date(wanted);
  const actual = zonedClock(guess, timeZone);
  const actualAsUtc = Date.UTC(
    actual.year,
    actual.month - 1,
    actual.day,
    actual.hour,
    actual.minute,
  );
  return new Date(guess.getTime() + (wanted - actualAsUtc));
}
