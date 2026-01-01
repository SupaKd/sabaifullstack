// ===== src/pages/admin/Login.jsx ===== (VERSION COOKIES)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(credentials.email, credentials.password);

      if (result.success) {
        console.log('Connexion reussie');
        navigate("/admin");
      } else {
        throw new Error(result.message || 'Erreur de connexion');
      }

    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <img
            src="/images/logosabai.png"
            alt="logo"
            className="admin-login__icon"
          />
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit} className="admin-login__form">
          <div className="form-field">
            <label className="form-field__label">Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) =>
                setCredentials({ ...credentials, email: e.target.value })
              }
              className="form-field__input"
              placeholder="admin@sabai.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">Mot de passe</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) =>
                setCredentials({ ...credentials, password: e.target.value })
              }
              className="form-field__input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn--primary btn--large btn--full-width admin-login__submit"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;