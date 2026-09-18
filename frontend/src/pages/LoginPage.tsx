import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await apiLogin(login, password);
      if (result.requires_password_change) {
        navigate("/change-password");
      } else {
        await refreshUser();
        navigate("/");
      }
    } catch (err: any) {
      setError("Nieprawidłowy login lub hasło");
    }
  };

  return (
    <main>
      <h1>Logowanie</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Login:
          <input
            type="text"
            required
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </label>
        <br />
        <label>
          Hasło:
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Zaloguj</button>
      </form>
    </main>
  );
}
