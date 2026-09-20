import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTickets } from "../api/tickets";
import { TicketTable } from "../components/TicketTable";
import { useAuth } from "../context/AuthContext";
import type { Ticket } from "../types/ticket";

export function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user as any)?.role;

  useEffect(() => {
    getTickets()
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRowClick = (id: string) => {
    navigate(`/tickets/${id}`);
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Zgłoszenia</h1>
          <p className="page-subtitle">
            {role === "reporter" ? "Twoje zgłoszenia" : "Wszystkie zgłoszenia w systemie"}
          </p>
        </div>
        {role === "reporter" && (
          <Link to="/tickets/new" className="btn btn-primary">
            + Nowe zgłoszenie
          </Link>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Ładowanie...</div>
      ) : (
        <div className="table-wrapper">
          <TicketTable tickets={tickets} onRowClick={handleRowClick} />
        </div>
      )}
    </div>
  );
}
