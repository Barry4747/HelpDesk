import type { User } from "../types/user";

interface UserTableProps {
  users: User[];
  onRowClick: (id: string) => void;
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

export function UserTable({ users, onRowClick }: UserTableProps) {
  if (users.length === 0) {
    return <div className="empty-state">Brak użytkowników.</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Imię i nazwisko</th>
          <th>Login</th>
          <th>Rola</th>
          <th>Dział</th>
          <th>Status</th>
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
                <span style={{ fontSize: "12px" }}>{user.department_id}</span>
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
  );
}
