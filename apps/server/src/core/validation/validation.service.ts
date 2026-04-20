import { Injectable, BadRequestException } from '@nestjs/common';
import { validateOrReject, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Reusable ValidationService for strongly-typed task parameters.
 * - Uses class-transformer (plainToInstance) to convert raw AI JSON to typed class.
 * - Uses class-validator (validateOrReject) for validation.
 * - On failure, throws a user-friendly BadRequestException that feeds into the
 *   existing clarification/iMessage flow ("Please provide more information for X").
 *
 * Ties directly into the Store layer and future TaskExecutionService.
 */
@Injectable()
export class ValidationService {
  /**
   * Validates and transforms raw parameters into the target typed class.
   * Example usage (in AI Tools or TaskExecutionService):
   *   const typed = await this.validationService.validateAndTransform(
   *     rawParams, AddCalendarEventParams
   *   );
   * Then safely pass `typed` to taskStore.create(...) or execution.
   */
  async validateAndTransform<T extends object>(
    params: any,
    targetClass: new () => T,
  ): Promise<T> {
    if (!params || typeof params !== 'object') {
      throw new BadRequestException('Please provide valid parameters for this task.');
    }

    const instance = plainToInstance(targetClass, params, {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    });

    try {
      await validateOrReject(instance, {
        whitelist: true,
        forbidNonWhitelisted: false, // Keep loose for v1
        skipMissingProperties: false,
      });
      return instance;
    } catch (errors: any) {
      const message = this.formatValidationErrors(errors, targetClass.name);
      throw new BadRequestException(
        `Please provide more information for ${targetClass.name.replace('Params', '')}: ${message}`,
      );
    }
  }

  private formatValidationErrors(errors: ValidationError[], taskName: string): string {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }
      if (error.children?.length) {
        messages.push(...this.formatValidationErrors(error.children, taskName));
      }
    }

    return messages.length > 0
      ? messages.join('; ')
      : 'required fields are missing or have incorrect types';
  }
}
