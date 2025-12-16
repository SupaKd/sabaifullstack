// ===== src/pages/admin/Orders.jsx ===== (AVEC NOTIFICATIONS)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import useAdminNotifications from '../../hooks/useAdminNotifications'; // ✅ AJOUTÉ

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const { logout } = useAuth();

  // ✅ Déclarer la fonction AVANT le hook
  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminOrders(filter);
      
      if (data.success !== undefined) {
        setOrders(data.data || []);
      } else {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      setOrders([]);
      alert('Erreur lors du chargement des commandes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Hook de notifications APRÈS la déclaration de la fonction
  const { isConnected } = useAdminNotifications(loadOrders);

  useEffect(() => {
    loadOrders();
  }, [filter, dateFilter]);

  const loadOrders_OLD = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminOrders(filter);
      
      if (data.success !== undefined) {
        setOrders(data.data || []);
      } else {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      setOrders([]);
      alert('Erreur lors du chargement des commandes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadOrders();
      alert('Statut mis à jour !');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const getStatusClass = (status) => {
    return `order-card__status order-card__status--${status}`;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      delivering: 'En livraison',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  };

  const getFilteredOrdersByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return orders.filter(order => {
      if (!order.delivery_date) return dateFilter === 'all';
      
      const deliveryDate = new Date(order.delivery_date);
      deliveryDate.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case 'today':
          return deliveryDate.getTime() === today.getTime();
        case 'tomorrow':
          return deliveryDate.getTime() === tomorrow.getTime();
        case 'upcoming':
          return deliveryDate > today;
        default:
          return true;
      }
    });
  };

  const groupOrdersByDeliveryDate = (ordersToGroup) => {
    const grouped = {};
    
    ordersToGroup.forEach(order => {
      const dateKey = order.delivery_date || 'no-date';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(order);
    });

    Object.keys(grouped).forEach(dateKey => {
      grouped[dateKey].sort((a, b) => {
        if (!a.delivery_time) return 1;
        if (!b.delivery_time) return -1;
        return a.delivery_time.localeCompare(b.delivery_time);
      });
    });

    return grouped;
  };

  const formatDeliveryDate = (dateString) => {
    if (!dateString) return 'Date non définie';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const orderDate = new Date(date);
    orderDate.setHours(0, 0, 0, 0);

    if (orderDate.getTime() === today.getTime()) {
      return "Aujourd'hui";
    } else if (orderDate.getTime() === tomorrow.getTime()) {
      return "Demain";
    }

    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDeliveryTime = (timeString) => {
    if (!timeString) return null;
    return timeString.slice(0, 5);
  };

  const filteredOrders = getFilteredOrdersByDate();
  const groupedOrders = groupOrdersByDeliveryDate(filteredOrders);
  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    if (a === 'no-date') return 1;
    if (b === 'no-date') return -1;
    return a.localeCompare(b);
  });

  const countOrdersByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const counts = {
      today: 0,
      tomorrow: 0,
      upcoming: 0
    };

    orders.forEach(order => {
      if (!order.delivery_date) return;
      
      const deliveryDate = new Date(order.delivery_date);
      deliveryDate.setHours(0, 0, 0, 0);

      if (deliveryDate.getTime() === today.getTime()) {
        counts.today++;
      } else if (deliveryDate.getTime() === tomorrow.getTime()) {
        counts.tomorrow++;
      } else if (deliveryDate > today) {
        counts.upcoming++;
      }
    });

    return counts;
  };

  const dateCounts = countOrdersByDate();
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="admin-orders">
      {/* Header avec retour et indicateur de connexion */}
      <div className="admin-orders__header">
        <div className="admin-orders__header-left">
          <Link to="/admin" className="btn-back">
            ← Retour
          </Link>
          <h1 className="admin-orders__title">Gestion des commandes</h1>
          
          {/* ✅ AJOUTÉ : Indicateur de connexion */}
          {isConnected && (
            <span className="connection-badge connection-badge--active">
              🔔 Notifications actives
            </span>
          )}
        </div>
        <div className="admin-orders__summary">
          <span className="summary-badge">{orders.length} commande(s) au total</span>
        </div>
      </div>

      {/* Zone de filtres */}
      <div className="filters-container">
        <div className="filter-group">
          <h3 className="filter-group__title">📊 Statut</h3>
          <div className="filter-buttons">
            <button 
              onClick={() => setFilter('pending')} 
              className={`filter-btn filter-btn--status-pending ${filter === 'pending' ? 'filter-btn--active' : ''}`}
            >
              En attente
              {statusCounts.pending > 0 && <span className="filter-btn__count">{statusCounts.pending}</span>}
            </button>
            <button 
              onClick={() => setFilter('confirmed')} 
              className={`filter-btn filter-btn--status-confirmed ${filter === 'confirmed' ? 'filter-btn--active' : ''}`}
            >
              Confirmées
              {statusCounts.confirmed > 0 && <span className="filter-btn__count">{statusCounts.confirmed}</span>}
            </button>
            <button 
              onClick={() => setFilter('preparing')} 
              className={`filter-btn filter-btn--status-preparing ${filter === 'preparing' ? 'filter-btn--active' : ''}`}
            >
              En préparation
              {statusCounts.preparing > 0 && <span className="filter-btn__count">{statusCounts.preparing}</span>}
            </button>
            <button 
              onClick={() => setFilter('delivering')} 
              className={`filter-btn filter-btn--status-delivering ${filter === 'delivering' ? 'filter-btn--active' : ''}`}
            >
              En livraison
              {statusCounts.delivering > 0 && <span className="filter-btn__count">{statusCounts.delivering}</span>}
            </button>
            <button 
              onClick={() => setFilter(null)} 
              className={`filter-btn filter-btn--secondary ${filter === null ? 'filter-btn--active' : ''}`}
            >
              Tous les statuts
            </button>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="admin-orders__list">
          {sortedDates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📦</div>
              <h3 className="empty-state__title">Aucune commande trouvée</h3>
              <p className="empty-state__text">Aucune commande ne correspond aux filtres sélectionnés</p>
            </div>
          ) : (
            sortedDates.map(dateKey => (
              <div key={dateKey} className="orders-by-date">
                <div className="date-header">
                  <div className="date-header__left">
                    <h2 className="date-header__title">
                      {formatDeliveryDate(dateKey !== 'no-date' ? dateKey : null)}
                    </h2>
                    <span className="date-header__count">
                      {groupedOrders[dateKey].length} commande{groupedOrders[dateKey].length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="orders-list">
                  {groupedOrders[dateKey].map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-card__header">
                        <div className="order-card__primary-info">
                          <h3 className="order-card__id">#{order.id}</h3>
                          {order.delivery_time && (
                            <div className="order-card__delivery-time">
                              🕐 {formatDeliveryTime(order.delivery_time)}
                            </div>
                          )}
                          <div className={getStatusClass(order.status)}>
                            {getStatusLabel(order.status)}
                          </div>
                        </div>
                        <div className="order-card__total-amount">
                          {parseFloat(order.total_amount).toFixed(2)} €
                        </div>
                      </div>

                      <div className="order-card__body">
                        <div className="order-card__customer">
                          <div className="customer-info">
                            <span className="customer-info__name">👤 {order.customer_name}</span>
                            <span className="customer-info__phone">📱 {order.customer_phone}</span>
                          </div>
                          <div className="customer-info__address">
                            📍 {order.delivery_address}
                          </div>
                          {order.notes && (
                            <div className="order-card__notes">💬 {order.notes}</div>
                          )}
                        </div>
                        <div className="order-card__items">{order.items}</div>
                      </div>

                      <div className="order-card__actions">
                        <label className="order-card__actions-label">Modifier le statut :</label>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="order-card__status-select"
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="preparing">En préparation</option>
                          <option value="delivering">En livraison</option>
                          <option value="completed">Terminée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                      </div>
                      
                      <div className="order-card__footer">
                        <span className="order-card__created-at">
                          Créée le {new Date(order.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;