import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user as any).role;
  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      <>
        <header style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid black" }}>
          Zalogowany jako: {user.first_name} {user.last_name} ({user.login})
          <button type="button" onClick={logout} style={{ marginLeft: "1rem" }}>
            Wyloguj
          </button>
        </header>
        <div>Brak uprawnień do tej strony</div>
      </>
    );
  }

  return (
    <>
      <header style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid black" }}>
        Zalogowany jako: {user.first_name} {user.last_name} ({user.login})
        <Link to="/" style={{ marginLeft: "1rem" }}>
          Zgłoszenia
        </Link>
        {role === "reporter" && (
          <Link to="/tickets/new" style={{ marginLeft: "1rem" }}>
            Nowe zgłoszenie
          </Link>
        )}
        {role === "admin" && (
          <>
            <Link to="/users" style={{ marginLeft: "1rem" }}>
              Użytkownicy
            </Link>
            <Link to="/categories" style={{ marginLeft: "1rem" }}>
              Kategorie
            </Link>
            <Link to="/departments" style={{ marginLeft: "1rem" }}>
              Działy
            </Link>
          </>
        )}
        <button type="button" onClick={logout} style={{ marginLeft: "1rem" }}>
          Wyloguj
        </button>
      </header>
      {children}
    </>
  );
}
