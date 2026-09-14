import { ClsServiceManager } from "nestjs-cls";

export function createTraceId(): string {
  return crypto.randomUUID();
}

/** Trace id for the current CLS turn, if any. */
export function currentTraceId(): string | undefined {
  try {
    const value = ClsServiceManager.getClsService().get<string>("traceId");
    return value || undefined;
  } catch {
    return undefined;
  }
}
