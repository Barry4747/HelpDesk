import type { User } from "../types/user";
import type { Department } from "../types/department";

interface UserTableProps {
  users: User[];
  departments: Department[];
  onRowClick: (id: string) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  support: "Support",
  reporter: "Reporter",
};

const ROLE_CLASSES: Record<string, string> = {
  admin: "badge badge-blue",
  support: "badge badge-amber",
  reporter: "badge badge-green",
};

export function UserTable({ users, departments, onRowClick, sortBy, sortOrder, onSortChange }: UserTableProps) {
  if (users.length === 0) {
    return <div className="empty-state">Brak użytkowników.</div>;
  }

  const renderHeader = (field: string, label: string) => {
    const isSorted = sortBy === field;
    return (
      <th 
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={() => onSortChange?.(field)}
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

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            {renderHeader("last_name", "Imię i nazwisko")}
            {renderHeader("login", "Login")}
            {renderHeader("role", "Rola")}
            {renderHeader("department_id", "Dział")}
            {renderHeader("is_active", "Status")}
            <th>Hasło tymcz.</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} onClick={() => onRowClick(user.id)}>
              <td>
                <span style={{ fontWeight: 500 }}>
                  {user.first_name} {user.last_name}
                </span>
              </td>
              <td style={{ color: "var(--color-text-secondary)" }}>{user.login}</td>
              <td>
                <span className={ROLE_CLASSES[user.role] ?? "badge badge-gray"}>
                  {ROLE_LABELS[user.role] ?? user.role}
                </span>
              </td>
              <td style={{ color: "var(--color-text-secondary)" }}>
                {user.department_id ? (
                  <span style={{ fontSize: "13px" }}>
                    {departments.find(d => d.id === user.department_id)?.name || user.department_id}
                  </span>
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>—</span>
                )}
              </td>
              <td>
                <span className={user.is_active ? "badge badge-green" : "badge badge-red"}>
                  {user.is_active ? "Aktywny" : "Nieaktywny"}
                </span>
              </td>
              <td>
                {user.is_temporary_password && (
                  <span className="badge badge-orange">Tymcz.</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
