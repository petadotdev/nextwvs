import { CustomerWorkspaceRepository, TicketRepository } from "@petadot/db";
import type {
  TicketCommentCreateInput,
  TicketCreateInput
} from "@petadot/validation";
import { ApiError, errorResponse, successResponse } from "./auth/api";
import {
  getAdminSessionPrincipal,
  getCustomerSessionPrincipal
} from "./auth/server";

async function requireCustomerTicketActor() {
  const principal = await getCustomerSessionPrincipal();

  if (!principal) {
    throw new ApiError(401, "UNAUTHENTICATED", "Customer session is required");
  }

  const profile = await new CustomerWorkspaceRepository().findProfileByUserId(
    principal.userId
  );

  if (!profile) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return { principal, profile };
}

async function requireAdminTicketActor() {
  const principal = await getAdminSessionPrincipal();

  if (!principal) {
    throw new ApiError(401, "UNAUTHENTICATED", "Admin session is required");
  }

  return { principal };
}

function mapTicket(
  ticket: Awaited<ReturnType<TicketRepository["listCustomerTickets"]>>[number]
) {
  return {
    id: ticket.id,
    tenantId: ticket.tenantId,
    userId: ticket.userId,
    departmentId: ticket.departmentId,
    departmentName: ticket.departmentName,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    isAccepted: ticket.isAccepted,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt
  };
}

function mapComment(
  comment: Awaited<ReturnType<TicketRepository["listComments"]>>[number]
) {
  return {
    id: comment.id,
    ticketId: comment.ticketId,
    authorName: comment.authorName,
    authorEmail: comment.authorEmail,
    message: comment.message,
    createdAt: comment.createdAt
  };
}

export async function listTickets() {
  const { principal } = await requireCustomerTicketActor();
  const tickets = await new TicketRepository().listCustomerTickets(
    principal.tenantId
  );

  return { tickets: tickets.map(mapTicket) };
}

export async function createTicket(input: TicketCreateInput) {
  const { principal } = await requireCustomerTicketActor();
  const ticket = await new TicketRepository().createTicket({
    tenantId: principal.tenantId,
    userId: principal.userId,
    departmentId: input.departmentId,
    subject: input.subject,
    description: input.description
  });

  return { ticket: mapTicket(ticket) };
}

export async function getTicket(ticketId: string) {
  const { principal } = await requireCustomerTicketActor();
  const repository = new TicketRepository();
  const ticket = await repository.findCustomerTicket(
    principal.tenantId,
    ticketId
  );

  if (!ticket) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  const comments = await repository.listComments(ticketId);
  return { ticket: mapTicket(ticket), comments: comments.map(mapComment) };
}

export async function createTicketComment(
  ticketId: string,
  input: TicketCommentCreateInput
) {
  const { principal } = await requireCustomerTicketActor();
  const repository = new TicketRepository();
  const ticket = await repository.findCustomerTicket(
    principal.tenantId,
    ticketId
  );

  if (!ticket) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  const comment = await repository.createComment({
    ticketId,
    authorName: principal.name,
    authorEmail: principal.email,
    message: input.message
  });

  return { comment: mapComment(comment) };
}

export async function listAdminTickets() {
  await requireAdminTicketActor();
  const tickets = await new TicketRepository().listAdminTickets();
  return { tickets: tickets.map(mapTicket) };
}

export async function getAdminTicket(ticketId: string) {
  await requireAdminTicketActor();
  const repository = new TicketRepository();
  const ticket = await repository.findAdminTicket(ticketId);

  if (!ticket) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  const comments = await repository.listComments(ticketId);
  return { ticket: mapTicket(ticket), comments: comments.map(mapComment) };
}

export async function createAdminTicketComment(
  ticketId: string,
  input: TicketCommentCreateInput
) {
  const { principal } = await requireAdminTicketActor();
  const repository = new TicketRepository();
  const ticket = await repository.findAdminTicket(ticketId);

  if (!ticket) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  const comment = await repository.createComment({
    ticketId,
    authorName: principal.name,
    authorEmail: principal.email,
    message: input.message
  });

  return { comment: mapComment(comment) };
}

export async function acceptAdminTicket(ticketId: string) {
  const { principal } = await requireAdminTicketActor();
  const repository = new TicketRepository();
  const existing = await repository.findAdminTicket(ticketId);

  if (!existing) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  const ticket = await repository.acceptTicket(ticketId, principal.employeeId);

  if (!ticket) {
    throw new ApiError(
      409,
      "TICKET_ALREADY_ACCEPTED",
      "Ticket is already accepted"
    );
  }

  return { ticket: mapTicket(ticket) };
}

export async function deleteAdminTicket(ticketId: string) {
  await requireAdminTicketActor();
  const deleted = await new TicketRepository().deleteTicket(ticketId);

  if (!deleted) {
    throw new ApiError(404, "TICKET_NOT_FOUND", "Ticket not found");
  }

  return { deleted: true };
}

export { errorResponse, successResponse };
