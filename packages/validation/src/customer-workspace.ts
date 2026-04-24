import { z } from "zod";

const emailSchema = z.string().trim().email();
const nameSchema = z.string().trim().min(1).max(120);
const passwordSchema = z.string().min(8).max(128);
const nullableTrimmedString = z.string().trim().min(1).nullable().optional();

const simpleText = z.string().trim().min(1).max(160);
const nullableText = z.string().trim().max(160).nullable().optional();
const nullableLongText = z.string().trim().max(2000).nullable().optional();
const statusSchema = z.enum(["active", "inactive"]);

export const customerWorkspaceProfileUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  contactNumber: nullableTrimmedString,
  countryCode: nullableTrimmedString,
  country: nullableText,
  state: nullableText,
  companyName: nullableText,
  address: nullableLongText,
  gstNumber: nullableText,
  taxId: nullableText
});

export const customerWorkspacePasswordChangeSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: passwordSchema
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Password confirmation does not match",
    path: ["confirmPassword"]
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"]
  });

export const notificationPreferencesSchema = z
  .object({
    paymentSuccess: z.boolean().optional(),
    paymentFailure: z.boolean().optional(),
    paymentPending: z.boolean().optional(),
    scanStarted: z.boolean().optional(),
    scanCompleted: z.boolean().optional(),
    scanFailed: z.boolean().optional(),
    targetCreated: z.boolean().optional(),
    targetDeleted: z.boolean().optional(),
    ticketCreated: z.boolean().optional(),
    ticketUpdated: z.boolean().optional(),
    vulnerabilityNotifications: z.boolean().optional(),
    globalUnsub: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one preference must be provided"
  });

export const feedbackSubmissionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().max(2000).optional().default(""),
  featureRequest: z.string().trim().max(2000).optional().default(""),
  repeatUse: z.enum(["Yes", "No", "Maybe"]).optional().default("Yes")
});

export const socInterestSubmissionSchema = z.object({
  useCase: z.string().trim().min(1).max(2000),
  companySize: z.string().trim().max(120).optional().default(""),
  contactPreference: z
    .enum(["email", "phone", "either"])
    .optional()
    .default("email"),
  notes: z.string().trim().max(2000).optional().default("")
});

export const customerPermissionKeySchema = z.enum([
  "billing:view",
  "dashboard:view",
  "departments:create",
  "departments:delete",
  "departments:status",
  "departments:update",
  "dms:view",
  "dnsms:view",
  "employees:create",
  "employees:delete",
  "employees:status",
  "employees:update",
  "feedback:create",
  "notifications:update",
  "roles:create",
  "roles:delete",
  "roles:permissions",
  "roles:status",
  "roles:update",
  "team:view",
  "tickets:create",
  "tickets:update",
  "tickets:view",
  "two_factor:disable",
  "two_factor:enable",
  "wvs:view"
]);

export const customerDepartmentCreateSchema = z.object({
  name: simpleText
});

export const customerDepartmentUpdateSchema = z.object({
  name: simpleText
});

export const customerStatusUpdateSchema = z.object({
  status: statusSchema
});

export const customerRoleCreateSchema = z.object({
  name: simpleText,
  departmentId: z.string().uuid().nullable().optional(),
  permissions: z.array(customerPermissionKeySchema).optional().default([])
});

export const customerRoleUpdateSchema = z.object({
  name: simpleText,
  departmentId: z.string().uuid().nullable().optional()
});

export const customerRolePermissionsUpdateSchema = z.object({
  permissions: z.array(customerPermissionKeySchema)
});

export const customerEmployeeCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  contactNumber: nullableTrimmedString,
  countryCode: nullableTrimmedString,
  departmentId: z.string().uuid().nullable().optional(),
  roleId: z.string().uuid().nullable().optional(),
  teamManageAccess: z.boolean().optional().default(false)
});

export const customerEmployeeUpdateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  contactNumber: nullableTrimmedString,
  countryCode: nullableTrimmedString,
  departmentId: z.string().uuid().nullable().optional(),
  roleId: z.string().uuid().nullable().optional(),
  teamManageAccess: z.boolean().optional().default(false)
});

export type CustomerWorkspaceProfileUpdateInput = z.infer<
  typeof customerWorkspaceProfileUpdateSchema
>;
export type CustomerWorkspacePasswordChangeInput = z.infer<
  typeof customerWorkspacePasswordChangeSchema
>;
export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;
export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
export type SocInterestSubmissionInput = z.infer<typeof socInterestSubmissionSchema>;
export type CustomerDepartmentCreateInput = z.infer<typeof customerDepartmentCreateSchema>;
export type CustomerDepartmentUpdateInput = z.infer<typeof customerDepartmentUpdateSchema>;
export type CustomerStatusUpdateInput = z.infer<typeof customerStatusUpdateSchema>;
export type CustomerRoleCreateInput = z.infer<typeof customerRoleCreateSchema>;
export type CustomerRoleUpdateInput = z.infer<typeof customerRoleUpdateSchema>;
export type CustomerRolePermissionsUpdateInput = z.infer<
  typeof customerRolePermissionsUpdateSchema
>;
export type CustomerEmployeeCreateInput = z.infer<typeof customerEmployeeCreateSchema>;
export type CustomerEmployeeUpdateInput = z.infer<typeof customerEmployeeUpdateSchema>;
