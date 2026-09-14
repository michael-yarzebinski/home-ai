import { parseExpression } from "cron-parser";

const MAX_TICK_WALK = 10_000;
const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type CronDueCheck =
  | { ok: true; due: boolean }
  | { ok: false };

export interface CronDueCheckParams {
  cron: string;
  now: Date;
  createdAt: Date;
  lastGeneratedAt?: Date;
  interval?: number;
  startDate?: string;
}

function parseYmdLocal(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = YMD_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function firstTickOnOrAfter(cron: string, from: Date): Date {
  const justBefore = new Date(from.getTime() - 1);
  return parseExpression(cron, { currentDate: justBefore }).next().toDate();
}

function occurrenceIndex(cron: string, firstOn: Date, tick: Date): number {
  const firstMs = firstOn.getTime();
  const tickMs = tick.getTime();
  if (tickMs < firstMs) return -1;
  if (tickMs === firstMs) return 0;

  const iterator = parseExpression(cron, { currentDate: firstOn });
  for (let index = 1; index <= MAX_TICK_WALK; index += 1) {
    const next = iterator.next().toDate();
    if (next.getTime() >= tickMs) return index;
  }

  throw new Error("Exceeded max cron tick walk");
}

/**
 * Whether a CRON recurring item should generate one checklist item at `now`.
 *
 * `interval` N means every Nth matching tick from the first tick on or after
 * `startDate` (or `createdAt` if unset). Interval 2 + Sunday cron = every other Sunday.
 */
export function isCronTriggerDue(params: CronDueCheckParams): CronDueCheck {
  try {
    const interval = Math.max(1, Math.floor(params.interval ?? 1));
    const previousTick = parseExpression(params.cron, {
      currentDate: params.now,
    })
      .prev()
      .toDate();

    const referenceDate = params.lastGeneratedAt ?? params.createdAt;
    if (previousTick.getTime() <= referenceDate.getTime()) {
      return { ok: true, due: false };
    }

    const anchor = parseYmdLocal(params.startDate) ?? params.createdAt;
    const firstOn = firstTickOnOrAfter(params.cron, anchor);
    if (previousTick.getTime() < firstOn.getTime()) {
      return { ok: true, due: false };
    }

    if (interval <= 1) {
      return { ok: true, due: true };
    }

    const index = occurrenceIndex(params.cron, firstOn, previousTick);
    if (index < 0) {
      return { ok: true, due: false };
    }

    return { ok: true, due: index % interval === 0 };
  } catch {
    return { ok: false };
  }
}
