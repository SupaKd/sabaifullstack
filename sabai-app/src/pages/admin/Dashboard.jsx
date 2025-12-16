// ===== src/pages/admin/Dashboard.jsx ===== (AVEC CONTRÔLE VOLUME)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShoppingCart,
  faEuroSign,
  faUtensils,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faTruck,
  faChartLine,
  faBox,
  faBell,
  faBellSlash
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAdminNotifications from '../../hooks/useAdminNotifications';
import NotificationSettings from '../../components/NotificationSettings'; // ✅ AJOUTÉ

const AdminDashboard = () => {
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
      toast.error('Erreur lors du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Hook avec contrôles du volume
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
      const data = await api.getAdminOrders({ limit: 5 });
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

  const toggleService = async () => {
    try {
      const newStatus = !serviceStatus.isOpen;
      await api.updateServiceSetting('service_enabled', newStatus.toString());
      
      setServiceStatus(prev => ({
        ...prev,
        isOpen: newStatus
      }));
      
      toast.success(newStatus ? 'Service activé ✓' : 'Service désactivé');
    } catch (error) {
      console.error('Erreur toggle service:', error);
      toast.error('Erreur lors du changement de statut');
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
      
      toast.success(newStatus ? 'Livraison activée ✓' : 'Livraison désactivée');
    } catch (error) {
      console.error('Erreur toggle delivery:', error);
      toast.error('Erreur lors du changement de statut livraison');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'En attente', class: 'status-pending' },
      confirmed: { label: 'Confirmée', class: 'status-confirmed' },
      preparing: { label: 'En préparation', class: 'status-preparing' },
      ready: { label: 'Prête', class: 'status-ready' },
      delivering: { label: 'En livraison', class: 'status-delivering' },
      completed: { label: 'Terminée', class: 'status-completed' },
      cancelled: { label: 'Annulée', class: 'status-cancelled' }
    };

    const config = statusConfig[status] || { label: status, class: 'status-pending' };
    return <span className={`order-status ${config.class}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header avec statut du service et notifications */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Tableau de bord</h1>
          
          {/* ✅ Indicateur de connexion WebSocket */}
          <div className="notification-status">
            <FontAwesomeIcon 
              icon={isConnected ? faBell : faBellSlash} 
              className={isConnected ? 'notification-active' : 'notification-inactive'}
            />
            <span className="notification-text">
              {isConnected ? 'Notifications actives' : `Reconnexion (${attemptsRemaining})`}
            </span>
          </div>

          {/* ✅ NOUVEAU : Contrôles du volume */}
          <NotificationSettings
            volume={volume}
            setVolume={setVolume}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            isConnected={isConnected}
          />

          <div className="service-controls">
            <div className="service-toggle">
              <button
                onClick={toggleService}
                className={`toggle-btn ${serviceStatus.isOpen ? 'active' : ''}`}
              >
                <FontAwesomeIcon
                  icon={serviceStatus.isOpen ? faCheckCircle : faTimesCircle}
                />
                <span>Service {serviceStatus.isOpen ? 'Ouvert' : 'Fermé'}</span>
              </button>
            </div>

            <div className="service-toggle">
              <button
                onClick={toggleDelivery}
                className={`toggle-btn ${serviceStatus.deliveryEnabled ? 'active' : ''}`}
                disabled={!serviceStatus.isOpen}
              >
                <FontAwesomeIcon icon={faTruck} />
                <span>Livraison {serviceStatus.deliveryEnabled ? 'Active' : 'Inactive'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orders">
            <FontAwesomeIcon icon={faShoppingCart} />
          </div>
          <div className="stat-content">
            <h3>Commandes aujourd'hui</h3>
            <p className="stat-value">{stats.todayOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <FontAwesomeIcon icon={faEuroSign} />
          </div>
          <div className="stat-content">
            <h3>Chiffre d'affaires</h3>
            <p className="stat-value">{parseFloat(stats.todayRevenue || 0).toFixed(2)} €</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-content">
            <h3>Commandes en attente</h3>
            <p className="stat-value">{stats.pendingOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">
            <FontAwesomeIcon icon={faUtensils} />
          </div>
          <div className="stat-content">
            <h3>Produits actifs</h3>
            <p className="stat-value">
              {stats.activeProducts} / {stats.totalProducts}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Actions rapides</h2>
        <div className="actions-grid">
          <Link to="/admin/orders" className="action-card">
            <FontAwesomeIcon icon={faShoppingCart} />
            <span>Gérer les commandes</span>
          </Link>

          <Link to="/admin/products" className="action-card">
            <FontAwesomeIcon icon={faBox} />
            <span>Gérer les produits</span>
          </Link>

          <Link to="/admin/horaires" className="action-card">
            <FontAwesomeIcon icon={faClock} />
            <span>Gérer les horaires</span>
          </Link>

          <Link to="/admin/stats" className="action-card">
            <FontAwesomeIcon icon={faChartLine} />
            <span>Voir les statistiques</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="recent-orders">
        <div className="section-header">
          <h2>Commandes récentes</h2>
          <Link to="/admin/orders" className="view-all-link">
            Voir tout →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faShoppingCart} />
            <p>Aucune commande récente</p>
          </div>
        ) : (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>N° Commande</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to={`/admin/orders/${order.id}`} className="order-link">
                        #{order.id}
                      </Link>
                    </td>
                    <td>{order.customer_name || 'Client'}</td>
                    <td>
                      <span className={`order-type ${order.order_type}`}>
                        {order.order_type === 'delivery' ? (
                          <>
                            <FontAwesomeIcon icon={faTruck} /> Livraison
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faUtensils} /> Sur place
                          </>
                        )}
                      </span>
                    </td>
                    <td className="amount">{parseFloat(order.total_amount || 0).toFixed(2)} €</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;