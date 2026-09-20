import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin: "role-admin",
    support: "role-support",
    reporter: "role-reporter",
  };
  const labels: Record<string, string> = {
    admin: "Admin",
    support: "Support",
    reporter: "Reporter",
  };
  return (
    <span className={`role-badge ${map[role] ?? ""}`}>
      {labels[role] ?? role}
    </span>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + "/");
  return (
    <Link to={to} className={`navbar-link${isActive ? " active" : ""}`}>
      {children}
    </Link>
  );
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="loading">Ładowanie...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = (user as any).role;

  const header = (
    <nav className="navbar">
      <span className="navbar-brand">HelpDesk</span>
      <div className="navbar-nav">
        <NavLink to="/">Zgłoszenia</NavLink>
        {role === "reporter" && (
          <NavLink to="/tickets/new">Nowe zgłoszenie</NavLink>
        )}
        {role === "admin" && (
          <>
            <NavLink to="/users">Użytkownicy</NavLink>
            <NavLink to="/dictionary">Kategorie i działy</NavLink>
          </>
        )}
      </div>
      <div className="navbar-right">
        <div className="navbar-user">
          <span className="navbar-user-name">
            {user.first_name} {user.last_name}
          </span>
          <RoleBadge role={role} />
        </div>
        <button type="button" className="btn-logout" onClick={logout}>
          Wyloguj
        </button>
      </div>
    </nav>
  );

  if (allowedRoles && (!role || !allowedRoles.includes(role))) {
    return (
      <>
        {header}
        <div className="page-wrapper">
          <div className="container">
            <div className="access-denied">
              <h2>Brak dostępu</h2>
              <p>Brak uprawnień do tej strony.</p>
              <Link to="/" className="btn btn-primary">
                Wróć do strony głównej
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="page-wrapper">{children}</div>
    </>
  );
}
