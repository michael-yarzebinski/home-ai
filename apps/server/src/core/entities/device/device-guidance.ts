import type { NotificationGuidanceRule } from './device.domain';

/**
 * DB may store legacy flat objects `{ "sensor.foo": "text" }` or the new array of rules.
 */
export function parseNotificationGuidanceFromRecord(raw: unknown): NotificationGuidanceRule[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.map(normalizeRuleFromUnknown);
  }
  if (typeof raw === 'object') {
    const entries = Object.entries(raw as Record<string, unknown>);
    if (entries.length === 0) {
      return [];
    }
    return entries.map(([key, value]) => ({
      entityPattern: key,
      enabled: true,
      instruction: typeof value === 'string' ? value : JSON.stringify(value),
      rolesToNotify: undefined,
    }));
  }
  return [];
}

function normalizeRuleFromUnknown(x: unknown): NotificationGuidanceRule {
  if (x != null && typeof x === 'object' && !Array.isArray(x)) {
    const o = x as Record<string, unknown>;
    return {
      entityPattern: typeof o.entityPattern === 'string' ? o.entityPattern : undefined,
      enabled: o.enabled === false ? false : true,
      instruction: typeof o.instruction === 'string' ? o.instruction : '',
      rolesToNotify: Array.isArray(o.rolesToNotify) ? (o.rolesToNotify as unknown[]).map(String) : undefined,
    };
  }
  return { enabled: true, instruction: '' };
}
