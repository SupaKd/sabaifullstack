// ===== src/context/AuthContext.jsx ===== (VERSION UNIFIÉE - SANS AXIOS)
import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const AuthContext = createContext();

// Utiliser la variable d'environnement
const API_URL = import.meta.env.VITE_API_URL || 'https://api.sabai-thoiry.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Helper fetch unifié (remplace axios)
  const fetchAPI = useCallback(async (endpoint, options = {}) => {
    const url = `${API_URL}/api${endpoint}`;
    
    const config = {
      ...options,
      credentials: 'include', 
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    // Gérer les réponses vides
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      // ✅ Équivalent à error.response.data.message d'axios
      const error = new Error(data.message || data.error || `Erreur HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }, []);

  // ✅ Vérifier la session au chargement
  const checkSession = useCallback(async () => {
    try {
      console.log(`🔍 Checking session on: ${API_URL}/api/admin/verify`);
      const data = await fetchAPI('/admin/verify');
      
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // ✅ Connexion
  const login = useCallback(async (email, password) => {
    try {
      console.log(`🔐 Login attempt on: ${API_URL}/api/admin/login`);
      const data = await fetchAPI('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.user) {
        setUser(data.user);
        return { success: true };
      }
      
      return { success: false, message: 'Réponse invalide du serveur' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Erreur de connexion' 
      };
    }
  }, [fetchAPI]);

  // ✅ Déconnexion
  const logout = useCallback(async () => {
    try {
      await fetchAPI('/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Toujours déconnecter côté client, même si l'API échoue
      setUser(null);
    }
  }, [fetchAPI]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      checkSession,
      apiUrl: API_URL
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};