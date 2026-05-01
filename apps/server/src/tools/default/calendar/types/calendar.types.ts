import { z } from "zod";

export const CalendarSummarySchema = z.object({
  name: z.string().min(1),
  friendlyName: z.string().min(1),
  color: z.string().optional(),
});

export type CalendarSummary = z.infer<typeof CalendarSummarySchema>;

export const CalendarEventSchema = z.object({
  uid: z.string().min(1),
  title: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().optional(),
  location: z.string().optional(),
  calendar: z.string().min(1),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
