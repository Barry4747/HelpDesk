import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getDepartments } from "../api/departments";
import { deactivateUser, getUser, updateUser } from "../api/users";
import type { Department } from "../types/department";
import type { User, UserUpdateInput } from "../types/user";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  support: "Wsparcie (Support)",
  reporter: "Reporter",
};

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [editData, setEditData] = useState<UserUpdateInput>({});
  const [passwordInput, setPasswordInput] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([getUser(id), getDepartments()])
      .then(([userData, depsData]) => {
        setUser(userData);
        setDepartments(depsData);
        setEditData({
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role as "reporter" | "support",
          department_id: userData.department_id || "",
        });
      })
      .catch((err: any) => setError(err.message || "Błąd pobierania danych"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaveMsg(null);
    try {
      const payload: UserUpdateInput = {
        ...editData,
        department_id: editData.department_id || undefined,
      };
      const updated = await updateUser(id, payload);
      setUser(updated);
      setSaveMsg("Dane zostały zapisane.");
      toast.success("Dane użytkownika zostały zaktualizowane");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Błąd podczas zapisywania danych");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !passwordInput) return;
    setSaveMsg(null);
    try {
      const updated = await updateUser(id, { password: passwordInput });
      setUser(updated);
      setPasswordInput("");
      setSaveMsg("Hasło zostało zmienione. Użytkownik będzie musiał je zmienić przy następnym logowaniu.");
      toast.success("Hasło zostało zmienione");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Błąd podczas zmiany hasła");
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    if (!window.confirm("Czy na pewno chcesz dezaktywować tego użytkownika?")) return;
    try {
      const updated = await deactivateUser(id);
      setUser(updated);
      toast.success("Konto zostało dezaktywowane");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "Wystąpił błąd");
    }
  };

  if (loading) return <div className="loading">Ładowanie...</div>;

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate("/users")}>Wróć do listy</button>
      </div>
    );
  }

  if (!user) return null;

  const currentDep = departments.find((d) => d.id === user.department_id);
  const deptOptions = departments.filter((d) => d.is_active);
  if (currentDep && !currentDep.is_active) {
    deptOptions.push(currentDep);
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate("/users")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-secondary)", fontSize: "13px",
              padding: 0, marginBottom: "8px", fontFamily: "inherit",
            }}
          >
            ← Wróć do listy użytkowników
          </button>
          <h1 className="page-title">
            {user.first_name} {user.last_name}
          </h1>
          <p className="page-subtitle">{ROLE_LABELS[user.role] ?? user.role} · {user.login}</p>
        </div>
        {user.is_active && (
          <button type="button" className="btn btn-danger btn-sm" onClick={handleDeactivate}>
            Dezaktywuj konto
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {saveMsg && <div className="alert alert-info">{saveMsg}</div>}

      {/* Info badges */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <span className={user.is_active ? "badge badge-green" : "badge badge-red"}>
          {user.is_active ? "Aktywny" : "Nieaktywny"}
        </span>
        {user.is_temporary_password && (
          <span className="badge badge-orange">Wymagana zmiana hasła</span>
        )}
      </div>

      {/* Info card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <span className="card-title">Informacje o koncie</span>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-field">
              <span className="detail-label">ID</span>
              <span className="detail-value" style={{ fontSize: "12px", wordBreak: "break-all" }}>{user.id}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Login</span>
              <span className="detail-value">{user.login}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Rola</span>
              <span className="detail-value">{ROLE_LABELS[user.role] ?? user.role}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">Dział</span>
              <span className="detail-value">{user.department_id || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* Edit data form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Edytuj dane</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="ud-first">Imię</label>
                <input
                  id="ud-first"
                  type="text"
                  name="first_name"
                  className="form-control"
                  value={editData.first_name || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ud-last">Nazwisko</label>
                <input
                  id="ud-last"
                  type="text"
                  name="last_name"
                  className="form-control"
                  value={editData.last_name || ""}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ud-role">Rola</label>
                <select
                  id="ud-role"
                  name="role"
                  className="form-control"
                  value={editData.role || "reporter"}
                  onChange={handleEditChange}
                >
                  <option value="reporter">Reporter</option>
                  <option value="support">Wsparcie (Support)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="ud-dept">Dział</label>
                <select
                  id="ud-dept"
                  name="department_id"
                  className="form-control"
                  value={editData.department_id || ""}
                  onChange={handleEditChange}
                >
                  <option value="">Brak działu</option>
                  {deptOptions.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name} {!dep.is_active && "(nieaktywny)"}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Zapisz dane</button>
            </form>
          </div>
        </div>

        {/* Change password form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Zmień hasło</span>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="ud-password">Nowe hasło tymczasowe</label>
                <input
                  id="ud-password"
                  type="password"
                  className="form-control"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  minLength={6}
                />
                <span className="form-hint">
                  Użytkownik zostanie poproszony o zmianę przy następnym logowaniu
                </span>
              </div>
              <button type="submit" className="btn btn-outline">Ustaw nowe hasło</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
