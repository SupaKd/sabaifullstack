// ===== src/components/ProtectedRoute.jsx ===== (VERSION CORRIGÉE)
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.5rem'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  // ✅ CORRECTION : user au lieu de isAuthenticated()
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;