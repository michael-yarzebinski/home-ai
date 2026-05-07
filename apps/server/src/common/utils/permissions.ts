interface HasPermissions {
  readRoles: string[];
  writeRoles: string[];
}

/**
 * Filters entities and adds canRead / canWrite flags for the current user.
 */
export function addPermissionFlags<T extends HasPermissions>(
  entities: T[],
  userRole: string,
): Array<T & { canRead: boolean; canWrite: boolean }> {
  return entities.map((entity) => {
    const canRead =
      entity.readRoles.includes("all") || entity.readRoles.includes(userRole);

    const canWrite =
      entity.writeRoles.includes("all") || entity.writeRoles.includes(userRole);

    return {
      ...entity,
      canRead,
      canWrite,
    };
  });
}

/**
 * Same as above but also filters out items the user cannot read.
 */
export function filterVisibleEntities<T extends HasPermissions>(
  entities: T[],
  userRole: string,
): Array<T & { canRead: boolean; canWrite: boolean }> {
  return addPermissionFlags(entities, userRole).filter((e) => e.canRead);
}
