import { z, ZodSchema } from "zod";

export class ToolUtils {
    /**
   * Generically parses a string from AppleScript into a typed object.
   * Use this for single results like status codes or device trigger context.
   */
    static parse<T>(rawString: string, schema: ZodSchema<T>): T | null {
        const trimmed = rawString?.trim();

        if (!trimmed || trimmed === "" || trimmed === "null") {
            return null;
        }

        const parsedJson = JSON.parse(trimmed);
        return schema.parse(parsedJson);
    }

    /**
     * Generically parses a string from AppleScript into a typed array.
     * Handles empty lists ("[]") automatically.
     */
    static parseArray<T>(rawString: string, schema: ZodSchema<T>): T[] {
        const trimmed = rawString?.trim();

        if (!trimmed || trimmed === "[]" || trimmed === "") {
            return [];
        }

        const parsedJson = JSON.parse(trimmed);

        return z.array(schema).parse(parsedJson);
    }
}