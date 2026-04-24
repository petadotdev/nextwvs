import { z } from "zod";
import { billingServiceTypeSchema } from "./billing";

const moneySchema = z.number().min(0).max(999999999999.99);
const percentageSchema = z.number().min(0).max(100);
const statusSchema = z.enum(["active", "inactive"]);

export const adminPackageMutationSchema = z.object({
  serviceType: billingServiceTypeSchema,
  packageName: z.string().trim().min(1).max(160),
  rescansPriceInr: moneySchema,
  rescansPriceUsd: moneySchema,
  rescans: z.number().int().min(0).max(1000000),
  priceInr: moneySchema,
  priceUsd: moneySchema,
  teamManageAccess: z.boolean().optional().default(false)
});

export const adminTaxMutationSchema = z
  .object({
    taxType: z.enum(["GST", "IGST", "Other Tax"]),
    cgst: percentageSchema.nullable().optional(),
    sgst: percentageSchema.nullable().optional(),
    igst: percentageSchema.nullable().optional(),
    taxName: z.string().trim().min(1).max(160).nullable().optional(),
    otherTax: percentageSchema.nullable().optional()
  })
  .superRefine((value, context) => {
    if (value.taxType === "GST" && (value.cgst == null || value.sgst == null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GST requires CGST and SGST values",
        path: ["cgst"]
      });
    }

    if (value.taxType === "IGST" && value.igst == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IGST requires an IGST value",
        path: ["igst"]
      });
    }

    if (value.taxType === "Other Tax" && value.otherTax == null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Other Tax requires an otherTax value",
        path: ["otherTax"]
      });
    }
  })
  .transform((value) => ({
    taxType: value.taxType,
    cgst: value.taxType === "GST" ? (value.cgst ?? null) : null,
    sgst: value.taxType === "GST" ? (value.sgst ?? null) : null,
    igst: value.taxType === "IGST" ? (value.igst ?? null) : null,
    taxName: value.taxName ?? null,
    otherTax: value.taxType === "Other Tax" ? (value.otherTax ?? null) : null
  }));

export const adminCouponMutationSchema = z.object({
  name: z.string().trim().min(1).max(160),
  code: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .transform((value) => value.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: moneySchema,
  expiryDate: z.string().datetime(),
  usageLimit: z.number().int().min(0).max(1000000).default(1)
});

export const adminStatusMutationSchema = z.object({
  status: statusSchema
});

export type AdminPackageMutationInput = z.infer<
  typeof adminPackageMutationSchema
>;
export type AdminTaxMutationInput = z.infer<typeof adminTaxMutationSchema>;
export type AdminCouponMutationInput = z.infer<
  typeof adminCouponMutationSchema
>;
export type AdminStatusMutationInput = z.infer<
  typeof adminStatusMutationSchema
>;
