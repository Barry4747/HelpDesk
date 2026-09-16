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
  reporter_id: string;
}

export interface TicketUpdateInput {
  title?: string;
  description?: string;
  category_id?: string | null;
  priority?: TicketPriority | null;
}

export interface TicketStatusUpdateInput {
  status: TicketStatus;
}
