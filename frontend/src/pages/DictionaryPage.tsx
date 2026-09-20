import { useEffect, useState } from "react";
import { createCategory, getCategories, updateCategory } from "../api/categories";
import { createDepartment, getDepartments, updateDepartment } from "../api/departments";
import type { Category } from "../types/category";
import type { Department } from "../types/department";

// ─── mini słownik inline ────────────────────────────────────────────────────

interface Item {
  id: string;
  name: string;
  is_active: boolean;
}

interface DictPanelProps {
  title: string;
  items: Item[];
  onCreate: (name: string) => Promise<void>;
  onToggleActive: (id: string, currentValue: boolean) => Promise<void>;
  onRename: (id: string, newName: string) => Promise<void>;
  error: string | null;
  onClearError: () => void;
}

function DictPanel({
  title,
  items,
  onCreate,
  onToggleActive,
  onRename,
  error,
  onClearError,
}: DictPanelProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  return (
    <div className="card" style={{ flex: 1, minWidth: 0 }}>
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>

      {/* Formularz dodawania */}
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

      {/* Tabela */}
      <table>
        <thead>
          <tr>
            <th>Nazwa</th>
            <th style={{ width: 90 }}>Status</th>
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
            <tr key={item.id} style={{ cursor: "default" }}>
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
  );
}

// ─── Główna strona ────────────────────────────────────────────────────────────

export function DictionaryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [catError, setCatError] = useState<string | null>(null);
  const [depError, setDepError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getCategories(), getDepartments()])
      .then(([cats, deps]) => {
        setCategories(cats);
        setDepartments(deps);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── kategorie ──
  const handleCatCreate = async (name: string) => {
    try {
      const created = await createCategory(name);
      setCategories((prev) => [...prev, created]);
    } catch (err: any) {
      setCatError(err.message || "Błąd tworzenia kategorii");
      throw err;
    }
  };

  const handleCatToggle = async (id: string, current: boolean) => {
    try {
      const updated = await updateCategory(id, { is_active: !current });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err: any) {
      setCatError(err.message);
    }
  };

  const handleCatRename = async (id: string, name: string) => {
    try {
      const updated = await updateCategory(id, { name });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err: any) {
      setCatError(err.message);
      throw err;
    }
  };

  // ── działy ──
  const handleDepCreate = async (name: string) => {
    try {
      const created = await createDepartment(name);
      setDepartments((prev) => [...prev, created]);
    } catch (err: any) {
      setDepError(err.message || "Błąd tworzenia działu");
      throw err;
    }
  };

  const handleDepToggle = async (id: string, current: boolean) => {
    try {
      const updated = await updateDepartment(id, { is_active: !current });
      setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err: any) {
      setDepError(err.message);
    }
  };

  const handleDepRename = async (id: string, name: string) => {
    try {
      const updated = await updateDepartment(id, { name });
      setDepartments((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err: any) {
      setDepError(err.message);
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

      {loading ? (
        <div className="loading">Ładowanie...</div>
      ) : (
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          <DictPanel
            title="Kategorie"
            items={categories}
            onCreate={handleCatCreate}
            onToggleActive={handleCatToggle}
            onRename={handleCatRename}
            error={catError}
            onClearError={() => setCatError(null)}
          />
          <DictPanel
            title="Działy"
            items={departments}
            onCreate={handleDepCreate}
            onToggleActive={handleDepToggle}
            onRename={handleDepRename}
            error={depError}
            onClearError={() => setDepError(null)}
          />
        </div>
      )}

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
