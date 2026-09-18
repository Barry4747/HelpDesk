import type {
  Ticket,
  TicketCreateInput,
  TicketStatusUpdateInput,
  TicketUpdateAdminInput,
  TicketUpdateSupportInput,
} from "../types/ticket";
import { apiFetch } from "./client";

const API_BASE_URL = "/api/v1/tickets";

export async function createTicket(data: TicketCreateInput): Promise<Ticket> {
  const response = await apiFetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Błąd tworzenia zgłoszenia");
  return response.json();
}

export async function getTickets(): Promise<Ticket[]> {
  const response = await apiFetch(API_BASE_URL);
  if (!response.ok) throw new Error("Błąd pobierania listy zgłoszeń");
  return response.json();
}

export async function getTicket(id: string): Promise<Ticket> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`);
  if (!response.ok) throw new Error("Błąd pobierania zgłoszenia");
  return response.json();
}

export async function updateTicket(
  id: string,
  data: TicketUpdateSupportInput | TicketUpdateAdminInput
): Promise<Ticket> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Błąd aktualizacji zgłoszenia");
  return response.json();
}

export async function updateStatus(
  id: string,
  data: TicketStatusUpdateInput
): Promise<Ticket> {
  const response = await apiFetch(`${API_BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Błąd zmiany statusu");
  return response.json();
}

export async function deleteTicket(id: string): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Błąd usunięcia zgłoszenia");
}
