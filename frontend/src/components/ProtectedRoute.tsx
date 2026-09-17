import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <header style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid black" }}>
        Zalogowany jako: {user.first_name} {user.last_name} ({user.login})
        <Link to="/users" style={{ marginLeft: "1rem" }}>
          Użytkownicy
        </Link>
        <button type="button" onClick={logout} style={{ marginLeft: "1rem" }}>
          Wyloguj
        </button>
      </header>
      {children}
    </>
  );
}
