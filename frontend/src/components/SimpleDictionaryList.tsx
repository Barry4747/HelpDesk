import { useState } from "react";

export interface DictionaryItem {
  id: string;
  name: string;
  is_active: boolean;
}

interface SimpleDictionaryListProps {
  title: string;
  items: DictionaryItem[];
  onCreate: (name: string) => Promise<void>;
  onToggleActive: (id: string, currentValue: boolean) => Promise<void>;
  onRename: (id: string, newName: string) => Promise<void>;
}

export function SimpleDictionaryList({
  title,
  items,
  onCreate,
  onToggleActive,
  onRename,
}: SimpleDictionaryListProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await onCreate(newName.trim());
      setNewName("");
    } catch (err: any) {
      setError(err.message || "Wystąpił błąd");
    }
  };

  const handleStartEdit = (item: DictionaryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    const item = items.find((i) => i.id === id);
    if (item && item.name !== editName.trim()) {
      try {
        await onRename(id, editName.trim());
        setEditingId(null);
      } catch (err: any) {
        setError(err.message || "Wystąpił błąd");
      }
    } else {
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      handleSaveEdit(id);
    } else if (e.key === "Escape") {
      setEditingId(null);
    }
  };

  return (
    <main>
      <h1>{title}</h1>

      {error && (
        <div style={{ color: "red", border: "1px solid red", padding: "1rem", marginBottom: "1rem" }}>
          <strong>Błąd:</strong> {error}
        </div>
      )}

      <form onSubmit={handleCreateSubmit} style={{ marginBottom: "2rem", display: "flex", gap: "1rem" }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nowa nazwa"
          required
        />
        <button type="submit">Dodaj</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Nazwa</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Akcja</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={tdStyle}>
                {editingId === item.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSaveEdit(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, item.id)}
                    autoFocus
                  />
                ) : (
                  <span
                    style={{ cursor: "pointer", borderBottom: "1px dashed #ccc" }}
                    onClick={() => handleStartEdit(item)}
                    title="Kliknij, aby edytować"
                  >
                    {item.name}
                  </span>
                )}
              </td>
              <td style={tdStyle}>
                {item.is_active ? "Aktywna" : "Nieaktywna"}
              </td>
              <td style={tdStyle}>
                <button
                  type="button"
                  onClick={() => onToggleActive(item.id, item.is_active)}
                >
                  {item.is_active ? "Dezaktywuj" : "Aktywuj"}
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={3} style={tdStyle}>Brak elementów</td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}

const thStyle = {
  borderBottom: "2px solid black",
  padding: "8px",
  textAlign: "left" as const,
};

const tdStyle = {
  borderBottom: "1px solid #ccc",
  padding: "8px",
};
