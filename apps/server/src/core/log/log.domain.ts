export interface Log {
    id?: string;
    severity?: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    data?: Record<string, any>;
    userId?: string;
  }