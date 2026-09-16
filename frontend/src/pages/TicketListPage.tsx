import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTickets } from "../api/tickets";
import { TicketTable } from "../components/TicketTable";
import type { Ticket } from "../types/ticket";

export function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTickets()
      .then(setTickets)
      .catch((err) => setError(err.message));
  }, []);

  const handleRowClick = (id: string) => {
    navigate(`/tickets/${id}`);
  };

  return (
    <main>
      <h1>Lista zgłoszeń</h1>
      <Link to="/tickets/new">
        <button type="button">Nowe zgłoszenie</button>
      </Link>
      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}
      <TicketTable tickets={tickets} onRowClick={handleRowClick} />
    </main>
  );
}
