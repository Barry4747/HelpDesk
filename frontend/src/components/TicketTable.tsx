import type { Ticket } from "../types/ticket";

interface TicketTableProps {
  tickets: Ticket[];
  onRowClick: (id: string) => void;
}

export function TicketTable({ tickets, onRowClick }: TicketTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Tytuł</th>
          <th>Status</th>
          <th>Priorytet</th>
          <th>Kategoria (ID)</th>
          <th>Utworzono</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr
            key={ticket.id}
            onClick={() => onRowClick(ticket.id)}
            style={{ cursor: "pointer" }}
          >
            <td>{ticket.title}</td>
            <td>{ticket.status}</td>
            <td>{ticket.priority || "-"}</td>
            <td>{ticket.category_id || "-"}</td>
            <td>{new Date(ticket.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
