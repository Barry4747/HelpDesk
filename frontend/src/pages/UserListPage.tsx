import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getUsers } from "../api/users";
import { getDepartments } from "../api/departments";
import { UserTable } from "../components/UserTable";
import type { PaginatedUsersResponse, UserFilterParams } from "../types/user";
import type { Department } from "../types/department";

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

export function UserListPage() {
  const [data, setData] = useState<PaginatedUsersResponse | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const filters: UserFilterParams = {
    role: searchParams.get("role") || "",
    department_id: searchParams.get("department_id") || "",
    is_active: searchParams.get("is_active") === null ? "" : searchParams.get("is_active") === "true",
    search: searchParams.get("search") || "",
    sort_by: (searchParams.get("sort_by") as any) || "created_at",
    sort_order: (searchParams.get("sort_order") as any) || "desc",
    page: parseInt(searchParams.get("page") || "1", 10),
    page_size: parseInt(searchParams.get("page_size") || "20", 10),
  };

  useEffect(() => {
    getDepartments({ page_size: 1000 }).then(deps => {
      if ((deps as any).items) {
        setDepartments((deps as any).items);
      } else {
        setDepartments(deps as any);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    getUsers(filters)
      .then(setData)
      .catch((err: any) => setError(err.message || "Błąd pobierania użytkowników"))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<UserFilterParams>) => {
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

  const handleSortChange = (field: string) => {
    if (filters.sort_by === field) {
      updateFilters({ sort_order: filters.sort_order === "asc" ? "desc" : "asc", page: filters.page });
    } else {
      updateFilters({ sort_by: field, sort_order: "desc", page: filters.page });
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Użytkownicy</h1>
          <p className="page-subtitle">Zarządzaj kontami użytkowników w systemie</p>
        </div>
        <Link to="/users/new" className="btn btn-primary">
          + Dodaj użytkownika
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-body" style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "200px" }}>
            <label className="form-label">Szukaj</label>
            <input
              type="text"
              className="form-control"
              placeholder="Imię, nazwisko, login..."
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
            <label className="form-label">Rola</label>
            <select
              className="form-control"
              value={filters.role}
              onChange={(e) => updateFilters({ role: e.target.value })}
            >
              <option value="">Wszystkie</option>
              <option value="admin">Administrator</option>
              <option value="support">Wsparcie (Support)</option>
              <option value="reporter">Reporter</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
            <label className="form-label">Dział</label>
            <select
              className="form-control"
              value={filters.department_id}
              onChange={(e) => updateFilters({ department_id: e.target.value })}
            >
              <option value="">Wszystkie</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: "150px" }}>
            <label className="form-label">Status</label>
            <select
              className="form-control"
              value={filters.is_active === "" ? "" : filters.is_active ? "true" : "false"}
              onChange={(e) => {
                const val = e.target.value;
                updateFilters({ is_active: val === "" ? "" : val === "true" });
              }}
            >
              <option value="">Wszystkie</option>
              <option value="true">Aktywni</option>
              <option value="false">Nieaktywni</option>
            </select>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="loading">Ładowanie...</div>
      ) : data ? (
        <>
          <div className="table-wrapper" style={{ marginBottom: "16px" }}>
            <UserTable 
              users={data.items}
              departments={departments}
              onRowClick={(id) => navigate(`/users/${id}`)} 
              sortBy={filters.sort_by}
              sortOrder={filters.sort_order}
              onSortChange={handleSortChange}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              Pokazuję {data.items.length} z {data.total} użytkowników
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
