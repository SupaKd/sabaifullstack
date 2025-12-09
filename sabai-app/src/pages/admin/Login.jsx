// ===== src/pages/admin/Login.jsx ===== (VERSION CORRIGÉE)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.adminLogin(credentials);
      
      // ✅ CORRECTION : Passer le token ET l'utilisateur
      if (!response.token) {
        throw new Error('Token manquant dans la réponse du serveur');
      }
      
      login(response.user, response.token); // ← AJOUT DU TOKEN
      
      console.log('✓ Connexion réussie, token stocké');
      navigate('/admin');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <img src="/images/logosabai.png" alt="logo" className="admin-login__icon"/>
        </div>
        
        {error && (
          <div className="error">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="admin-login__form">
          <div className="form-field">
            <label className="form-field__label">Nom d'utilisateur</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="form-field__input"
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">Mot de passe</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="admin-login__hint">
          💡 Identifiants par défaut: <strong>admin</strong> / <strong>admin123</strong>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;