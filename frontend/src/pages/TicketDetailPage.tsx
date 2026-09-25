import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import toast from "react-hot-toast";
import { getCategories } from "../api/categories";
import { getDepartments } from "../api/departments";
import {
  deleteTicket,
  getTicket,
  updateStatus,
  updateTicket,
} from "../api/tickets";
import { getUser } from "../api/users";
import { useAuth } from "../context/AuthContext";
import type { Category } from "../types/category";
import type { Department } from "../types/department";
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

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  support: "Wsparcie",
  reporter: "Reporter",
};

const selectStyles = {
  control: (base: any) => ({
    ...base,
    minHeight: "32px",
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

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user as any)?.role;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const [status, setStatus] = useState<TicketStatus | "">("");

  const [aiCategoryId, setAiCategoryId] = useState("");
  const [aiPriority, setAiPriority] = useState<TicketPriority | "">("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reporter, setReporter] = useState<User | null>(null);
  const [assignee, setAssignee] = useState<User | null>(null);

  const [showReporterTooltip, setShowReporterTooltip] = useState(false);
  const [showAssigneeTooltip, setShowAssigneeTooltip] = useState(false);

  const loadTicket = async () => {
    if (!id) return;
    try {
      const data = await getTicket(id);
      setTicket(data);
      setStatus(data.status);
      setAiCategoryId(data.suggested_category_id || "");
      setAiPriority(data.suggested_priority || "");

      const rep = await getUser(data.reporter_id);
      setReporter(rep);

      if (data.assigned_to_id) {
        const ass = await getUser(data.assigned_to_id);
        setAssignee(ass);
      } else {
        setAssignee(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    loadTicket();
    getCategories({ page_size: 1000 }).then(res => setCategories(res.items)).catch(console.error);
    getDepartments({ page_size: 1000 }).then(res => setDepartments(res.items)).catch(console.error);
  }, [id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !status) return;
    setSaveError(null);
    try {
      await updateStatus(ticket.id, { status: status as TicketStatus });
      await loadTicket();
      toast.success("Status zgłoszenia został zaktualizowany");
    } catch (err: any) {
      toast.error(err.message);
      setSaveError(err.message);
    }
  };

  const handleAssignToMe = async () => {
    if (!ticket || !user) return;
    if (needsReview) {
      toast.error("Zgłoszenie musi mieć przypisaną kategorię i priorytet przed przypisaniem pracownika.");
      return;
    }
    setSaveError(null);
    try {
      await updateTicket(ticket.id, {
        assigned_to_id: user.id,
      });
      await loadTicket();
      toast.success("Zgłoszenie zostało przypisane do Ciebie");
    } catch (err: any) {
      toast.error(err.message);
      setSaveError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    if (!window.confirm("Na pewno usunąć to zgłoszenie? Tej akcji nie można cofnąć.")) return;
    try {
      await deleteTicket(ticket.id);
      toast.success("Zgłoszenie zostało usunięte");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message);
      setSaveError(err.message);
    }
  };

  const handleConfirmSuggestions = async () => {
    if (!ticket) return;
    if (!aiCategoryId || !aiPriority) {
      toast.error("Proszę wybrać zarówno kategorię jak i priorytet przed zatwierdzeniem.");
      return;
    }
    setSaveError(null);
    try {
      await updateTicket(ticket.id, {
        category_id: aiCategoryId || null,
        priority: (aiPriority as TicketPriority) || null,
      });
      await loadTicket();
      toast.success("Sugestie AI zostały zatwierdzone");
    } catch (err: any) {
      toast.error(err.message);
      setSaveError(err.message);
    }
  };

  if (loadingPage) {
    return <div className="loading">Ładowanie...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate("/")}>
          Wróć do listy
        </button>
      </div>
    );
  }

  if (!ticket) return null;

  const canEdit = role === "support" || role === "admin";
  const canDelete =
    role === "admin" ||
    (role === "support" &&
      ticket.assigned_to_id === user?.id &&
      ticket.status === "zamkniete");

  const needsReview = !ticket.category_id || !ticket.priority;
  const hasSuggestions = ticket.suggested_category_id || ticket.suggested_priority;

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  categoryOptions.unshift({ value: "", label: "Brak" });

  const selectedStatus = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];

  const aiSelectedCategory = categoryOptions.find((o) => o.value === aiCategoryId) || categoryOptions[0];
  const aiSelectedPriority = PRIORITY_OPTIONS.find((o) => o.value === aiPriority) || { value: "", label: "Brak" };

  const reporterDept = departments.find(d => d.id === reporter?.department_id)?.name || reporter?.department_id || "Brak";
  const assigneeDept = departments.find(d => d.id === assignee?.department_id)?.name || assignee?.department_id || "Brak";

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "13px",
              padding: 0,
              marginBottom: "8px",
              fontFamily: "inherit",
            }}
          >
            ← Wróć do zgłoszeń
          </button>
          <h1 className="page-title">{ticket.title}</h1>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {canDelete && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
            >
              Usuń zgłoszenie
            </button>
          )}
        </div>
      </div>

      {saveError && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{saveError}</div>}

      {canEdit && needsReview && ticket.status === "nowe" && (
        <div className="alert alert-info" style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "24px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px", color: "var(--color-primary)" }}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>
              {hasSuggestions ? "Weryfikacja predykcji AI" : "Uzupełnij brakujące dane"}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
              {hasSuggestions
                ? "Kategoria i priorytet zostały zasugerowane przez AI. Zweryfikuj, popraw (jeśli to konieczne) i zatwierdź je."
                : "To zgłoszenie nie ma przypisanej kategorii i priorytetu. Uzupełnij je i zatwierdź."}
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center", background: "rgba(255,255,255,0.5)", padding: "12px", borderRadius: "6px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>Kategoria</label>
                <Select
                  options={categoryOptions}
                  value={aiSelectedCategory}
                  onChange={(option) => setAiCategoryId(option?.value || "")}
                  styles={selectStyles}
                  placeholder="Wybierz..."
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>Priorytet</label>
                <Select
                  options={PRIORITY_OPTIONS}
                  value={aiSelectedPriority}
                  onChange={(option) => setAiPriority((option?.value as TicketPriority) || "")}
                  styles={selectStyles}
                  placeholder="Wybierz..."
                  isSearchable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleConfirmSuggestions}
              >
                Zatwierdź
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Szczegóły zgłoszenia</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className={STATUS_CLASSES[ticket.status] ?? "badge badge-gray"}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
                {ticket.priority && (
                  <span className={`badge badge-${ticket.priority === "krytyczny" ? "red" : ticket.priority === "wysoki" ? "orange" : ticket.priority === "sredni" ? "amber" : "green"}`}>
                    {PRIORITY_LABELS[ticket.priority]}
                  </span>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="detail-grid">
                <div className="detail-field detail-field-full">
                  <span className="detail-label">Opis</span>
                  <span className="detail-value" style={{ whiteSpace: "pre-wrap" }}>{ticket.description}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Kategoria</span>
                  <span className="detail-value">
                    {ticket.category_id
                      ? (categories.find(c => c.id === ticket.category_id)?.name || ticket.category_id)
                      : "—"}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Reporter</span>
                  <div className="detail-value">
                    {reporter ? (
                      <div
                        onMouseEnter={() => setShowReporterTooltip(true)}
                        onMouseLeave={() => setShowReporterTooltip(false)}
                        style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        {reporter.first_name} {reporter.last_name}
                        <div style={{ cursor: "help", display: "flex", color: "var(--color-primary)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>

                        {showReporterTooltip && (
                          <div style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "0",
                            marginBottom: "8px",
                            backgroundColor: "white",
                            border: "1px solid var(--color-border)",
                            padding: "12px",
                            borderRadius: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            width: "max-content",
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}>
                            <div style={{ fontSize: "12px" }}><strong>Login:</strong> {reporter.login}</div>
                            <div style={{ fontSize: "12px" }}><strong>Rola:</strong> {ROLE_LABELS[reporter.role] || reporter.role}</div>
                            <div style={{ fontSize: "12px" }}><strong>Dział:</strong> {reporterDept}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      ticket.reporter_id
                    )}
                  </div>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Przypisany do</span>
                  <div className="detail-value">
                    {assignee ? (
                      <div
                        onMouseEnter={() => setShowAssigneeTooltip(true)}
                        onMouseLeave={() => setShowAssigneeTooltip(false)}
                        style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        {assignee.first_name} {assignee.last_name}
                        <div style={{ cursor: "help", display: "flex", color: "var(--color-primary)" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                          </svg>
                        </div>

                        {showAssigneeTooltip && (
                          <div style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "0",
                            marginBottom: "8px",
                            backgroundColor: "white",
                            border: "1px solid var(--color-border)",
                            padding: "12px",
                            borderRadius: "6px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            width: "max-content",
                            zIndex: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px"
                          }}>
                            <div style={{ fontSize: "12px" }}><strong>Login:</strong> {assignee.login}</div>
                            <div style={{ fontSize: "12px" }}><strong>Rola:</strong> {ROLE_LABELS[assignee.role] || assignee.role}</div>
                            <div style={{ fontSize: "12px" }}><strong>Dział:</strong> {assigneeDept}</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      ticket.assigned_to_id || "—"
                    )}
                  </div>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Utworzono</span>
                  <span className="detail-value">{new Date(ticket.created_at).toLocaleString("pl-PL")}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Zaktualizowano</span>
                  <span className="detail-value">{new Date(ticket.updated_at).toLocaleString("pl-PL")}</span>
                </div>
              </div>
            </div>

            {canEdit && (
              <div style={{ padding: "16px", display: "flex", gap: "12px", borderTop: "1px solid var(--color-border-subtle)", backgroundColor: "var(--color-bg-alt)", borderBottomLeftRadius: "6px", borderBottomRightRadius: "6px" }}>
                {ticket.assigned_to_id !== user?.id && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAssignToMe}
                  >
                    Przypisz do siebie
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
                >
                  Edytuj zgłoszenie
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {canEdit && ticket.assigned_to_id && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Zmiana statusu</span>
              </div>
              <div className="card-body">
                <form onSubmit={handleStatusUpdate}>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <Select
                      options={STATUS_OPTIONS}
                      value={selectedStatus}
                      onChange={(option) => setStatus((option?.value as TicketStatus) || "")}
                      styles={selectStyles}
                      isSearchable
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                  <button type="submit" className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                    Zmień status
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span className="card-title">Informacje systemowe</span>
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="detail-field">
                <span className="detail-label">ID zgłoszenia</span>
                <span className="detail-value" style={{ fontSize: "12px", wordBreak: "break-all" }}>
                  {ticket.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
