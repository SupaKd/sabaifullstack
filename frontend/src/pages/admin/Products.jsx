// ===== src/pages/admin/Products.jsx ===== (CORRIGÉ - SANS IMPORT INUTILISÉ)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faImage,
  faEdit,
  faCheck,
  faTimes,
  faBell,
  faBox,
  faExclamationTriangle,
  faToggleOn,
  faToggleOff,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import api from '../../services/api';
import API_CONFIG from '../../services/api.config';
import useAdminNotifications from '../../hooks/useAdminNotifications';
// ✅ SUPPRIMÉ: import { useAuth } from '../../context/AuthContext'; (non utilisé)

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deletingProduct, setDeletingProduct] = useState(null);

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
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const { isConnected } = useAdminNotifications(loadProducts);

  useEffect(() => {
    loadProducts();
  }, []);

  const handleStockUpdate = async (productId) => {
    try {
      await api.updateProductStock(productId, parseInt(newStock));
      setEditingStock(null);
      setNewStock('');
      
      toast.success('✓ Stock mis à jour', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      
      loadProducts();
    } catch (err) {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleImageUpload = async (productId, file) => {
    if (!file) return;
    
    try {
      await api.uploadProductImage(productId, file);
      toast.success('✓ Image uploadée', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      loadProducts();
    } catch (err) {
      toast.error('Erreur upload image');
    }
  };

  const handleAvailabilityToggle = async (productId, newAvailability) => {
    try {
      await api.updateProductAvailability(productId, newAvailability);
      toast.success(newAvailability ? '✓ Produit disponible' : 'Produit indisponible', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      loadProducts();
    } catch (err) {
      toast.error('Erreur');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (deletingProduct === productId) {
      // Confirmation : supprimer définitivement
      try {
        await api.deleteProduct(productId);
        toast.success('✓ Produit supprimé', {
          duration: 2000,
          style: { fontSize: '18px', padding: '16px 24px' }
        });
        setDeletingProduct(null);
        loadProducts();
      } catch (err) {
        console.error('Erreur suppression:', err);
        toast.error('Erreur de suppression');
        setDeletingProduct(null);
      }
    } else {
      // Premier clic : demander confirmation
      setDeletingProduct(productId);
      toast('Cliquez à nouveau pour confirmer', {
        icon: '⚠️',
        duration: 3000,
        style: { fontSize: '16px', padding: '12px 20px' }
      });
      
      // Reset après 3 secondes
      setTimeout(() => {
        setDeletingProduct(null);
      }, 3000);
    }
  };

  const startEditStock = (product) => {
    setEditingStock(product.id);
    setNewStock(product.stock.toString());
  };

  const getStockConfig = (stock) => {
    const stockNum = parseInt(stock);
    if (stockNum === 0) return { 
      color: '#dc3545', 
      bgColor: '#f8d7da', 
      label: 'RUPTURE',
      icon: faExclamationTriangle
    };
    if (stockNum < 10) return { 
      color: '#ffc107', 
      bgColor: '#fff8e1', 
      label: 'FAIBLE',
      icon: faExclamationTriangle
    };
    if (stockNum < 20) return { 
      color: '#17a2b8', 
      bgColor: '#d1ecf1', 
      label: 'MOYEN',
      icon: faBox
    };
    return { 
      color: '#28a745', 
      bgColor: '#d4edda', 
      label: 'OK',
      icon: faBox
    };
  };

  const categories = [...new Set(products.map(p => p.category))];

  const stockStats = {
    total: products.length,
    lowStock: products.filter(p => p.stock < 10 && p.stock > 0).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    available: products.filter(p => p.available).length
  };

  const filteredProducts = products.filter(product => {
    return categoryFilter === 'all' || product.category === categoryFilter;
  });

  return (
    <div className="admin-products-tablet">
      {/* Header */}
      <div className="products-header-tablet">
        <Link to="/admin" className="back-btn-tablet">
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
        
        <h1>Produits</h1>
        
        <div className="header-badges">
          {isConnected && (
            <span className="ws-badge connected">
              <FontAwesomeIcon icon={faBell} />
            </span>
          )}
          <span className="count-badge">{products.length}</span>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="products-stats-tablet">
        <div className="stat-card-mini">
          <div className="stat-value">{stockStats.total}</div>
          <div className="stat-label">Produits</div>
        </div>
        <div className="stat-card-mini warning">
          <div className="stat-value">{stockStats.lowStock}</div>
          <div className="stat-label">Faible</div>
        </div>
        <div className="stat-card-mini danger">
          <div className="stat-value">{stockStats.outOfStock}</div>
          <div className="stat-label">Rupture</div>
        </div>
        <div className="stat-card-mini success">
          <div className="stat-value">{stockStats.available}</div>
          <div className="stat-label">Dispo</div>
        </div>
      </div>

      {/* Filtres catégories */}
      <div className="category-filters-tablet">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`category-btn ${categoryFilter === 'all' ? 'active' : ''}`}
        >
          Toutes
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`category-btn ${categoryFilter === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Liste des produits */}
      {loading ? (
        <div className="loading-tablet">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state-tablet">
          <FontAwesomeIcon icon={faBox} />
          <p>Aucun produit</p>
        </div>
      ) : (
        <div className="products-grid-tablet">
          {filteredProducts.map(product => {
            const stockConfig = getStockConfig(product.stock);
            const isEditing = editingStock === product.id;
            const isDeleting = deletingProduct === product.id;

            return (
              <div 
                key={product.id} 
                className="product-card-tablet"
                style={{
                  borderLeft: `6px solid ${stockConfig.color}`
                }}
              >
                {/* Image produit */}
                <div className="product-image-tablet">
                  {product.image_url ? (
                    <img 
                      src={API_CONFIG.imageUrl(product.image_url)}
                      alt={product.name}
                    />
                  ) : (
                    <div className="no-image-tablet">
                      <FontAwesomeIcon icon={faImage} />
                      <span>Pas d'image</span>
                    </div>
                  )}
                  
                  <label className="upload-btn-tablet">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(product.id, e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <FontAwesomeIcon icon={faImage} />
                    Changer
                  </label>
                </div>

                {/* Infos produit */}
                <div className="product-info-tablet">
                  <div className="product-header-tablet">
                    <h3>{product.name}</h3>
                    <span className="category-badge-tablet">{product.category}</span>
                  </div>

                  <div className="product-price-tablet">
                    {parseFloat(product.price).toFixed(2)} €
                  </div>

                  {/* Gestion du stock */}
                  <div className="stock-section-tablet">
                    {isEditing ? (
                      <div className="stock-edit-tablet">
                        <input
                          type="number"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          min="0"
                          autoFocus
                        />
                        <button 
                          onClick={() => handleStockUpdate(product.id)}
                          className="btn-confirm-tablet"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button 
                          onClick={() => setEditingStock(null)}
                          className="btn-cancel-tablet"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ) : (
                      <div className="stock-display-tablet">
                        <div 
                          className="stock-badge-tablet"
                          style={{
                            background: stockConfig.bgColor,
                            color: stockConfig.color
                          }}
                        >
                          <FontAwesomeIcon icon={stockConfig.icon} />
                          <span className="stock-value">{product.stock}</span>
                          <span className="stock-label">{stockConfig.label}</span>
                        </div>
                        <button 
                          onClick={() => startEditStock(product)}
                          className="btn-edit-stock-tablet"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions : Toggle disponibilité + Supprimer */}
                  <div className="product-actions-tablet">
                    <button
                      className={`availability-btn-tablet ${product.available ? 'available' : 'unavailable'}`}
                      onClick={() => handleAvailabilityToggle(product.id, !product.available)}
                    >
                      <FontAwesomeIcon 
                        icon={product.available ? faToggleOn : faToggleOff} 
                      />
                      <span>{product.available ? 'Disponible' : 'Indisponible'}</span>
                    </button>

                    <button
                      className={`delete-btn-tablet ${isDeleting ? 'confirm' : ''}`}
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      <span>{isDeleting ? 'Confirmer' : ''}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;