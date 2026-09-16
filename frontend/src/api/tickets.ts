import type {
  Ticket,
  TicketCreateInput,
  TicketStatusUpdateInput,
  TicketUpdateInput,
} from "../types/ticket";

const API_BASE_URL = "/api/v1";

export async function getTickets(): Promise<Ticket[]> {
  const response = await fetch(`${API_BASE_URL}/tickets`);
  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }
  return response.json();
}

export async function getTicket(id: string): Promise<Ticket> {
  const response = await fetch(`${API_BASE_URL}/tickets/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ticket ${id}`);
  }
  return response.json();
}

export async function createTicket(data: TicketCreateInput): Promise<Ticket> {
  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create ticket");
  }
  return response.json();
}

export async function updateTicket(
  id: string,
  data: TicketUpdateInput,
): Promise<Ticket> {
  const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update ticket ${id}`);
  }
  return response.json();
}

export async function updateStatus(
  id: string,
  data: TicketStatusUpdateInput,
): Promise<Ticket> {
  const response = await fetch(`${API_BASE_URL}/tickets/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update ticket status ${id}`);
  }
  return response.json();
}

export async function deleteTicket(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete ticket ${id}`);
  }
}
