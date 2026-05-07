import { BadRequestException, PipeTransform } from "@nestjs/common";

/**
 * Duck-typed interface so the pipe works with any Zod version — even across
 * separate node_modules installs in a monorepo.
 */
interface ZodLike {
  safeParse(
    value: unknown,
  ):
    | { success: true; data: unknown }
    | { success: false; error: { flatten(): unknown } };
}

/**
 * Per-param pipe that validates an incoming value against a Zod schema.
 * Bypasses the global class-validator ValidationPipe for the decorated param.
 *
 * Usage:
 *   @Body(new ZodValidationPipe(CreateDeviceSchema)) dto: InsertableDevice
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodLike) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return result.data;
  }
}
