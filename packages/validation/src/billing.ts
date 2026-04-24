import { z } from "zod";

export const billingServiceTypeSchema = z.enum(["WVS", "DMS", "DNSMS"]);
export const billingCurrencySchema = z.enum(["INR", "USD"]).default("INR");

export const billingPackageQuerySchema = z.object({
  serviceType: billingServiceTypeSchema.optional()
});

export const billingCouponValidateSchema = z.object({
  code: z.string().trim().min(1).max(64),
  currency: billingCurrencySchema,
  items: z
    .array(
      z.object({
        packageId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99)
      })
    )
    .min(1)
    .max(20)
});

export const billingOrderCreateSchema = billingCouponValidateSchema
  .omit({ code: true })
  .extend({
    couponCode: z.string().trim().min(1).max(64).optional()
  });

export const razorpayPaymentVerifySchema = z.object({
  razorpayOrderId: z.string().trim().min(1).max(160),
  razorpayPaymentId: z.string().trim().min(1).max(160),
  razorpaySignature: z.string().trim().min(20).max(256)
});

export const paypalPaymentCaptureSchema = z.object({
  paypalOrderId: z.string().trim().min(1).max(160)
});

export type BillingServiceTypeInput = z.infer<typeof billingServiceTypeSchema>;
export type BillingCurrencyInput = z.infer<typeof billingCurrencySchema>;
export type BillingPackageQueryInput = z.infer<
  typeof billingPackageQuerySchema
>;
export type BillingCouponValidateInput = z.infer<
  typeof billingCouponValidateSchema
>;
export type BillingOrderCreateInput = z.infer<typeof billingOrderCreateSchema>;
export type RazorpayPaymentVerifyInput = z.infer<
  typeof razorpayPaymentVerifySchema
>;
export type PayPalPaymentCaptureInput = z.infer<
  typeof paypalPaymentCaptureSchema
>;
