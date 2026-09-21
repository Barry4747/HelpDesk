import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getTickets } from "../api/tickets";
import { getCategories } from "../api/categories";
import { TicketTable } from "../components/TicketTable";
import { useAuth } from "../context/AuthContext";
import type { PaginatedTicketsResponse, TicketFilterParams, TicketStatus, TicketPriority } from "../types/ticket";
import type { Category } from "../types/category";

function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]);
}

export function TicketListPage() {
  const [data, setData] = useState<PaginatedTicketsResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const role = (user as any)?.role;

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const filters: TicketFilterParams = {
    status: (searchParams.get("status") as TicketStatus) || "",
    priority: (searchParams.get("priority") as TicketPriority) || "",
    category_id: searchParams.get("category_id") || "",
    assigned_to_me: searchParams.get("assigned_to_me") === "true",
    search: searchParams.get("search") || "",
    sort_by: (searchParams.get("sort_by") as any) || "created_at",
    sort_order: (searchParams.get("sort_order") as any) || "desc",
    page: parseInt(searchParams.get("page") || "1", 10),
    page_size: parseInt(searchParams.get("page_size") || "20", 10),
  };

  useEffect(() => {
    getCategories({ page_size: 1000 }).then(res => setCategories(res.items)).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getTickets(filters)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<TicketFilterParams>) => {
    const page = newFilters.page || (Object.keys(newFilters).length === 1 && newFilters.page_size ? filters.page : 1);
    const updated = { ...filters, ...newFilters, page };

    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== false && value !== null) {
        if (key === "page" && value === 1) return;
        if (key === "page_size" && value === 20) return;
        if (key === "sort_by" && value === "created_at") return;
        if (key === "sort_order" && value === "desc") return;
        params.append(key, value.toString());
      }
    });
    setSearchParams(params);
  };

  const debouncedSearch = useDebounce((value: string) => {
    updateFilters({ search: value });
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleSortChange = (field: "created_at" | "updated_at" | "priority" | "status") => {
    if (filters.sort_by === field) {
      updateFilters({ sort_order: filters.sort_order === "asc" ? "desc" : "asc", page: filters.page });
    } else {
      updateFilters({ sort_by: field, sort_order: "desc", page: filters.page });
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/tickets/${id}`);
  };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

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

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-body" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
          
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <label className="form-label">Szukaj</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Tytuł zgłoszenia..." 
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={filters.status}
              onChange={(e) => updateFilters({ status: e.target.value as TicketStatus })}
            >
              <option value="">Wszystkie</option>
              <option value="nowe">Nowe</option>
              <option value="przyjete">Przyjęte</option>
              <option value="zamkniete">Zamknięte</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
            <label className="form-label">Priorytet</label>
            <select
              className="form-control"
              value={filters.priority}
              onChange={(e) => updateFilters({ priority: e.target.value as TicketPriority })}
            >
              <option value="">Wszystkie</option>
              <option value="niski">Niski</option>
              <option value="sredni">Średni</option>
              <option value="wysoki">Wysoki</option>
              <option value="krytyczny">Krytyczny</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
            <label className="form-label">Kategoria</label>
            <select
              className="form-control"
              value={filters.category_id}
              onChange={(e) => updateFilters({ category_id: e.target.value })}
            >
              <option value="">Wszystkie</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {(role === "support" || role === "admin") && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "32px", padding: "0 8px" }}>
              <input
                type="checkbox"
                id="assigned_to_me"
                checked={filters.assigned_to_me}
                onChange={(e) => updateFilters({ assigned_to_me: e.target.checked })}
              />
              <label htmlFor="assigned_to_me" style={{ fontSize: "13px", cursor: "pointer", userSelect: "none" }}>
                Tylko przypisane do mnie
              </label>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Ładowanie...</div>
      ) : data ? (
        <>
          <div className="table-wrapper" style={{ marginBottom: "16px" }}>
            <TicketTable
              tickets={data.items}
              onRowClick={handleRowClick}
              sortBy={filters.sort_by}
              sortOrder={filters.sort_order}
              onSortChange={handleSortChange}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              Pokazuję {data.items.length} z {data.total} zgłoszeń
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={filters.page <= 1}
                onClick={() => updateFilters({ page: filters.page - 1 })}
              >
                Poprzednia
              </button>
              <span style={{ fontSize: "13px", margin: "0 8px" }}>
                Strona {filters.page} z {totalPages || 1}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={filters.page >= totalPages}
                onClick={() => updateFilters({ page: filters.page + 1 })}
              >
                Następna
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
