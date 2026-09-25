import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { createCategory, getCategories, updateCategory } from "../api/categories";
import { createDepartment, getDepartments, updateDepartment } from "../api/departments";
import type { Category, CategoryFilterParams, PaginatedCategoriesResponse } from "../types/category";
import type { Department, DepartmentFilterParams, PaginatedDepartmentsResponse } from "../types/department";

function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  return useCallback((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => { callback(...args); }, delay);
    setTimeoutId(newTimeoutId);
  }, [callback, delay, timeoutId]);
}

interface Item {
  id: string;
  name: string;
  is_active: boolean;
}

interface DictPanelProps {
  title: string;
  items: Item[];
  totalItems: number;
  onCreate: (name: string) => Promise<void>;
  onToggleActive: (id: string, currentValue: boolean) => Promise<void>;
  onRename: (id: string, newName: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
  prefix: "cat_" | "dep_";
  searchParams: URLSearchParams;
  setSearchParams: (p: URLSearchParams) => void;
}

function DictPanel({
  title,
  items,
  totalItems,
  onCreate,
  onToggleActive,
  onRename,
  error,
  onClearError,
  prefix,
  searchParams,
  setSearchParams,
}: DictPanelProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const page = parseInt(searchParams.get(`${prefix}page`) || "1", 10);
  const pageSize = parseInt(searchParams.get(`${prefix}page_size`) || "10", 10);
  const sortBy = searchParams.get(`${prefix}sort_by`) || "name";
  const sortOrder = searchParams.get(`${prefix}sort_order`) || "asc";
  const searchVal = searchParams.get(`${prefix}search`) || "";
  const isActiveVal = searchParams.get(`${prefix}is_active`);

  const [searchInput, setSearchInput] = useState(searchVal);

  const updateFilters = (newFilters: Record<string, any>) => {
    const params = new URLSearchParams(searchParams);

    const newPage = newFilters.page || (Object.keys(newFilters).length === 1 && newFilters.page_size ? page : 1);

    const updated = {
      page: newPage,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      search: searchVal,
      is_active: isActiveVal,
      ...newFilters,
    };

    Object.entries(updated).forEach(([key, value]) => {
      const pKey = `${prefix}${key}`;
      if (value !== undefined && value !== "" && value !== null) {
        if (key === "page" && value === 1) params.delete(pKey);
        else if (key === "page_size" && value === 10) params.delete(pKey);
        else if (key === "sort_by" && value === "name") params.delete(pKey);
        else if (key === "sort_order" && value === "asc") params.delete(pKey);
        else params.set(pKey, value.toString());
      } else {
        params.delete(pKey);
      }
    });
    setSearchParams(params);
  };

  const debouncedSearch = useDebounce((value: string) => {
    updateFilters({ search: value });
  }, 500);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onClearError();
    await onCreate(newName.trim());
    setNewName("");
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const saveEdit = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!editName.trim() || !item) { setEditingId(null); return; }
    if (item.name !== editName.trim()) {
      onClearError();
      await onRename(id, editName.trim());
    }
    setEditingId(null);
  };

  const renderHeader = (field: string, label: string) => {
    const isSorted = sortBy === field;
    return (
      <th
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => {
          if (isSorted) {
            updateFilters({ sort_order: sortOrder === "asc" ? "desc" : "asc", page });
          } else {
            updateFilters({ sort_by: field, sort_order: "asc", page });
          }
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {label}
          {isSorted && (
            <span style={{ fontSize: "12px", color: "var(--color-primary)" }}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          )}
        </div>
      </th>
    );
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="card" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="card-title">{title}</span>
      </div>

      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "12px", background: "var(--color-bg-alt)" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Szukaj..."
          style={{ flex: 1 }}
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            debouncedSearch(e.target.value);
          }}
        />
        <select
          className="form-control"
          style={{ width: "130px" }}
          value={isActiveVal || ""}
          onChange={(e) => updateFilters({ is_active: e.target.value })}
        >
          <option value="">Wszystkie</option>
          <option value="true">Aktywne</option>
          <option value="false">Nieaktywne</option>
        </select>
      </div>

      <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: "12px" }}>
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            className="form-control"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nowa nazwa..."
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
            + Dodaj
          </button>
        </form>
      </div>

      <div className="table-responsive" style={{ flex: 1 }}>
        <table className="table">
          <thead>
            <tr>
              {renderHeader("name", "Nazwa")}
              {renderHeader("is_active", "Status")}
              <th style={{ width: 110 }}>Akcja</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3}>
                  <div className="empty-state" style={{ padding: "24px" }}>
                    Brak elementów
                  </div>
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => saveEdit(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(item.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                      style={{ maxWidth: 200 }}
                    />
                  ) : (
                    <span
                      title="Kliknij, aby edytować"
                      onClick={() => startEdit(item)}
                      style={{
                        cursor: "pointer",
                        fontWeight: 500,
                        color: item.is_active ? "var(--color-text)" : "var(--color-text-muted)",
                        borderBottom: "1px dashed var(--color-border-subtle)",
                      }}
                    >
                      {item.name}
                    </span>
                  )}
                </td>
                <td>
                  <span className={item.is_active ? "badge badge-green" : "badge badge-gray"}>
                    {item.is_active ? "Aktywna" : "Nieaktywna"}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={`btn btn-sm ${item.is_active ? "btn-danger" : "btn-outline"}`}
                    onClick={() => onToggleActive(item.id, item.is_active)}
                  >
                    {item.is_active ? "Dezaktywuj" : "Aktywuj"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--color-border)", background: "var(--color-bg-alt)" }}>
          <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
            Łącznie: {totalItems}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => updateFilters({ page: page - 1 })}
            >
              Poprzednia
            </button>
            <span style={{ fontSize: "12px" }}>
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => updateFilters({ page: page + 1 })}
            >
              Następna
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DictionaryPage() {
  const [categoriesData, setCategoriesData] = useState<PaginatedCategoriesResponse | null>(null);
  const [departmentsData, setDepartmentsData] = useState<PaginatedDepartmentsResponse | null>(null);

  const [catLoading, setCatLoading] = useState(true);
  const [depLoading, setDepLoading] = useState(true);

  const [catError, setCatError] = useState<string | null>(null);
  const [depError, setDepError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setCatLoading(true);
    const filters: CategoryFilterParams = {
      page: parseInt(searchParams.get("cat_page") || "1", 10),
      page_size: parseInt(searchParams.get("cat_page_size") || "10", 10),
      sort_by: (searchParams.get("cat_sort_by") as any) || "name",
      sort_order: (searchParams.get("cat_sort_order") as any) || "asc",
      search: searchParams.get("cat_search") || "",
      is_active: searchParams.get("cat_is_active") === null ? "" : searchParams.get("cat_is_active") === "true",
    };

    getCategories(filters)
      .then(setCategoriesData)
      .catch((err) => setCatError(err.message || "Błąd pobierania kategorii"))
      .finally(() => setCatLoading(false));
  }, [
    searchParams.get("cat_page"),
    searchParams.get("cat_page_size"),
    searchParams.get("cat_sort_by"),
    searchParams.get("cat_sort_order"),
    searchParams.get("cat_search"),
    searchParams.get("cat_is_active")
  ]);

  useEffect(() => {
    setDepLoading(true);
    const filters: DepartmentFilterParams = {
      page: parseInt(searchParams.get("dep_page") || "1", 10),
      page_size: parseInt(searchParams.get("dep_page_size") || "10", 10),
      sort_by: (searchParams.get("dep_sort_by") as any) || "name",
      sort_order: (searchParams.get("dep_sort_order") as any) || "asc",
      search: searchParams.get("dep_search") || "",
      is_active: searchParams.get("dep_is_active") === null ? "" : searchParams.get("dep_is_active") === "true",
    };

    getDepartments(filters)
      .then(setDepartmentsData)
      .catch((err) => setDepError(err.message || "Błąd pobierania działów"))
      .finally(() => setDepLoading(false));
  }, [
    searchParams.get("dep_page"),
    searchParams.get("dep_page_size"),
    searchParams.get("dep_sort_by"),
    searchParams.get("dep_sort_order"),
    searchParams.get("dep_search"),
    searchParams.get("dep_is_active")
  ]);

  const refreshCategories = () => {
    const filters: CategoryFilterParams = {
      page: parseInt(searchParams.get("cat_page") || "1", 10),
      page_size: parseInt(searchParams.get("cat_page_size") || "10", 10),
      sort_by: (searchParams.get("cat_sort_by") as any) || "name",
      sort_order: (searchParams.get("cat_sort_order") as any) || "asc",
      search: searchParams.get("cat_search") || "",
      is_active: searchParams.get("cat_is_active") === null ? "" : searchParams.get("cat_is_active") === "true",
    };
    getCategories(filters).then(setCategoriesData);
  };

  const refreshDepartments = () => {
    const filters: DepartmentFilterParams = {
      page: parseInt(searchParams.get("dep_page") || "1", 10),
      page_size: parseInt(searchParams.get("dep_page_size") || "10", 10),
      sort_by: (searchParams.get("dep_sort_by") as any) || "name",
      sort_order: (searchParams.get("dep_sort_order") as any) || "asc",
      search: searchParams.get("dep_search") || "",
      is_active: searchParams.get("dep_is_active") === null ? "" : searchParams.get("dep_is_active") === "true",
    };
    getDepartments(filters).then(setDepartmentsData);
  };


  const handleCatCreate = async (name: string) => {
    try {
      await createCategory(name);
      toast.success("Utworzono kategorię");
      refreshCategories();
    } catch (err: any) {
      setCatError(err.message || "Błąd tworzenia kategorii");
      toast.error(err.message || "Błąd tworzenia kategorii");
      throw err;
    }
  };

  const handleCatToggle = async (id: string, current: boolean) => {
    try {
      await updateCategory(id, { is_active: !current });
      toast.success("Zaktualizowano status kategorii");
      refreshCategories();
    } catch (err: any) {
      setCatError(err.message);
      toast.error(err.message || "Błąd aktualizacji kategorii");
    }
  };

  const handleCatRename = async (id: string, name: string) => {
    try {
      await updateCategory(id, { name });
      toast.success("Zaktualizowano kategorię");
      refreshCategories();
    } catch (err: any) {
      setCatError(err.message);
      toast.error(err.message || "Błąd aktualizacji kategorii");
      throw err;
    }
  };

  const handleDepCreate = async (name: string) => {
    try {
      await createDepartment(name);
      toast.success("Utworzono dział");
      refreshDepartments();
    } catch (err: any) {
      setDepError(err.message || "Błąd tworzenia działu");
      toast.error(err.message || "Błąd tworzenia działu");
      throw err;
    }
  };

  const handleDepToggle = async (id: string, current: boolean) => {
    try {
      await updateDepartment(id, { is_active: !current });
      toast.success("Zaktualizowano status działu");
      refreshDepartments();
    } catch (err: any) {
      setDepError(err.message);
      toast.error(err.message || "Błąd aktualizacji działu");
    }
  };

  const handleDepRename = async (id: string, name: string) => {
    try {
      await updateDepartment(id, { name });
      toast.success("Zaktualizowano dział");
      refreshDepartments();
    } catch (err: any) {
      setDepError(err.message);
      toast.error(err.message || "Błąd aktualizacji działu");
      throw err;
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategorie i działy</h1>
          <p className="page-subtitle">Zarządzaj słownikami systemu zgłoszeń</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", alignItems: "stretch", minHeight: "500px" }}>
        {catLoading && !categoriesData ? (
          <div className="loading" style={{ flex: 1 }}>Ładowanie kategorii...</div>
        ) : (
          <DictPanel
            title="Kategorie"
            items={categoriesData?.items || []}
            totalItems={categoriesData?.total || 0}
            onCreate={handleCatCreate}
            onToggleActive={handleCatToggle}
            onRename={handleCatRename}
            error={catError}
            onClearError={() => setCatError(null)}
            prefix="cat_"
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          />
        )}

        {depLoading && !departmentsData ? (
          <div className="loading" style={{ flex: 1 }}>Ładowanie działów...</div>
        ) : (
          <DictPanel
            title="Działy"
            items={departmentsData?.items || []}
            totalItems={departmentsData?.total || 0}
            onCreate={handleDepCreate}
            onToggleActive={handleDepToggle}
            onRename={handleDepRename}
            error={depError}
            onClearError={() => setDepError(null)}
            prefix="dep_"
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          />
        )}
      </div>

      <div className="alert alert-info" style={{ marginTop: "24px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          Dezaktywacja kategorii lub działu nie usuwa go z istniejących zgłoszeń ani kont
          użytkowników - ukrywa go jedynie przy tworzeniu nowych rekordów.
        </div>
      </div>
    </div>
  );
}
