// ===== src/pages/client/OrderTracking.jsx ===== (VERSION CORRIGÉE avec Lucide React)
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  ChefHat, 
  Package,
  XCircle,
  User,
  Phone,
  MapPin,
  FileText
} from 'lucide-react';
import api from '../../services/api';
import websocket from '../../services/websocket';

const OrderTracking = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
    
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
      pending: { 
        label: 'En attente', 
        color: '#ffc107', 
        bgColor: '#fff8e1',
        step: 1,
        Icon: Clock
      },
      confirmed: { 
        label: 'Confirmée', 
        color: '#17a2b8', 
        bgColor: '#d1ecf1',
        step: 2,
        Icon: CheckCircle
      },
      preparing: { 
        label: 'En préparation', 
        color: '#007bff', 
        bgColor: '#cce5ff',
        step: 3,
        Icon: ChefHat
      },
      delivering: { 
        label: 'En livraison', 
        color: '#fd7e14', 
        bgColor: '#ffe5d0',
        step: 4,
        Icon: Truck
      },
      completed: { 
        label: 'Livrée', 
        color: '#28a745', 
        bgColor: '#d4edda',
        step: 5,
        Icon: Package
      },
      cancelled: { 
        label: 'Annulée', 
        color: '#dc3545', 
        bgColor: '#f8d7da',
        step: 0,
        Icon: XCircle
      }
    };
    return statuses[status] || statuses.pending;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <XCircle size={48} style={{ color: '#dc3545', marginBottom: '1rem' }} />
          <p>Erreur: {error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <div className="error">
          <Package size={48} style={{ color: '#666', marginBottom: '1rem' }} />
          <p>Commande non trouvée</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.Icon;

  return (
    <div className="container" style={styles.container}>
      <h1 style={styles.title}>
        <Package size={28} style={{ marginRight: '10px' }} />
        Suivi de commande #{order.id}
      </h1>

      <div style={styles.content}>
        {/* Section Tracking */}
        <div style={styles.tracking}>
          {/* Badge statut actuel */}
          <div style={{ 
            ...styles.statusBadge, 
            background: statusInfo.color 
          }}>
            <StatusIcon size={20} style={{ marginRight: '8px' }} />
            {statusInfo.label}
          </div>

          {/* Timeline */}
          <div style={styles.timeline}>
            {['pending', 'confirmed', 'preparing', 'delivering', 'completed'].map((step) => {
              const stepInfo = getStatusInfo(step);
              const isActive = stepInfo.step <= statusInfo.step && order.status !== 'cancelled';
              const isCurrent = step === order.status;
              const StepIcon = stepInfo.Icon;
              
              return (
                <div key={step} style={styles.timelineItem}>
                  <div style={{
                    ...styles.timelineDot,
                    background: isActive ? stepInfo.color : '#e0e0e0',
                    transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: isCurrent ? `0 0 0 4px ${stepInfo.bgColor}` : 'none'
                  }}>
                    <StepIcon size={16} color={isActive ? 'white' : '#999'} />
                  </div>
                  <div style={{
                    ...styles.timelineLabel,
                    fontWeight: isCurrent ? 'bold' : 'normal',
                    color: isActive ? stepInfo.color : '#999'
                  }}>
                    {stepInfo.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Infos de livraison */}
          <div style={styles.info}>
            <h2 style={styles.infoTitle}>
              <User size={20} style={{ marginRight: '8px' }} />
              Informations de livraison
            </h2>
            <div style={styles.infoItem}>
              <User size={16} style={{ marginRight: '8px', color: '#666' }} />
              <span><strong>Nom:</strong> {order.customer_name}</span>
            </div>
            <div style={styles.infoItem}>
              <Phone size={16} style={{ marginRight: '8px', color: '#666' }} />
              <span><strong>Téléphone:</strong> {order.customer_phone}</span>
            </div>
            {order.delivery_address && (
              <div style={styles.infoItem}>
                <MapPin size={16} style={{ marginRight: '8px', color: '#666' }} />
                <span><strong>Adresse:</strong> {order.delivery_address}</span>
              </div>
            )}
            {order.notes && (
              <div style={styles.infoItem}>
                <FileText size={16} style={{ marginRight: '8px', color: '#666' }} />
                <span><strong>Notes:</strong> {order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Résumé */}
        <div style={styles.summary}>
          <h2 style={styles.summaryTitle}>Détails de la commande</h2>
          
          {items.map(item => {
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity);
            
            return (
              <div key={item.id} style={styles.item}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {price.toFixed(2)} € × {quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: '#2c5530' }}>
                  {(price * quantity).toFixed(2)} €
                </div>
              </div>
            );
          })}

          <hr style={styles.divider} />
          
          {order.delivery_fee > 0 && (
            <div style={styles.deliveryFee}>
              <span>Frais de livraison</span>
              <span>{parseFloat(order.delivery_fee).toFixed(2)} €</span>
            </div>
          )}
          
          <div style={styles.total}>
            <span>Total</span>
            <span>{parseFloat(order.total_amount).toFixed(2)} €</span>
          </div>

          <div style={styles.date}>
            <Clock size={14} style={{ marginRight: '6px' }} />
            Commande le {new Date(order.created_at).toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px',
    color: '#2c5530'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  tracking: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 24px',
    color: 'white',
    borderRadius: '25px',
    fontWeight: 'bold',
    width: 'fit-content',
    fontSize: '16px'
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingLeft: '20px'
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  timelineDot: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease'
  },
  timelineLabel: {
    fontSize: '16px',
    transition: 'color 0.3s ease'
  },
  info: {
    background: '#f9f9f9',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #eee'
  },
  infoTitle: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c5530',
    fontSize: '18px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '12px',
    fontSize: '15px'
  },
  summary: {
    border: '1px solid #ddd',
    borderRadius: '12px',
    padding: '24px',
    height: 'fit-content',
    position: 'sticky',
    top: '20px',
    background: 'white'
  },
  summaryTitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#2c5530',
    fontSize: '18px'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f0f0f0'
  },
  divider: {
    border: 'none',
    borderTop: '2px solid #eee',
    margin: '16px 0'
  },
  deliveryFee: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    color: '#666',
    fontSize: '15px'
  },
  total: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '20px',
    fontWeight: 'bold',
    marginTop: '16px',
    color: '#2c5530'
  },
  date: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '24px',
    fontSize: '13px',
    color: '#888'
  }
};

export default OrderTracking;