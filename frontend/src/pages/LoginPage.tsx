import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { login as loginAPI } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const [loginVal, setLoginVal] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await loginAPI(loginVal, password);
      if (result.requires_password_change) {
        navigate("/change-password");
      } else {
        await refreshUser();
        toast.success("Pomyślnie zalogowano");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Nieprawidłowy login lub hasło");
      setError(err.message || "Nieprawidłowy login lub hasło");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">HelpDesk</div>
      <div className="login-card">
        <h1>Logowanie</h1>
        <p>Zaloguj się na swoje konto, aby kontynuować.</p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-input">
              Login <span className="form-label-required">*</span>
            </label>
            <input
              id="login-input"
              type="text"
              className="form-control"
              required
              autoComplete="username"
              value={loginVal}
              onChange={(e) => setLoginVal(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Hasło <span className="form-label-required">*</span>
            </label>
            <input
              id="password-input"
              type="password"
              className="form-control"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: "8px" }}
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>
      </div>
    </div>
  );
}
