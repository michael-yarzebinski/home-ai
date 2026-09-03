import { LogStore } from "../../core/stores/monitoring/log/log.store";

/**
 * Method decorator that logs IN (with params) and OUT (with duration and result summary)
 * to LogStore as severity "debug". Requires `this.logStore` on the host class.
 *
 * Sensitive parameter names (containing "password", "token", "secret", "key", "code", "hash")
 * are redacted automatically.
 */
export function Trace(): MethodDecorator {
  return function (
    _target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const methodName = String(propertyKey);
    const original = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const logStore: LogStore | undefined = this.logStore;
      const className = this.constructor?.name ?? "Unknown";
      const tag = `${className}.${methodName}`;

      if (logStore) {
        await logStore.create({
          severity: "debug",
          message: `IN ${tag}`,
          metadata: { params: sanitizeParams(args) },
        });
      }

      const start = Date.now();
      try {
        const result = await original.apply(this, args);
        const durationMs = Date.now() - start;

        if (logStore) {
          await logStore.create({
            severity: "debug",
            message: `OUT ${tag} (${durationMs}ms)`,
            metadata: { durationMs, success: true },
          });
        }

        return result;
      } catch (error: any) {
        const durationMs = Date.now() - start;

        if (logStore) {
          await logStore.create({
            severity: "debug",
            message: `OUT ${tag} (${durationMs}ms) ERROR`,
            metadata: {
              durationMs,
              success: false,
              error: error?.message ?? String(error),
            },
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}

const SENSITIVE_KEYS = /password|token|secret|key|code|hash|apikey/i;

function sanitizeParams(args: any[]): any[] {
  return args.map((arg) => {
    if (arg === null || arg === undefined) return arg;
    if (typeof arg !== "object") return arg;
    if (Array.isArray(arg)) return `[Array(${arg.length})]`;

    const sanitized: Record<string, any> = {};
    for (const [k, v] of Object.entries(arg)) {
      sanitized[k] = SENSITIVE_KEYS.test(k) ? "[REDACTED]" : summarizeValue(v);
    }
    return sanitized;
  });
}

function summarizeValue(v: any): any {
  if (v === null || v === undefined) return v;
  if (typeof v === "string") return v.length > 200 ? `${v.slice(0, 200)}…` : v;
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return `[Array(${v.length})]`;
  if (typeof v === "object") return "[Object]";
  return String(v);
}
