import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDepartments } from "../api/departments";
import { createUser } from "../api/users";
import type { Department } from "../types/department";
import type { UserCreateInput } from "../types/user";

export function UserCreatePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
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
    async function fetchDeps() {
      try {
        const deps = await getDepartments();
        setDepartments(deps.filter((d) => d.is_active));
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    }
    fetchDeps();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload: UserCreateInput = {
        ...formData,
        department_id: formData.department_id || undefined,
      };
      const user = await createUser(payload);
      navigate(`/users/${user.id}`);
    } catch (err: any) {
      setError(err.message || "Błąd podczas dodawania użytkownika");
    }
  };

  return (
    <main>
      <h1>Dodaj użytkownika</h1>
      
      {error && (
        <div style={{ color: "red", border: "1px solid red", padding: "1rem", marginBottom: "1rem" }}>
          <strong>Błąd:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
        <label>
          Login:
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            required
            minLength={3}
          />
        </label>
        
        <label>
          Hasło tymczasowe:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </label>
        
        <label>
          Imię:
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </label>
        
        <label>
          Nazwisko:
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </label>
        
        <label>
          Rola:
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="reporter">Reporter</option>
            <option value="support">Wsparcie (Support)</option>
          </select>
        </label>
        
        <label>
          Dział:
          <select
            name="department_id"
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
        </label>
        
        <div style={{ marginTop: "1rem" }}>
          <button type="submit">Zapisz użytkownika</button>
          <button type="button" onClick={() => navigate("/users")} style={{ marginLeft: "1rem" }}>
            Anuluj
          </button>
        </div>
      </form>
    </main>
  );
}
