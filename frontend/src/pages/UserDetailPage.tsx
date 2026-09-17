import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deactivateUser, getUser, updateUser } from "../api/users";
import type { User, UserUpdateInput } from "../types/user";

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editData, setEditData] = useState<UserUpdateInput>({});
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!id) return;
      try {
        const data = await getUser(id);
        setUser(data);
        setEditData({
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role as "reporter" | "support",
          department_id: data.department_id || "",
        });
      } catch (err: any) {
        setError(err.message || "Błąd pobierania użytkownika");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [id]);

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const payload: UserUpdateInput = {
        ...editData,
        department_id: editData.department_id || undefined,
      };
      const updated = await updateUser(id, payload);
      setUser(updated);
      alert("Zapisano zmiany");
    } catch (err: any) {
      alert("Błąd zapisu: " + err.message);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !passwordInput) return;
    try {
      const updated = await updateUser(id, { password: passwordInput });
      setUser(updated);
      setPasswordInput("");
      setPasswordMessage("Użytkownik będzie musiał zmienić hasło przy następnym logowaniu");
    } catch (err: any) {
      alert("Błąd zmiany hasła: " + err.message);
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    if (!window.confirm("Czy na pewno chcesz dezaktywować tego użytkownika?")) return;
    try {
      const updated = await deactivateUser(id);
      setUser(updated);
    } catch (err: any) {
      alert("Błąd dezaktywacji: " + err.message);
    }
  };

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error}</div>;
  if (!user) return <div>Brak danych użytkownika</div>;

  return (
    <main>
      <h1>Szczegóły użytkownika</h1>

      <div style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem" }}>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Login:</strong> {user.login}</p>
        <p><strong>Aktywny:</strong> {user.is_active ? "Tak" : "Nie"}</p>
        <p><strong>Hasło tymczasowe:</strong> {user.is_temporary_password ? "Tak" : "Nie"}</p>
      </div>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 300px", border: "1px solid #ccc", padding: "1rem" }}>
          <h2>Edytuj dane</h2>
          <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label>
              Imię:
              <input type="text" name="first_name" value={editData.first_name || ""} onChange={handleEditChange} required />
            </label>
            <label>
              Nazwisko:
              <input type="text" name="last_name" value={editData.last_name || ""} onChange={handleEditChange} required />
            </label>
            <label>
              Rola:
              <select name="role" value={editData.role || "reporter"} onChange={handleEditChange}>
                <option value="reporter">Reporter</option>
                <option value="support">Wsparcie (Support)</option>
              </select>
            </label>
            <label>
              Dział (UUID):
              <input type="text" name="department_id" value={editData.department_id || ""} onChange={handleEditChange} />
            </label>
            <button type="submit">Zapisz dane</button>
          </form>
        </div>

        <div style={{ flex: "1 1 300px", border: "1px solid #ccc", padding: "1rem" }}>
          <h2>Zmień hasło</h2>
          {passwordMessage && (
            <div style={{ color: "green", marginBottom: "1rem" }}>
              {passwordMessage}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label>
              Nowe hasło:
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required minLength={6} />
            </label>
            <button type="submit">Ustaw nowe hasło</button>
          </form>
        </div>
      </div>

      <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #ccc" }}>
        <h2>Zarządzanie kontem</h2>
        <button type="button" onClick={handleDeactivate} disabled={!user.is_active}>
          {user.is_active ? "Dezaktywuj konto" : "Konto zdeztywowane"}
        </button>
        <button type="button" onClick={() => navigate("/users")} style={{ marginLeft: "1rem" }}>
          Powrót do listy
        </button>
      </div>
    </main>
  );
}
