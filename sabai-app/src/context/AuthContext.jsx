// ===== src/context/AuthContext.jsx =====
import { createContext, useContext, useState, useEffect } from 'react';
import API_CONFIG from '../services/api.config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(API_CONFIG.url('/admin/verify'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fonction login
  const login = async (username, password) => {
    try {
      const response = await fetch(API_CONFIG.url('/admin/login'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur login:', error);
      return { success: false, error: error.message };
    }
  };

  // ✅ Fonction logout
  const logout = async () => {
    try {
      await fetch(API_CONFIG.url('/admin/logout'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};