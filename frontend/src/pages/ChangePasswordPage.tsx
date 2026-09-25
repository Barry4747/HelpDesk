import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { changePassword as apiChangePassword } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      await apiChangePassword(newPassword);
      await refreshUser();
      toast.success("Hasło zostało pomyślnie zmienione");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Wystąpił błąd");
      setError(err.message || "Zmiana hasła nie powiodła się");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">HelpDesk</div>
      <div className="login-card">
        <h1>Zmiana hasła</h1>
        <p>Twoje hasło tymczasowe musi zostać zmienione przed kontynuacją.</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              Nowe hasło <span className="form-label-required">*</span>
            </label>
            <input
              id="new-password"
              type="password"
              className="form-control"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <span className="form-hint">Minimum 8 znaków</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">
              Potwierdź nowe hasło <span className="form-label-required">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              className="form-control"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
          >
            {loading ? "Zmienianie..." : "Zmień hasło"}
          </button>
        </form>

        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <Link to="/login" style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
            Wróć do logowania
          </Link>
        </div>
      </div>
    </div>
  );
}
