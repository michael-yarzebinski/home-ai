import { z } from "zod";

export const CalendarSummarySchema = z.object({
  name: z.string(),
  friendlyName: z.string(),
  color: z.string().optional(),
});

export type CalendarSummary = z.infer<typeof CalendarSummarySchema>;

export const CalendarEventSchema = z.object({
  uid: z.string(),
  title: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  calendar: z.string(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
