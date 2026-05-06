import z from "zod";

export enum WeatherTimePeriod {
    CURRENT = 'current',
    HOURLY = 'hourly',
    DAILY = 'daily',
}

export const WeatherRequestSchema = z.object({
    timePeriod: z.enum(WeatherTimePeriod),
    days: z.number().optional(),
});

export type WeatherRequest = z.infer<typeof WeatherRequestSchema>;