import { z } from "zod";

const ticketText = z.string().trim().min(1).max(4000);

export const ticketCreateSchema = z.object({
  departmentId: z.string().uuid(),
  subject: z.string().trim().min(3).max(200),
  description: ticketText
});

export const ticketCommentCreateSchema = z.object({
  message: ticketText
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketCommentCreateInput = z.infer<
  typeof ticketCommentCreateSchema
>;
