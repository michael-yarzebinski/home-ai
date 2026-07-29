export class EntityNotFoundError extends Error {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found or is inactive`);
    this.name = "EntityNotFoundError";
  }
}
