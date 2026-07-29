import type { EntityStatus } from '@home-ai/shared/domain/device/device-status';
import { capitalizeWords } from '@/utils/string.utils';

export function parseHomeAssistantEntityId(entityId: string): {
  domain: string;
  objectId: string;
} {
  const dot = entityId.indexOf('.');
  if (dot === -1) {
    return { domain: 'unknown', objectId: entityId };
  }

  return {
    domain: entityId.slice(0, dot),
    objectId: entityId.slice(dot + 1),
  };
}

/** Strip device slug prefix and turn snake_case object id into a label. */
export function formatHomeAssistantEntityName(
  entityId: string,
  deviceSlug?: string,
): string {
  const { objectId } = parseHomeAssistantEntityId(entityId);
  let remainder = objectId;

  if (deviceSlug) {
    const normalizedSlug = deviceSlug.replace(/\./g, '_');
    const prefixes = [`${normalizedSlug}_`, `${deviceSlug}_`];

    for (const prefix of prefixes) {
      if (remainder.startsWith(prefix)) {
        remainder = remainder.slice(prefix.length);
        break;
      }
    }

    if (!remainder && (objectId === normalizedSlug || objectId === deviceSlug)) {
      remainder = normalizedSlug.replace(/_/g, ' ');
    }
  }

  if (!remainder) {
    return capitalizeWords(objectId.replace(/_/g, ' '));
  }

  return capitalizeWords(remainder.replace(/_/g, ' '));
}

export function getHomeAssistantEntitySortOrder(domain: string): number {
  switch (domain) {
    case 'sensor':
    case 'binary_sensor':
      return 0;
    case 'switch':
      return 1;
    case 'select':
    case 'button':
      return 2;
    default:
      return 3;
  }
}

export function sortHomeAssistantEntities<T extends { entityId: string }>(
  entities: T[],
  deviceSlug?: string,
): T[] {
  return [...entities].sort((a, b) => {
    const domainA = parseHomeAssistantEntityId(a.entityId).domain;
    const domainB = parseHomeAssistantEntityId(b.entityId).domain;
    const orderDiff =
      getHomeAssistantEntitySortOrder(domainA) - getHomeAssistantEntitySortOrder(domainB);

    if (orderDiff !== 0) return orderDiff;

    return formatHomeAssistantEntityName(a.entityId, deviceSlug).localeCompare(
      formatHomeAssistantEntityName(b.entityId, deviceSlug),
    );
  });
}

export function isHomeAssistantSensorDomain(domain: string): boolean {
  return domain === 'sensor' || domain === 'binary_sensor';
}

/** Split entities into always-visible sensors vs collapsible controls/other types. */
export function partitionHomeAssistantEntities(
  entities: EntityStatus[],
  deviceSlug?: string,
): { sensors: EntityStatus[]; others: EntityStatus[] } {
  const sorted = sortHomeAssistantEntities(entities, deviceSlug);
  const sensors: EntityStatus[] = [];
  const others: EntityStatus[] = [];

  for (const entity of sorted) {
    const { domain } = parseHomeAssistantEntityId(entity.entityId);
    if (isHomeAssistantSensorDomain(domain)) {
      sensors.push(entity);
    } else {
      others.push(entity);
    }
  }

  return { sensors, others };
}
