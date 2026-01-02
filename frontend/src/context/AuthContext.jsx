// ===== src/context/AuthContext.jsx ===== (VERSION CORRIGÉE)
import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'https://api.sabai-thoiry.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ Éviter les doubles vérifications
  const hasCheckedSession = useRef(false);

  // Helper fetch unifié
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
    let data = {};
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('Erreur parsing JSON:', e);
      }
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || `Erreur HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }, []);

  // Vérifier la session au chargement
  const checkSession = useCallback(async () => {
    // ✅ Ne vérifier qu'une seule fois au chargement initial
    if (hasCheckedSession.current) {
      return;
    }
    hasCheckedSession.current = true;
    
    try {
      console.log(`🔍 Checking session on: ${API_URL}/api/admin/verify`);
      const data = await fetchAPI('/admin/verify');
      
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      // ✅ Ne pas afficher d'erreur pour les 401 (session non connectée normale)
      if (error.status !== 401) {
        console.error('Session check failed:', error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Connexion
  const login = useCallback(async (email, password) => {
    try {
      console.log(`🔐 Login attempt on: ${API_URL}/api/admin/login`);
      const data = await fetchAPI('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success && data.user) {
        setUser(data.user);
        // ✅ Réinitialiser le flag pour permettre une nouvelle vérification si nécessaire
        hasCheckedSession.current = true;
        return { success: true };
      }
      
      return { success: false, message: data.error || 'Réponse invalide du serveur' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.data?.error || error.message || 'Erreur de connexion' 
      };
    }
  }, [fetchAPI]);

  // Déconnexion
  const logout = useCallback(async () => {
    try {
      await fetchAPI('/admin/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // ✅ Réinitialiser pour permettre une nouvelle session
      hasCheckedSession.current = false;
    }
  }, [fetchAPI]);

  // ✅ Forcer une nouvelle vérification de session
  const refreshSession = useCallback(async () => {
    hasCheckedSession.current = false;
    setLoading(true);
    await checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      checkSession,
      refreshSession,
      apiUrl: API_URL,
      isAuthenticated: !!user
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