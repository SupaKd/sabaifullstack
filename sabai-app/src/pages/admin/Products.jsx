// ===== src/pages/admin/Products.jsx ===== (VERSION CORRIGÉE - ORDRE FIXÉ)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import API_CONFIG from '../../services/api.config';
import useAdminNotifications from '../../hooks/useAdminNotifications';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // ✅ IMPORTANT : Déclarer loadProducts AVANT le hook
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminProducts();
      
      if (data.success) {
        setProducts(data.data || []);
      } else if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Hook appelé APRÈS la déclaration de loadProducts
  const { isConnected } = useAdminNotifications(loadProducts);

  // ✅ useEffect vient après
  useEffect(() => {
    loadProducts();
  }, []);

  const handleStockUpdate = async (productId) => {
    try {
      await api.updateProductStock(productId, parseInt(newStock));
      setEditingStock(null);
      setNewStock('');
      loadProducts();
      alert('Stock mis à jour !');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleImageUpload = async (productId, file) => {
    try {
      await api.uploadProductImage(productId, file);
      loadProducts();
      alert('Image uploadée !');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleAvailabilityToggle = async (productId, newAvailability) => {
    try {
      await api.updateProductAvailability(productId, newAvailability);
      loadProducts();
    } catch (err) {
      console.error('Erreur disponibilité:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const startEditStock = (product) => {
    setEditingStock(product.id);
    setNewStock(product.stock.toString());
  };

  const getStockClass = (stock) => {
    const stockNum = parseInt(stock);
    if (stockNum === 0) return 'product-admin-card__stock--out';
    if (stockNum < 10) return 'product-admin-card__stock--low';
    if (stockNum < 20) return 'product-admin-card__stock--medium';
    return 'product-admin-card__stock--good';
  };

  const getStockLabel = (stock) => {
    const stockNum = parseInt(stock);
    if (stockNum === 0) return 'Rupture';
    if (stockNum < 10) return 'Stock faible';
    if (stockNum < 20) return 'Stock moyen';
    return 'Stock OK';
  };

  const categories = [...new Set(products.map(p => p.category))];

  const stockStats = {
    total: products.length,
    lowStock: products.filter(p => p.stock < 10 && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    available: products.filter(p => p.available).length
  };

  const filteredProducts = products.filter(product => {
    const matchCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchStock = 
      stockFilter === 'all' ||
      (stockFilter === 'low' && product.stock < 10 && product.stock > 0) ||
      (stockFilter === 'out' && product.stock === 0) ||
      (stockFilter === 'ok' && product.stock >= 10);
    
    return matchCategory && matchStock;
  });

  return (
    <div className="admin-products">
      {/* Header avec retour et indicateur de connexion */}
      <div className="admin-products__header">
        <div className="admin-products__header-left">
          <Link to="/admin" className="btn-back">
            ← Retour
          </Link>
          <h1 className="admin-products__title">Gestion des produits</h1>
          
          {/* Indicateur de connexion */}
          {isConnected && (
            <span className="connection-badge connection-badge--active">
              🔔 Alertes stock actives
            </span>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="products-stats">
        <div className="stat-mini">
          <span className="stat-mini__value">{stockStats.total}</span>
          <span className="stat-mini__label">Produits</span>
        </div>
        <div className="stat-mini stat-mini--warning">
          <span className="stat-mini__value">{stockStats.lowStock}</span>
          <span className="stat-mini__label">Stock faible</span>
        </div>
        <div className="stat-mini stat-mini--danger">
          <span className="stat-mini__value">{stockStats.outOfStock}</span>
          <span className="stat-mini__label">Rupture</span>
        </div>
        <div className="stat-mini stat-mini--success">
          <span className="stat-mini__value">{stockStats.available}</span>
          <span className="stat-mini__label">Disponibles</span>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="filter-group">
          <h3 className="filter-group__title">🏷️ Catégorie</h3>
          <div className="filter-buttons">
            <button 
              onClick={() => setCategoryFilter('all')}
              className={`filter-btn ${categoryFilter === 'all' ? 'filter-btn--active' : ''}`}
            >
              Toutes
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`filter-btn ${categoryFilter === cat ? 'filter-btn--active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h3 className="filter-group__title">📊 État du stock</h3>
          <div className="filter-buttons">
            <button 
              onClick={() => setStockFilter('all')}
              className={`filter-btn ${stockFilter === 'all' ? 'filter-btn--active' : ''}`}
            >
              Tous
            </button>
            <button 
              onClick={() => setStockFilter('low')}
              className={`filter-btn filter-btn--warning ${stockFilter === 'low' ? 'filter-btn--active' : ''}`}
            >
              Stock faible ({stockStats.lowStock})
            </button>
            <button 
              onClick={() => setStockFilter('out')}
              className={`filter-btn filter-btn--danger ${stockFilter === 'out' ? 'filter-btn--active' : ''}`}
            >
              Rupture ({stockStats.outOfStock})
            </button>
            <button 
              onClick={() => setStockFilter('ok')}
              className={`filter-btn filter-btn--success ${stockFilter === 'ok' ? 'filter-btn--active' : ''}`}
            >
              Stock OK
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🍜</div>
          <h3 className="empty-state__title">Aucun produit trouvé</h3>
          <p className="empty-state__text">Aucun produit ne correspond aux filtres sélectionnés</p>
        </div>
      ) : (
        <>
          <div className="results-summary">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} affiché{filteredProducts.length > 1 ? 's' : ''}
          </div>
          
          <div className="admin-products__grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-admin-card">
                <div className="product-admin-card__image-container">
                  {product.image_url ? (
                    <img 
                      src={API_CONFIG.imageUrl(product.image_url)}
                      alt={product.name}
                      className="product-admin-card__image"
                    />
                  ) : (
                    <div className="product-admin-card__no-image">
                      🍜<br/>Pas d'image
                    </div>
                  )}
                  
                  <label className="product-admin-card__upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(product.id, e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    📷 Changer
                  </label>
                </div>

                <div className="product-admin-card__info">
                  <div className="product-admin-card__header">
                    <h3 className="product-admin-card__name">{product.name}</h3>
                    <span className="product-admin-card__category">{product.category}</span>
                  </div>
                  
                  <div className="product-admin-card__price">
                    {parseFloat(product.price).toFixed(2)} €
                  </div>
                  
                  <div className="product-admin-card__stock-section">
                    <div className="stock-info">
                      <span className="stock-info__label">Stock:</span>
                      {editingStock === product.id ? (
                        <div className="stock-edit">
                          <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            className="stock-edit__input"
                            min="0"
                            autoFocus
                          />
                          <button 
                            onClick={() => handleStockUpdate(product.id)}
                            className="btn btn--small btn--success"
                            title="Enregistrer"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => setEditingStock(null)}
                            className="btn btn--small btn--danger"
                            title="Annuler"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div className="stock-display">
                          <span className={`stock-badge ${getStockClass(product.stock)}`}>
                            {product.stock} unités
                          </span>
                          <span className="stock-status">{getStockLabel(product.stock)}</span>
                          <button 
                            onClick={() => startEditStock(product)}
                            className="btn-icon"
                            title="Modifier le stock"
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="product-admin-card__availability">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={product.available}
                        onChange={(e) => handleAvailabilityToggle(product.id, e.target.checked)}
                        className="toggle-label__input"
                      />
                      <span className="toggle-label__slider"></span>
                      <span className="toggle-label__text">
                        {product.available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProducts;