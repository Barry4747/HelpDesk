import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getDepartments } from "../api/departments";
import { createUser } from "../api/users";
import type { Department } from "../types/department";
import type { UserCreateInput } from "../types/user";

export function UserCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [formData, setFormData] = useState<UserCreateInput>({
    login: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "reporter",
    department_id: "",
  });

  useEffect(() => {
    getDepartments()
      .then((deps) => setDepartments(deps.filter((d) => d.is_active)))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: UserCreateInput = {
        ...formData,
        department_id: formData.department_id || undefined,
      };
      await createUser(payload);
      toast.success("Użytkownik został pomyślnie utworzony");
      navigate("/users");
    } catch (err: any) {
      toast.error(err.message || "Błąd podczas dodawania użytkownika");
      setError(err.message || "Błąd podczas dodawania użytkownika");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <button
            type="button"
            onClick={() => navigate("/users")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              fontSize: "13px",
              padding: 0,
              marginBottom: "8px",
              fontFamily: "inherit",
            }}
          >
            ← Wróć do listy użytkowników
          </button>
          <h1 className="page-title">Nowy użytkownik</h1>
          <p className="page-subtitle">Utwórz nowe konto w systemie</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate("/users")}>
          Anuluj
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="uc-first_name">
                  Imię <span className="form-label-required">*</span>
                </label>
                <input
                  id="uc-first_name"
                  type="text"
                  name="first_name"
                  className="form-control"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="uc-last_name">
                  Nazwisko <span className="form-label-required">*</span>
                </label>
                <input
                  id="uc-last_name"
                  type="text"
                  name="last_name"
                  className="form-control"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="uc-login">
                Login <span className="form-label-required">*</span>
              </label>
              <input
                id="uc-login"
                type="text"
                name="login"
                className="form-control"
                value={formData.login}
                onChange={handleChange}
                required
                minLength={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="uc-password">
                Hasło tymczasowe <span className="form-label-required">*</span>
              </label>
              <input
                id="uc-password"
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <span className="form-hint">Użytkownik zostanie poproszony o zmianę przy pierwszym logowaniu</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="uc-role">Rola</label>
                <select
                  id="uc-role"
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="reporter">Reporter</option>
                  <option value="support">Wsparcie (Support)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="uc-dept">Dział</label>
                <select
                  id="uc-dept"
                  name="department_id"
                  className="form-control"
                  value={formData.department_id || ""}
                  onChange={handleChange}
                >
                  <option value="">Brak działu</option>
                  {departments.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Tworzenie..." : "Utwórz konto"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate("/users")}>
                Anuluj
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
