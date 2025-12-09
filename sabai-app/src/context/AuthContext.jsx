// ===== src/context/AuthContext.jsx ===== (VERSION AMÉLIORÉE)
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // ✨ NOUVEAU : Stocker le token ET l'utilisateur
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('admin_token') || null;
  });

  // ✨ Login avec token JWT
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('admin_token', authToken);
  };

  // ✨ Logout amélioré
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
  };

  // ✨ Vérifier si le token est expiré (optionnel mais recommandé)
  const isTokenValid = () => {
    if (!token) return false;
    
    try {
      // Décoder le JWT (partie payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convertir en ms
      
      // Vérifier si expiré
      if (Date.now() >= expirationTime) {
        logout(); // Auto-logout si expiré
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erreur validation token:', error);
      return false;
    }
  };

  const isAuthenticated = () => {
    return !!user && !!token && isTokenValid();
  };

  // ✨ NOUVEAU : Helper pour récupérer le token
  const getToken = () => token;

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      login, 
      logout, 
      isAuthenticated,
      getToken,
      isTokenValid
    }}>
      {children}
    </AuthContext.Provider>
  );
};