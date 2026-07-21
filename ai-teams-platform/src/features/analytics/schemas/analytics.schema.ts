import { z } from 'zod';

export const recordEventSchema = z.object({
  type: z.string().min(1, 'Event type is required').max(100),
  source: z.string().min(1, 'Source is required').max(100),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const eventFilterSchema = z.object({
  type: z.string().optional(),
  source: z.string().optional(),
  since: z.string().optional(),
  limit: z.number().int().positive().max(200).optional(),
});

export const recordMetricSchema = z.object({
  name: z.string().min(1, 'Metric name is required').max(100),
  value: z.number(),
  category: z.string().min(1, 'Category is required').max(100),
});

export type RecordEventInput = z.infer<typeof recordEventSchema>;
export type EventFilter = z.infer<typeof eventFilterSchema>;
export type RecordMetricInput = z.infer<typeof recordMetricSchema>;
