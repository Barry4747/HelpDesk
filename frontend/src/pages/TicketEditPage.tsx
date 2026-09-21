import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import toast from "react-hot-toast";
import { getCategories } from "../api/categories";
import { getTicket, updateTicket, updateStatus } from "../api/tickets";
import { getUsers } from "../api/users";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../types/category";
import type { Ticket, TicketPriority, TicketStatus } from "../types/ticket";
import type { User } from "../types/user";

const STATUS_OPTIONS = [
  { value: "nowe", label: "Nowe" },
  { value: "przyjete", label: "Przyjęte" },
  { value: "zamkniete", label: "Zamknięte" },
];

const PRIORITY_OPTIONS = [
  { value: "niski", label: "Niski" },
  { value: "sredni", label: "Średni" },
  { value: "wysoki", label: "Wysoki" },
  { value: "krytyczny", label: "Krytyczny" },
];

const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: "36px",
    borderRadius: "6px",
    borderColor: "var(--color-border)",
    boxShadow: "none",
    "&:hover": {
      borderColor: "var(--color-border-hover)",
    },
    fontSize: "13px",
  }),
  option: (base: any, state: any) => ({
    ...base,
    fontSize: "13px",
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
      ? "var(--color-bg-alt)"
      : "white",
    color: state.isSelected ? "white" : "var(--color-text)",
    cursor: "pointer",
  }),
  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),
};

export function TicketEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [assignedToId, setAssignedToId] = useState("");
  const [status, setStatus] = useState<TicketStatus | "">("");

  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!id) return;
    getTicket(id)
      .then((data) => {
        setTicket(data);
        setTitle(data.title);
        setDescription(data.description);
        setCategoryId(data.category_id || "");
        setPriority(data.priority || "");
        setAssignedToId(data.assigned_to_id || "");
        setStatus(data.status);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    getCategories({ page_size: 1000 }).then(res => setCategories(res.items)).catch(console.error);

    if (role === "admin") {
      getUsers({ page_size: 1000 })
        .then((res) =>
          setAssignableUsers(res.items.filter((u) => u.role === "support" || u.role === "admin"))
        )
        .catch(console.error);
    }
  }, [id, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    setSaveError(null);
    setSaving(true);
    try {
      if (role === "support") {
        await updateTicket(ticket.id, {
          category_id: categoryId || null,
          priority: (priority as TicketPriority) || null,
        });
      } else if (role === "admin") {
        await updateTicket(ticket.id, {
          title,
          description,
          category_id: categoryId || null,
          priority: (priority as TicketPriority) || null,
          assigned_to_id: assignedToId || null,
        });
      }
      if (status && status !== ticket.status) {
        await updateStatus(ticket.id, { status: status as TicketStatus });
      }
      toast.success("Zgłoszenie zostało pomyślnie zaktualizowane");
      navigate(`/tickets/${ticket.id}`);
    } catch (err: any) {
      toast.error(err.message);
      setSaveError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Ładowanie...</div>;

  if (error || !ticket) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || "Zgłoszenie nie zostało znalezione"}</div>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>Wróć do listy</button>
      </div>
    );
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  categoryOptions.unshift({ value: "", label: "Brak" });

  const userOptions = assignableUsers.map((u) => ({
    value: u.id,
    label: `${u.first_name} ${u.last_name} (${u.role})`,
  }));
  userOptions.unshift({ value: "", label: "Brak przypisania" });

  const selectedCategory = categoryOptions.find((o) => o.value === categoryId) || categoryOptions[0];
  const selectedPriority = PRIORITY_OPTIONS.find((o) => o.value === priority) || { value: "", label: "Brak" };
  const selectedUser = userOptions.find((o) => o.value === assignedToId) || userOptions[0];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-secondary)", fontSize: "13px",
              padding: 0, marginBottom: "8px", fontFamily: "inherit",
            }}
          >
            ← Wróć do szczegółów
          </button>
          <h1 className="page-title">Edycja zgłoszenia</h1>
          <p className="page-subtitle">{ticket.title}</p>
        </div>
      </div>

      {saveError && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{saveError}</div>}

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {role === "admin" && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-title">Tytuł</label>
                  <input
                    id="edit-title"
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-desc">Opis</label>
                  <textarea
                    id="edit-desc"
                    className="form-control"
                    style={{ minHeight: "120px" }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Kategoria</label>
                <Select
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(option) => setCategoryId(option?.value || "")}
                  styles={selectStyles}
                  placeholder="Wybierz..."
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Priorytet</label>
                <Select
                  options={PRIORITY_OPTIONS}
                  value={selectedPriority}
                  onChange={(option) => setPriority((option?.value as TicketPriority) || "")}
                  styles={selectStyles}
                  placeholder="Wybierz..."
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            </div>

            {role === "admin" && (
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label className="form-label">Przypisany pracownik</label>
                <Select
                  options={userOptions}
                  value={selectedUser}
                  onChange={(option) => setAssignedToId(option?.value || "")}
                  styles={selectStyles}
                  placeholder="Szukaj użytkownika..."
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            )}
            
            {assignedToId && (
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label className="form-label">Status zgłoszenia</label>
                <Select
                  options={STATUS_OPTIONS}
                  value={STATUS_OPTIONS.find((o) => o.value === status)}
                  onChange={(option) => setStatus((option?.value as TicketStatus) || "")}
                  styles={selectStyles}
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Zapisywanie..." : "Zapisz zmiany"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                Anuluj
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
