// ===== src/pages/client/OrderTracking.jsx ===== (CORRIGÉ)
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import websocket from '../../services/websocket'; // ✅ Nom cohérent avec le reste du projet

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
    
    // Connexion WebSocket pour suivi temps réel
    websocket.connect('order', parseInt(orderId));
    
    websocket.on('order_status_updated', (data) => {
      if (data.order_id === parseInt(orderId)) {
        setOrder(prev => ({ ...prev, status: data.status }));
      }
    });

    return () => {
      websocket.disconnect();
    };
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data.order);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statuses = {
      pending: { label: 'En attente', color: '#ffc107', step: 1 },
      confirmed: { label: 'Confirmée', color: '#17a2b8', step: 2 },
      preparing: { label: 'En préparation', color: '#007bff', step: 3 },
      delivering: { label: 'En livraison', color: '#fd7e14', step: 4 },
      completed: { label: 'Livrée', color: '#28a745', step: 5 },
      cancelled: { label: 'Annulée', color: '#dc3545', step: 0 }
    };
    return statuses[status] || statuses.pending;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Erreur: {error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <div>Commande non trouvée</div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="container">
      <h1>Suivi de commande #{order.id}</h1>

      <div style={styles.content}>
        <div style={styles.tracking}>
          <div style={{ ...styles.statusBadge, background: statusInfo.color }}>
            {statusInfo.label}
          </div>

          <div style={styles.timeline}>
            {['pending', 'confirmed', 'preparing', 'delivering', 'completed'].map((step) => {
              const stepInfo = getStatusInfo(step);
              const isActive = stepInfo.step <= statusInfo.step;
              
              return (
                <div key={step} style={styles.timelineItem}>
                  <div style={{
                    ...styles.timelineDot,
                    background: isActive ? stepInfo.color : '#ddd'
                  }} />
                  <div style={styles.timelineLabel}>
                    {stepInfo.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.info}>
            <h2>Informations de livraison</h2>
            <p><strong>Nom:</strong> {order.customer_name}</p>
            <p><strong>Téléphone:</strong> {order.customer_phone}</p>
            <p><strong>Adresse:</strong> {order.delivery_address}</p>
            {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
          </div>
        </div>

        <div style={styles.summary}>
          <h2>Détails de la commande</h2>
          
          {items.map(item => {
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity);
            
            return (
              <div key={item.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {price.toFixed(2)} € x {quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  {(price * quantity).toFixed(2)} €
                </div>
              </div>
            );
          })}

          <hr />
          <div style={styles.total}>
            <span>Total</span>
            <span>{parseFloat(order.total_amount).toFixed(2)} €</span>
          </div>

          <div style={styles.date}>
            Commandé le {new Date(order.created_at).toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  content: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px',
    marginTop: '30px'
  },
  tracking: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '10px 20px',
    color: 'white',
    borderRadius: '20px',
    fontWeight: 'bold',
    width: 'fit-content'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    paddingLeft: '20px'
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  timelineDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    flexShrink: 0
  },
  timelineLabel: {
    fontSize: '16px'
  },
  info: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px'
  },
  summary: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    height: 'fit-content',
    position: 'sticky',
    top: '20px'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px'
  },
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '15px'
  },
  date: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#666',
    textAlign: 'center'
  }
};

export default OrderTracking;