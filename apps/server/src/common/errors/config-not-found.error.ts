export class ConfigNotFoundError extends Error {
  constructor(key: string) {
    super(`Config with key ${key} not found or is inactive`);
    this.name = "ConfigNotFoundError";
  }
}
