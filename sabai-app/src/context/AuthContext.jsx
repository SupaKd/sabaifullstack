import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Utiliser la variable d'environnement
const API_URL = import.meta.env.VITE_API_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configuration axios avec l'URL depuis .env
  axios.defaults.baseURL = API_URL;
  axios.defaults.withCredentials = true;

  const checkSession = async () => {
    try {
      console.log(`🔍 Checking session on: ${API_URL}/api/admin/verify`);
      const response = await axios.get('/api/admin/verify');
      
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Session check failed:', error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email, password) => {
    try {
      console.log(`🔐 Login attempt on: ${API_URL}/api/admin/login`);
      const response = await axios.post('/api/admin/login', {
        email,
        password
      });

      if (response.data.user) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/admin/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

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