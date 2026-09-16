import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteTicket,
  getTicket,
  updateStatus,
  updateTicket,
} from "../api/tickets";
import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");

  const [status, setStatus] = useState<TicketStatus | "">("");

  const loadTicket = () => {
    if (!id) return;
    getTicket(id)
      .then((data) => {
        setTicket(data);
        setTitle(data.title);
        setDescription(data.description);
        setCategoryId(data.category_id || "");
        setPriority(data.priority || "");
        setStatus(data.status);
      })
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    try {
      await updateTicket(ticket.id, {
        title,
        description,
        category_id: categoryId || null,
        priority: (priority as TicketPriority) || null,
      });
      loadTicket();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !status) return;
    try {
      await updateStatus(ticket.id, { status: status as TicketStatus });
      loadTicket();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    if (!window.confirm("Na pewno usunąć?")) return;
    try {
      await deleteTicket(ticket.id);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (error) {
    return <p style={{ color: "red" }}>Błąd: {error}</p>;
  }

  if (!ticket) {
    return <p>Ładowanie...</p>;
  }

  return (
    <main>
      <h1>Szczegóły zgłoszenia</h1>

      <h2>Dane aktualne</h2>
      <dl>
        <dt>ID</dt>
        <dd>{ticket.id}</dd>
        <dt>Tytuł</dt>
        <dd>{ticket.title}</dd>
        <dt>Opis</dt>
        <dd>{ticket.description}</dd>
        <dt>Status</dt>
        <dd>{ticket.status}</dd>
        <dt>Priorytet</dt>
        <dd>{ticket.priority || "brak"}</dd>
        <dt>Kategoria (ID)</dt>
        <dd>{ticket.category_id || "brak"}</dd>
        <dt>Reporter (ID)</dt>
        <dd>{ticket.reporter_id}</dd>
        <dt>Przypisany (ID)</dt>
        <dd>{ticket.assigned_to_id || "brak"}</dd>
        <dt>Sugerowana Kategoria (ID)</dt>
        <dd>{ticket.suggested_category_id || "brak"}</dd>
        <dt>Sugerowany Priorytet</dt>
        <dd>{ticket.suggested_priority || "brak"}</dd>
        <dt>Utworzono</dt>
        <dd>{new Date(ticket.created_at).toLocaleString()}</dd>
        <dt>Zaktualizowano</dt>
        <dd>{new Date(ticket.updated_at).toLocaleString()}</dd>
      </dl>

      <h2>Edycja zgłoszenia</h2>
      <form onSubmit={handleUpdate}>
        <label>
          Tytuł:
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <br />
        <label>
          Opis:
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <br />
        <label>
          Kategoria ID:
          <input
            type="text"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
        </label>
        <br />
        <label>
          Priorytet:
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
          >
            <option value="">Brak</option>
            <option value="niski">Niski</option>
            <option value="sredni">Średni</option>
            <option value="wysoki">Wysoki</option>
            <option value="krytyczny">Krytyczny</option>
          </select>
        </label>
        <br />
        <button type="submit">Zapisz zmiany</button>
      </form>

      <hr />

      <h2>Zmiana statusu</h2>
      <form onSubmit={handleStatusUpdate}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus)}
        >
          <option value="nowe">Nowe</option>
          <option value="przyjete">Przyjęte</option>
          <option value="zamkniete">Zamknięte</option>
        </select>
        <button type="submit">Zmień status</button>
      </form>

      <hr />
      <button type="button" onClick={handleDelete} style={{ color: "red" }}>
        Usuń zgłoszenie
      </button>
      <br />
      <button type="button" onClick={() => navigate("/")}>
        Wróć do listy
      </button>
    </main>
  );
}
