import { BaseRepository, type RepositoryContext } from "./index";

export type TicketStatus =
  | "open"
  | "accepted"
  | "in_progress"
  | "resolved"
  | "closed";

export interface TicketRecord {
  id: string;
  tenantId: string;
  userId: string;
  departmentId: string;
  departmentName: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketCommentRecord {
  id: string;
  ticketId: string;
  authorName: string;
  authorEmail: string | null;
  message: string;
  createdAt: string;
}

export class TicketRepository extends BaseRepository {
  constructor(context?: RepositoryContext) {
    super(context);
  }

  async listCustomerTickets(tenantId: string) {
    return this.db<TicketRecord[]>`
      select
        tickets.id,
        tickets.tenant_id as "tenantId",
        tickets.user_id as "userId",
        tickets.department_id as "departmentId",
        departments.name as "departmentName",
        tickets.subject,
        tickets.description,
        tickets.status,
        tickets.is_accepted as "isAccepted",
        tickets.created_at as "createdAt",
        tickets.updated_at as "updatedAt"
      from public.tickets tickets
      left join public.admin_departments departments
        on departments.id = tickets.department_id
      where tickets.tenant_id = ${tenantId}
      order by tickets.created_at desc
    `;
  }

  async listAdminTickets() {
    return this.db<TicketRecord[]>`
      select
        tickets.id,
        tickets.tenant_id as "tenantId",
        tickets.user_id as "userId",
        tickets.department_id as "departmentId",
        departments.name as "departmentName",
        tickets.subject,
        tickets.description,
        tickets.status,
        tickets.is_accepted as "isAccepted",
        tickets.created_at as "createdAt",
        tickets.updated_at as "updatedAt"
      from public.tickets tickets
      left join public.admin_departments departments
        on departments.id = tickets.department_id
      order by tickets.created_at desc
      limit 200
    `;
  }

  async findCustomerTicket(tenantId: string, ticketId: string) {
    const [ticket] = await this.db<TicketRecord[]>`
      select
        tickets.id,
        tickets.tenant_id as "tenantId",
        tickets.user_id as "userId",
        tickets.department_id as "departmentId",
        departments.name as "departmentName",
        tickets.subject,
        tickets.description,
        tickets.status,
        tickets.is_accepted as "isAccepted",
        tickets.created_at as "createdAt",
        tickets.updated_at as "updatedAt"
      from public.tickets tickets
      left join public.admin_departments departments
        on departments.id = tickets.department_id
      where tickets.tenant_id = ${tenantId}
        and tickets.id = ${ticketId}
      limit 1
    `;

    return ticket ?? null;
  }

  async findAdminTicket(ticketId: string) {
    const [ticket] = await this.db<TicketRecord[]>`
      select
        tickets.id,
        tickets.tenant_id as "tenantId",
        tickets.user_id as "userId",
        tickets.department_id as "departmentId",
        departments.name as "departmentName",
        tickets.subject,
        tickets.description,
        tickets.status,
        tickets.is_accepted as "isAccepted",
        tickets.created_at as "createdAt",
        tickets.updated_at as "updatedAt"
      from public.tickets tickets
      left join public.admin_departments departments
        on departments.id = tickets.department_id
      where tickets.id = ${ticketId}
      limit 1
    `;

    return ticket ?? null;
  }

  async createTicket(input: {
    tenantId: string;
    userId: string;
    departmentId: string;
    subject: string;
    description: string;
  }) {
    const [ticket] = await this.db<TicketRecord[]>`
      insert into public.tickets (
        tenant_id,
        user_id,
        department_id,
        subject,
        description
      ) values (
        ${input.tenantId},
        ${input.userId},
        ${input.departmentId},
        ${input.subject},
        ${input.description}
      )
      returning
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        department_id as "departmentId",
        null::text as "departmentName",
        subject,
        description,
        status,
        is_accepted as "isAccepted",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    return ticket;
  }

  async listComments(ticketId: string) {
    return this.db<TicketCommentRecord[]>`
      select
        id,
        ticket_id as "ticketId",
        author_name as "authorName",
        author_email as "authorEmail",
        message,
        created_at as "createdAt"
      from public.ticket_comments
      where ticket_id = ${ticketId}
      order by created_at asc
    `;
  }

  async createComment(input: {
    ticketId: string;
    authorName: string;
    authorEmail: string | null;
    message: string;
  }) {
    const [comment] = await this.db<TicketCommentRecord[]>`
      insert into public.ticket_comments (
        ticket_id,
        author_name,
        author_email,
        message
      ) values (
        ${input.ticketId},
        ${input.authorName},
        ${input.authorEmail},
        ${input.message}
      )
      returning
        id,
        ticket_id as "ticketId",
        author_name as "authorName",
        author_email as "authorEmail",
        message,
        created_at as "createdAt"
    `;

    return comment;
  }

  async acceptTicket(ticketId: string, employeeId: string) {
    const [ticket] = await this.db<TicketRecord[]>`
      update public.tickets
      set
        is_accepted = true,
        status = 'accepted'
      where id = ${ticketId}
        and is_accepted = false
      returning
        id,
        tenant_id as "tenantId",
        user_id as "userId",
        department_id as "departmentId",
        null::text as "departmentName",
        subject,
        description,
        status,
        is_accepted as "isAccepted",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    if (!ticket) {
      return null;
    }

    await this.db`
      insert into public.ticket_acceptances (
        ticket_id,
        employee_id,
        accepted_at
      ) values (
        ${ticketId},
        ${employeeId},
        timezone('utc', now())
      )
    `;

    return ticket;
  }

  async deleteTicket(ticketId: string) {
    const result = await this.db`
      delete from public.tickets
      where id = ${ticketId}
    `;

    return result.count > 0;
  }
}
