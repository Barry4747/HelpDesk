import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUsers } from "../api/users";
import { UserTable } from "../components/UserTable";
import type { User } from "../types/user";

export function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || "Błąd pobierania użytkowników");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  if (loading) return <div>Ładowanie użytkowników...</div>;
  if (error) return <div>Błąd: {error}</div>;

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1>Użytkownicy</h1>
        <Link to="/users/new">
          <button type="button">Dodaj użytkownika</button>
        </Link>
      </div>

      <UserTable users={users} onRowClick={(id) => navigate(`/users/${id}`)} />
    </main>
  );
}
