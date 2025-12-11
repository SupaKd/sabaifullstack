// ===== src/pages/NotFound.jsx =====
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <div className="notfound-illustration">
          <span className="notfound-number">4</span>
          <span className="notfound-bowl">🍜</span>
          <span className="notfound-number">4</span>
        </div>
        
        <h1 className="notfound-title">Page introuvable</h1>
        <p className="notfound-text">
          Oups ! La page que vous recherchez semble avoir disparu...
        </p>
        
        <div className="notfound-actions">
          <Link to="/" className="btn-primary">
            Retour à l'accueil
          </Link>
          <Link to="/cart" className="btn-secondary">
            Voir mon panier
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;