/** Sentinel select value when the stored cron is not a known preset. */
export const CRON_CUSTOM_VALUE = '__custom__';

export interface CronPreset {
  label: string;
  cron: string;
  group: string;
}

function formatClockTime(hour: number, minute = 0): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return minute === 0 ? `${displayHour} ${period}` : `${displayHour}:${displayMinute} ${period}`;
}

function dailyAt(hour: number, minute = 0): CronPreset {
  return {
    group: 'Daily',
    label: `Every day at ${formatClockTime(hour, minute)}`,
    cron: `${minute} ${hour} * * *`,
  };
}

function weekdaysAt(hour: number, minute = 0): CronPreset {
  return {
    group: 'Weekday times',
    label: `Weekdays at ${formatClockTime(hour, minute)}`,
    cron: `${minute} ${hour} * * 1-5`,
  };
}

const INTERVAL_PRESETS: CronPreset[] = [
  { group: 'Intervals', label: 'Every minute', cron: '*/1 * * * *' },
  { group: 'Intervals', label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { group: 'Intervals', label: 'Every 10 minutes', cron: '*/10 * * * *' },
  { group: 'Intervals', label: 'Every 30 minutes', cron: '*/30 * * * *' },
  { group: 'Intervals', label: 'Every hour', cron: '0 * * * *' },
  { group: 'Intervals', label: 'Every 2 hours', cron: '0 */2 * * *' },
  { group: 'Intervals', label: 'Every 3 hours', cron: '0 */3 * * *' },
  { group: 'Intervals', label: 'Every 4 hours', cron: '0 */4 * * *' },
  { group: 'Intervals', label: 'Every 6 hours', cron: '0 */6 * * *' },
  { group: 'Intervals', label: 'Every 12 hours', cron: '0 */12 * * *' },
];

const WEEKLY_PRESETS: CronPreset[] = [
  { group: 'Weekly', label: 'Every week (Sunday at midnight)', cron: '0 0 * * 0' },
  { group: 'Weekly', label: 'Every weekday (Mon–Fri at midnight)', cron: '0 0 * * 1-5' },
  { group: 'Weekly', label: 'Every weekend (Sat–Sun at midnight)', cron: '0 0 * * 6,0' },
];

const MONTHLY_PRESETS: CronPreset[] = [
  { group: 'Monthly & yearly', label: '1st of every month at midnight', cron: '0 0 1 * *' },
  { group: 'Monthly & yearly', label: '1st of every month at noon', cron: '0 12 1 * *' },
  { group: 'Monthly & yearly', label: 'Every 2 months (1st at midnight)', cron: '0 0 1 */2 *' },
  { group: 'Monthly & yearly', label: 'Every quarter (1st at midnight)', cron: '0 0 1 */3 *' },
  { group: 'Monthly & yearly', label: 'Every 6 months (1st at midnight)', cron: '0 0 1 */6 *' },
  { group: 'Monthly & yearly', label: 'Every year (Jan 1 at midnight)', cron: '0 0 1 1 *' },
];

const BUSINESS_HOURS_PRESETS: CronPreset[] = [
  {
    group: 'Business hours',
    label: 'Every 30 minutes, 9 AM–5 PM',
    cron: '*/30 9-17 * * *',
  },
  {
    group: 'Business hours',
    label: 'Every 30 minutes, 9 AM–6 PM',
    cron: '*/30 9-18 * * *',
  },
  {
    group: 'Business hours',
    label: 'Every 30 minutes, 10 AM–7 PM',
    cron: '*/30 10-19 * * *',
  },
];

/** NestJS CronExpression-style presets mapped to standard 5-field cron. */
export const CRON_PRESETS: CronPreset[] = [
  ...INTERVAL_PRESETS,
  ...Array.from({ length: 24 }, (_, hour) => dailyAt(hour)),
  ...WEEKLY_PRESETS,
  ...Array.from({ length: 24 }, (_, hour) => weekdaysAt(hour)),
  weekdaysAt(9, 30),
  weekdaysAt(11, 30),
  ...MONTHLY_PRESETS,
  ...BUSINESS_HOURS_PRESETS,
];

export const CRON_PRESET_GROUPS = [
  'Intervals',
  'Daily',
  'Weekly',
  'Weekday times',
  'Monthly & yearly',
  'Business hours',
] as const;

export function normalizeCronExpression(cron: string): string {
  return cron.trim().replace(/\s+/g, ' ');
}

export function findCronPreset(cron: string | undefined | null): CronPreset | undefined {
  if (!cron) return undefined;
  const normalized = normalizeCronExpression(cron);
  return CRON_PRESETS.find((preset) => normalizeCronExpression(preset.cron) === normalized);
}

/** Human-readable label for display; falls back to the raw cron string. */
export function getCronDisplayLabel(cron: string | undefined | null): string {
  if (!cron?.trim()) return 'Not configured';
  return findCronPreset(cron)?.label ?? normalizeCronExpression(cron);
}

export function getCronPresetsByGroup(group: (typeof CRON_PRESET_GROUPS)[number]): CronPreset[] {
  return CRON_PRESETS.filter((preset) => preset.group === group);
}
