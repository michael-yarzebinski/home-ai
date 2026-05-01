import { Role } from "@home-ai/shared/domain/role/role";

export class ToolParameterUtils {
  private static readonly ALL_ROLES = [
    Role.ADMIN,
    Role.PARENT,
    Role.CHILD,
    Role.GUEST,
    Role.READONLY,
    Role.AUTOMATION,
  ] as const;

  static toStringValue(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    return typeof value === "string" ? value : String(value);
  }

  static toNumberValue(value: unknown): unknown {
    if (value === null || value === undefined || value === "") return undefined;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number(value.trim());
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  }

  static toBooleanValue(value: unknown): unknown {
    if (value === null || value === undefined || value === "") return undefined;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return value;
  }

  static toStringArray(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.map((v) => String(v));
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (
        (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
        (trimmed.startsWith("{") && trimmed.endsWith("}"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.map((v) => String(v));
        } catch {
          // Fall back to CSV parsing below.
        }
      }
      return trimmed
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [String(value)];
  }

  static toUnknownArray(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // If parsing fails, treat the full string as a single item.
      }
      return [trimmed];
    }
    return [value];
  }

  static toRawText(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map((v) => String(v)).join("\n");
    return String(value);
  }

  static stripQuotes(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value !== "string") return String(value);
    return value.replace(/["']/g, "").trim();
  }

  /** True when an optional tool arg should be treated as omitted (Zod preprocess → undefined). */
  static isEmptyOptionalInput(value: unknown): boolean {
    return value === undefined || value === null || value === "";
  }

  /**
   * Parses a date string (or Date) and formats for AppleScript `date "..."` literals.
   * Uses en-US locale so Calendar/Notes see a consistent string shape.
   * If the value is not parseable as a date, returns the input unchanged.
   */
  static formatForAppleScriptDate(value: unknown): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return value;
      return value.toLocaleString("en-US");
    }
    const s = typeof value === "string" ? value.trim() : String(value).trim();
    if (!s) return value;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("en-US").replace(',', '');  // For Apple Script.  Replace 4/30/2026, 7:00:00 PM --> 4/30/2026 7:00:00 PM
  }

  static toRoleArray(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    const rawRoles = ToolParameterUtils.toStringArray(value);
    if (!Array.isArray(rawRoles)) return value;

    const normalized = rawRoles
      .map((role) => String(role).trim().toLowerCase())
      .filter(Boolean);

    if (!normalized.length) return [];
    if (normalized.includes("all")) return [...ToolParameterUtils.ALL_ROLES];

    const mapped = normalized.map((role) => ToolParameterUtils.toRole(role));
    return mapped.every((role): role is Role => role !== undefined) ? mapped : value;
  }

  private static toRole(value: string): Role | undefined {
    switch (value) {
      case "admin":
        return Role.ADMIN;
      case "parent":
        return Role.PARENT;
      case "child":
        return Role.CHILD;
      case "guest":
        return Role.GUEST;
      case "readonly":
      case "read-only":
      case "read_only":
      case "read only":
        return Role.READONLY;
      case "automation":
        return Role.AUTOMATION;
      default:
        return undefined;
    }
  }
}
