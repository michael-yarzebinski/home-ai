import { z } from "zod";
import { ChecklistSchema } from "./checklist";
import { ChecklistItemSchema } from "./checklist-item";
import { RecurringChecklistItemSchema } from "./recurring-checklist-item";

export const ChecklistDetailsSchema = z.object({
  checklist: ChecklistSchema,
  checklistItems: z.array(ChecklistItemSchema),
  recurringChecklistItems: z.array(RecurringChecklistItemSchema),
});

export type ChecklistDetails = z.infer<typeof ChecklistDetailsSchema>;
