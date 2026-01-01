// ===== src/pages/admin/Dashboard.jsx ===== (OPTIMISÉ TABLETTE avec Lucide)
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Euro,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Bell,
  BellOff,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import useAdminNotifications from '../../hooks/useAdminNotifications';
import NotificationSettings from '../../components/NotificationSettings';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeProducts: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [serviceStatus, setServiceStatus] = useState({
    isOpen: false,
    deliveryEnabled: false
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadRecentOrders(),
        loadServiceStatus()
      ]);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const { 
    isConnected, 
    attemptsRemaining,
    volume,
    setVolume,
    soundEnabled,
    setSoundEnabled
  } = useAdminNotifications(loadDashboardData);

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data.data || {
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0,
        totalProducts: 0,
        activeProducts: 0
      });
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const data = await api.getAdminOrders({ limit: 8 });
      setRecentOrders(data.data || []);
    } catch (error) {
      console.error('Erreur commandes récentes:', error);
    }
  };

  const loadServiceStatus = async () => {
    try {
      const data = await api.getServiceSettings();
      const settings = data.data || {};
      
      setServiceStatus({
        isOpen: settings.service_enabled === 'true',
        deliveryEnabled: settings.delivery_enabled === 'true'
      });
    } catch (error) {
      console.error('Erreur statut service:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      navigate('/admin/login');
    } catch (error) {
      console.error('Erreur logout:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const toggleService = async () => {
    try {
      const newStatus = !serviceStatus.isOpen;
      await api.updateServiceSetting('service_enabled', newStatus.toString());
      
      setServiceStatus(prev => ({
        ...prev,
        isOpen: newStatus
      }));
      
      toast.success(newStatus ? '✓ Restaurant ouvert' : 'Restaurant fermé', {
        duration: 3000,
        style: {
          fontSize: '18px',
          padding: '16px 24px'
        }
      });
    } catch (error) {
      console.error('Erreur toggle service:', error);
      toast.error('Erreur de connexion');
    }
  };

  const toggleDelivery = async () => {
    try {
      const newStatus = !serviceStatus.deliveryEnabled;
      await api.updateServiceSetting('delivery_enabled', newStatus.toString());
      
      setServiceStatus(prev => ({
        ...prev,
        deliveryEnabled: newStatus
      }));
      
      toast.success(newStatus ? '✓ Livraison activée' : 'Livraison désactivée', {
        duration: 3000,
        style: {
          fontSize: '18px',
          padding: '16px 24px'
        }
      });
    } catch (error) {
      console.error('Erreur toggle delivery:', error);
      toast.error('Erreur de connexion');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: 'Nouvelle', class: 'status-pending', priority: 1 },
      confirmed: { label: 'Confirmée', class: 'status-confirmed', priority: 2 },
      preparing: { label: 'En préparation', class: 'status-preparing', priority: 3 },
      ready: { label: 'Prête', class: 'status-ready', priority: 4 },
      delivering: { label: 'En livraison', class: 'status-delivering', priority: 5 },
      completed: { label: 'Terminée', class: 'status-completed', priority: 6 },
      cancelled: { label: 'Annulée', class: 'status-cancelled', priority: 7 }
    };
    return configs[status] || { label: status, class: 'status-pending', priority: 0 };
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard tablet-optimized">
      
      {/* Header Compact */}
      <div className="dashboard-header-tablet">
        <div className="header-top">
          <img src="/images/logosabai.png" alt="logo" className='logosabai' />
          <h1>Tableau de bord</h1>
          
          <div className="header-actions">
            <NotificationSettings
              volume={volume}
              setVolume={setVolume}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              isConnected={isConnected}
            />

            <button
              onClick={handleLogout}
              className="logout-btn-tablet"
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Toggles Service */}
        <div className="service-controls-tablet">
          <button
            onClick={toggleService}
            className={`service-toggle-btn ${serviceStatus.isOpen ? 'open' : 'closed'}`}
          >
            {serviceStatus.isOpen ? (
              <CheckCircle size={32} className="toggle-icon" />
            ) : (
              <XCircle size={32} className="toggle-icon" />
            )}
            <div className="toggle-content">
              <span className="toggle-label">Restaurant</span>
              <span className="toggle-status">
                {serviceStatus.isOpen ? 'OUVERT' : 'FERMÉ'}
              </span>
            </div>
          </button>

          <button
            onClick={toggleDelivery}
            className={`service-toggle-btn ${serviceStatus.deliveryEnabled ? 'open' : 'closed'}`}
            disabled={!serviceStatus.isOpen}
          >
            <Truck size={32} className="toggle-icon" />
            <div className="toggle-content">
              <span className="toggle-label">Livraison</span>
              <span className="toggle-status">
                {serviceStatus.deliveryEnabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions-tablet">
        <Link to="/admin/orders" className="action-btn-tablet primary">
          <ShoppingCart size={32} />
          <span>Commandes</span>
          {stats.pendingOrders > 0 && (
            <span className="badge-alert">{stats.pendingOrders}</span>
          )}
        </Link>

        <Link to="/admin/products" className="action-btn-tablet">
          <Package size={32} />
          <span>Produits</span>
        </Link>

        <Link to="/admin/horaires" className="action-btn-tablet">
          <Clock size={32} />
          <span>Horaires</span>
        </Link>
      </div>

      {/* Commandes récentes */}
      <div className="recent-orders-tablet">
        <div className="section-header-tablet">
          <h2>Commandes récentes</h2>
          <Link to="/admin/orders" className="view-all-btn">
            Voir tout
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state-tablet">
            <ShoppingCart size={48} />
            <p>Aucune commande</p>
          </div>
        ) : (
          <div className="orders-list-tablet">
            {recentOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <Link 
                  to={`/admin/orders`} 
                  key={order.id}
                  className="order-card-tablet"
                >
                  <div className="order-header-tablet">
                    <div className="order-number">#{order.id}</div>
                    <span className={`order-status-tablet ${statusConfig.class}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="order-body-tablet">
                    <div className="order-info">
                      <div className="order-customer">{order.customer_name || 'Client'}</div>
                      <div className="order-type">
                        {order.order_type === 'delivery' ? (
                          <Truck size={16} />
                        ) : (
                          <UtensilsCrossed size={16} />
                        )}
                        {order.order_type === 'delivery' ? 'Livraison' : 'Sur place'}
                      </div>
                    </div>

                    <div className="order-meta">
                      <div className="order-amount">
                        {parseFloat(order.total_amount || 0).toFixed(2)}€
                      </div>
                      <div className="order-time">
                        {new Date(order.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>

                  {order.status === 'pending' && (
                    <div className="order-urgent-indicator">
                      <AlertTriangle size={16} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;