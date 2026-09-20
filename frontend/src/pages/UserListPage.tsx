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
    getUsers()
      .then(setUsers)
      .catch((err: any) => setError(err.message || "Błąd pobierania użytkowników"))
      .finally(() => setLoading(false));
  }, []);

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

      {loading ? (
        <div className="loading">Ładowanie...</div>
      ) : (
        <div className="table-wrapper">
          <UserTable users={users} onRowClick={(id) => navigate(`/users/${id}`)} />
        </div>
      )}
    </div>
  );
}
