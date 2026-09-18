import type { User } from "../types/user";

interface UserTableProps {
  users: User[];
  onRowClick: (id: string) => void;
}

export function UserTable({ users, onRowClick }: UserTableProps) {
  if (users.length === 0) {
    return <p>Brak użytkowników.</p>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={thStyle}>Imię i nazwisko</th>
          <th style={thStyle}>Login</th>
          <th style={thStyle}>Rola</th>
          <th style={thStyle}>Dział</th>
          <th style={thStyle}>Aktywny</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr
            key={user.id}
            onClick={() => onRowClick(user.id)}
            style={trStyle}
          >
            <td style={tdStyle}>
              {user.first_name} {user.last_name}
            </td>
            <td style={tdStyle}>{user.login}</td>
            <td style={tdStyle}>{user.role}</td>
            <td style={tdStyle}>{user.department_id || "Brak"}</td>
            <td style={tdStyle}>{user.is_active ? "Tak" : "Nie"}</td>
          </tr>
        ))}
      </tbody>
    </table>
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

const trStyle = {
  cursor: "pointer",
};
