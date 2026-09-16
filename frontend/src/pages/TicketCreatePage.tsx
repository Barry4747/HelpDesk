import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTicket } from "../api/tickets";

export function TicketCreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTicket = await createTicket({
        title,
        description,
        reporter_id: reporterId,
      });
      navigate(`/tickets/${newTicket.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main>
      <h1>Nowe zgłoszenie</h1>
      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}
      <form onSubmit={handleSubmit}>
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
          Reporter ID (UUID):
          <input
            type="text"
            required
            value={reporterId}
            onChange={(e) => setReporterId(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Utwórz</button>
      </form>
    </main>
  );
}
