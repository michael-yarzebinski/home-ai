export interface Task {
  taskName: string;
  description: string;
  requestRoles: string[];
  executeRoles: string[];
  notifyRoles: string[];
  parameters?: any;
  active: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}