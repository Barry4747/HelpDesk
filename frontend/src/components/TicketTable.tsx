import { useNavigate } from "react-router-dom";
import type { Ticket, TicketPriority } from "../types/ticket";

interface TicketTableProps {
  tickets: Ticket[];
  onRowClick: (id: string) => void;
  sortBy?: "created_at" | "updated_at" | "priority" | "status";
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: "created_at" | "updated_at" | "priority" | "status") => void;
}

const STATUS_LABELS: Record<string, string> = {
  nowe: "Nowe",
  przyjete: "Przyjęte",
  zamkniete: "Zamknięte",
};

const STATUS_CLASSES: Record<string, string> = {
  nowe: "badge badge-blue",
  przyjete: "badge badge-orange",
  zamkniete: "badge badge-gray",
};

const PRIORITY_LABELS: Record<string, string> = {
  niski: "Niski",
  sredni: "Średni",
  wysoki: "Wysoki",
  krytyczny: "Krytyczny",
};

const PRIORITY_CLASSES: Record<string, string> = {
  niski: "badge badge-green",
  sredni: "badge badge-amber",
  wysoki: "badge badge-orange",
  krytyczny: "badge badge-red",
};

export function TicketTable({ tickets, onRowClick, sortBy, sortOrder, onSortChange }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="empty-state">
        Brak zgłoszeń do wyświetlenia.
      </div>
    );
  }

  const renderHeader = (field: "created_at" | "updated_at" | "priority" | "status", label: string) => {
    const isSorted = sortBy === field;
    return (
      <th 
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => onSortChange?.(field)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {label}
          {isSorted && (
            <span style={{ fontSize: "12px", color: "var(--color-primary)" }}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
        <tr>
          <th>Tytuł</th>
          {renderHeader("status", "Status")}
          {renderHeader("priority", "Priorytet")}
          {renderHeader("created_at", "Utworzono")}
          {renderHeader("updated_at", "Zaktualizowano")}
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
              <span className={STATUS_CLASSES[ticket.status] || "badge badge-gray"}>
                {STATUS_LABELS[ticket.status] || ticket.status}
              </span>
            </td>
            <td>
              {ticket.priority ? (
                <span className={PRIORITY_CLASSES[ticket.priority] || "badge badge-gray"}>
                  {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                </span>
              ) : (
                "—"
              )}
            </td>
            <td>{new Date(ticket.created_at).toLocaleDateString("pl-PL")}</td>
            <td>{new Date(ticket.updated_at).toLocaleDateString("pl-PL")}</td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
