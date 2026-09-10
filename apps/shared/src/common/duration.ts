import { z } from "zod";

export enum DurationUnit {
  MINUTES = "minutes",
  HOURS = "hours",
  DAYS = "days",
}

export const DurationSchema = z.object({
  value: z.number().int().positive(),
  unit: z.enum(DurationUnit),
});

export type Duration = z.infer<typeof DurationSchema>;

export function durationToMs(duration: Duration): number {
  switch (duration.unit) {
    case DurationUnit.MINUTES:
      return duration.value * 60_000;
    case DurationUnit.HOURS:
      return duration.value * 3_600_000;
    case DurationUnit.DAYS:
      return duration.value * 86_400_000;
  }
}

export function subtractDuration(from: Date, duration: Duration): Date {
  return new Date(from.getTime() - durationToMs(duration));
}

export function formatDuration(duration: Duration): string {
  const singular = duration.unit.slice(0, -1);
  const unitLabel = duration.value === 1 ? singular : duration.unit;
  return `${duration.value} ${unitLabel}`;
}

export function durationsEqual(
  a: Duration | undefined,
  b: Duration | undefined,
): boolean {
  if (!a && !b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return a.value === b.value && a.unit === b.unit;
}

export function parseDuration(value: unknown): Duration | undefined {
  const parsed = DurationSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
