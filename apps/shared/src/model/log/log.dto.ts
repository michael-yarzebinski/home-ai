/** Read-only admin listing for application log rows. */
export class LogDto {
  id!: string;
  severity?: string | null;
  message?: string | null;
  data?: Record<string, unknown> | null;
  userId?: string | null;
  createdAt!: string;
}
