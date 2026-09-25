import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createTicket } from "../api/tickets";

export function TicketCreatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const newTicket = await createTicket({ title, description });
      toast.success("Zgłoszenie zostało pomyślnie utworzone");
      navigate(`/tickets/${newTicket.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nowe zgłoszenie</h1>
          <p className="page-subtitle">Opisz problem, z którym potrzebujesz pomocy</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/")}
        >
          Anuluj
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="ticket-title">
                Tytuł <span className="form-label-required">*</span>
              </label>
              <input
                id="ticket-title"
                type="text"
                className="form-control"
                required
                placeholder="Krótkie podsumowanie problemu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ticket-description">
                Opis <span className="form-label-required">*</span>
              </label>
              <textarea
                id="ticket-description"
                className="form-control"
                required
                placeholder="Opisz szczegółowo problem..."
                style={{ minHeight: 140 }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Tworzenie..." : "Utwórz zgłoszenie"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/")}
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
