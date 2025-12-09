// ===== src/components/ProtectedRoute.jsx =====
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Composant pour protéger les routes admin
 * Redirige vers /admin/login si non authentifié
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // Vérifier l'authentification
  if (!isAuthenticated()) {
    console.warn('⚠️ Accès refusé - Redirection vers login');
    return <Navigate to="/admin/login" replace />;
  }
  
  // Utilisateur authentifié, afficher la page
  return children;
};

export default ProtectedRoute;