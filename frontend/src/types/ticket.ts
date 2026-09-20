export type TicketStatus = "nowe" | "przyjete" | "zamkniete";
export type TicketPriority = "niski" | "sredni" | "wysoki" | "krytyczny";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  reporter_id: string;
  assigned_to_id: string | null;
  category_id: string | null;
  priority: TicketPriority | null;
  suggested_category_id: string | null;
  suggested_priority: TicketPriority | null;
  created_at: string;
  updated_at: string;
}

export interface TicketCreateInput {
  title: string;
  description: string;
}

export interface TicketUpdateSupportInput {
  category_id?: string | null;
  priority?: TicketPriority | null;
}

export interface TicketUpdateAdminInput {
  title?: string;
  description?: string;
  category_id?: string | null;
  priority?: TicketPriority | null;
  assigned_to_id?: string | null;
}

export interface TicketStatusUpdateInput {
  status: TicketStatus;
}

export interface TicketFilterParams {
  status?: TicketStatus | "";
  priority?: TicketPriority | "";
  category_id?: string;
  assigned_to_me?: boolean;
  sort_by?: "created_at" | "updated_at" | "priority" | "status";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface PaginatedTicketsResponse {
  items: Ticket[];
  total: number;
  page: number;
  page_size: number;
}
