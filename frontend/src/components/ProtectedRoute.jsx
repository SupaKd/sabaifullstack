// ===== src/components/ProtectedRoute.jsx ===== (VERSION CORRIGÉE)
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant la vérification initiale
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.5rem',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #2c5530',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div>Vérification de la session...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ✅ Rediriger vers login si non authentifié
  if (!user) {
    // Sauvegarder l'URL actuelle pour rediriger après connexion
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;