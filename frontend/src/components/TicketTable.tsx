import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket";

interface TicketTableProps {
  tickets: Ticket[];
  onRowClick: (id: string) => void;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  nowe: "Nowe",
  przyjete: "Przyjęte",
  zamkniete: "Zamknięte",
};

const STATUS_CLASSES: Record<TicketStatus, string> = {
  nowe: "badge badge-blue",
  przyjete: "badge badge-orange",
  zamkniete: "badge badge-gray",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  niski: "Niski",
  sredni: "Średni",
  wysoki: "Wysoki",
  krytyczny: "Krytyczny",
};

const PRIORITY_CLASSES: Record<TicketPriority, string> = {
  niski: "badge badge-green",
  sredni: "badge badge-amber",
  wysoki: "badge badge-orange",
  krytyczny: "badge badge-red",
};

export function TicketTable({ tickets, onRowClick }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="empty-state">
        Brak zgłoszeń do wyświetlenia.
      </div>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Tytuł</th>
          <th>Status</th>
          <th>Priorytet</th>
          <th>Utworzono</th>
          <th>Zaktualizowano</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr key={ticket.id} onClick={() => onRowClick(ticket.id)}>
            <td>
              <div style={{ fontWeight: 500 }}>{ticket.title}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                {ticket.description.slice(0, 60)}{ticket.description.length > 60 ? "…" : ""}
              </div>
            </td>
            <td>
              <span className={STATUS_CLASSES[ticket.status] ?? "badge badge-gray"}>
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </span>
            </td>
            <td>
              {ticket.priority ? (
                <span className={PRIORITY_CLASSES[ticket.priority] ?? "badge badge-gray"}>
                  {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                </span>
              ) : (
                <span style={{ color: "var(--color-text-muted)" }}>—</span>
              )}
            </td>
            <td style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
              {new Date(ticket.created_at).toLocaleDateString("pl-PL")}
            </td>
            <td style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
              {new Date(ticket.updated_at).toLocaleDateString("pl-PL")}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
