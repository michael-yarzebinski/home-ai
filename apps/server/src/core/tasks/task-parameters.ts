import { IsString, IsOptional, IsArray, IsNumber, IsObject, IsBoolean, ValidateNested, IsDefined } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Strongly typed parameter classes extracted directly from apps/server/seeds/01_initial_data.ts.
 * One class per task with a non-empty parameters_schema.
 * Validation is deliberately loose (primarily @IsDefined() + basic types) for v1.
 * Fully compatible with class-transformer + class-validator.
 */

// Nested types
export class GroceryItem {
  @IsString()
  @IsDefined()
  item: string;

  @IsString()
  @IsOptional()
  quantity?: string;
}

// Grocery / Checklist Tasks
export class AddToGroceryListParams {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroceryItem)
  @IsDefined()
  items: GroceryItem[];
}

export class AddToShortTermListParams {
  @IsArray()
  @IsString({ each: true })
  @IsDefined()
  items: string[];
}

export class AddToLongTermListParams {
  @IsArray()
  @IsString({ each: true })
  @IsDefined()
  items: string[];
}

// Calendar Tasks
export class AddCalendarEventParams {
  @IsString()
  @IsDefined()
  title: string;

  @IsString()
  @IsDefined()
  startTime: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attendees?: string[];
}

export class ReadCalendarParams {
  @IsNumber()
  @IsOptional()
  daysAhead?: number;
}

// Memory / Facts
export class StoreFactParams {
  @IsString()
  @IsDefined()
  key: string;

  @IsString()
  @IsDefined()
  value: string;

  @IsString()
  @IsOptional()
  category?: string;
}

export class RetrieveFactParams {
  @IsString()
  @IsDefined()
  key: string;
}

// Device Management

export class AddDeviceParams {
  @IsString()
  @IsDefined()
  friendlyName: string;

  @IsObject()
  @IsOptional()
  notificationGuidance?: Record<string, any>;
}

// Device Query Task
export class QueryDeviceParams {
  @IsString()
  @IsDefined()
  query: string;

  @IsString()
  @IsOptional()
  deviceTypeHint?: string;
}

// Empty-parameter tasks (for completeness)
export class DailySummaryParams {}
export class WeeklyRecapParams {}
export class ShowPendingApprovalsParams {}

// Union for easy typing in services
export type TaskParams =
  | AddToGroceryListParams
  | AddToShortTermListParams
  | AddToLongTermListParams
  | AddCalendarEventParams
  | ReadCalendarParams
  | StoreFactParams
  | RetrieveFactParams
  | AddDeviceParams
  | DailySummaryParams
  | WeeklyRecapParams
  | ShowPendingApprovalsParams;
