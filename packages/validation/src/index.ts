import { z } from "zod";

export const emailSchema = z.string().trim().email();
export const actorTypeSchema = z.enum(["customer_user", "admin_employee"]);

export const passwordSchema = z.string().min(8).max(128);
export const nameSchema = z.string().trim().min(1).max(120);
export const nullableTrimmedString = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional();

export const customerSignInSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const customerSignUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  contactNumber: nullableTrimmedString,
  countryCode: nullableTrimmedString,
  referralCode: nullableTrimmedString,
  utmOffer: nullableTrimmedString,
  targetUrl: nullableTrimmedString
});

export const adminSignInSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const verificationTokenConsumeSchema = z.object({
  token: z.string().trim().min(20),
  purpose: z.string().trim().min(1).max(64)
});

export const sessionCookieSchema = z.string().trim().min(20);
export const forgotPasswordSchema = z.object({
  email: emailSchema
});
export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  password: passwordSchema
});
export const twoFactorVerifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().trim().min(6).max(8)
});
export const phoneSendOtpSchema = z.object({
  userId: z.string().uuid(),
  contactNumber: z.string().trim().min(4).max(32),
  countryCode: z.string().trim().min(1).max(8)
});
export const phoneVerifyOtpSchema = z.object({
  challengeId: z.string().uuid(),
  userId: z.string().uuid(),
  code: z.string().trim().length(6)
});

export type CustomerSignInInput = z.infer<typeof customerSignInSchema>;
export type CustomerSignUpInput = z.infer<typeof customerSignUpSchema>;
export type AdminSignInInput = z.infer<typeof adminSignInSchema>;
export type VerificationTokenConsumeInput = z.infer<
  typeof verificationTokenConsumeSchema
>;

export * from "./admin-billing";
export * from "./billing";
export * from "./customer-workspace";
export * from "./tickets";
export * from "./wvs";
