import { z } from "zod";

export const wvsTargetCreateSchema = z.object({
  targetUrl: z.string().trim().url().max(2048)
});

export const wvsTargetVerifySchema = z.object({
  token: z.string().trim().min(20).max(200)
});

export const wvsScanEngineSchema = z.enum(["ZAP", "NMAP"]);

export const wvsScanCreateSchema = z.object({
  targetId: z.string().uuid(),
  scanTypes: z
    .array(wvsScanEngineSchema)
    .min(1)
    .max(2)
    .transform((values) => [...new Set(values)])
});

export const wvsScheduleTypeSchema = z.enum([
  "One Time",
  "Weekly",
  "Every 15 days",
  "Monthly"
]);

export const wvsScanScheduleSchema = z.object({
  scheduleDate: z.string().trim().date(),
  scheduleTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  scheduleType: wvsScheduleTypeSchema,
  limits: z.number().int().min(1).max(100).optional()
});

export const wvsRetryConfigSchema = z
  .object({
    autoRetry: z.boolean().optional().default(true),
    maxRetries: z.number().int().min(0).max(10),
    retryIntervalHours: z.number().int().min(0).max(720)
  })
  .superRefine((value, context) => {
    if (value.autoRetry && value.maxRetries < 1) {
      context.addIssue({
        code: "custom",
        path: ["maxRetries"],
        message: "maxRetries must be at least 1 when autoRetry is enabled"
      });
    }

    if (value.autoRetry && value.retryIntervalHours < 1) {
      context.addIssue({
        code: "custom",
        path: ["retryIntervalHours"],
        message:
          "retryIntervalHours must be at least 1 when autoRetry is enabled"
      });
    }
  });

export type WvsTargetCreateInput = z.infer<typeof wvsTargetCreateSchema>;
export type WvsTargetVerifyInput = z.infer<typeof wvsTargetVerifySchema>;
export type WvsScanEngine = z.infer<typeof wvsScanEngineSchema>;
export type WvsScanCreateInput = z.input<typeof wvsScanCreateSchema>;
export type WvsScanCreateParsedInput = z.output<typeof wvsScanCreateSchema>;
export type WvsScanScheduleInput = z.infer<typeof wvsScanScheduleSchema>;
export type WvsRetryConfigInput = z.infer<typeof wvsRetryConfigSchema>;
