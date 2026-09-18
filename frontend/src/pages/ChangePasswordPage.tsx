import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { changePassword as apiChangePassword } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }
    if (newPassword.length < 8) {
      setError("Hasło musi mieć co najmniej 8 znaków");
      return;
    }

    try {
      await apiChangePassword(newPassword);
      await refreshUser();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Zmiana hasła nie powiodła się");
    }
  };

  return (
    <main>
      <h1>Wymagana zmiana hasła</h1>
      <p>Musisz zmienić hasło tymczasowe przed kontynuacją.</p>
      {error && <p style={{ color: "red" }}>Błąd: {error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Nowe hasło:
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </label>
        <br />
        <label>
          Potwierdź nowe hasło:
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Zmień hasło</button>
      </form>
      <br />
      <Link to="/login">Powrót do logowania</Link>
    </main>
  );
}
