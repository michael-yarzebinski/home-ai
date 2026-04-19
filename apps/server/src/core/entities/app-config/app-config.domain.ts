export interface AppConfig {
  id: string;
  key: string;
  value: Record<string, any>;   // or any JSON-serializable type
  description?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}