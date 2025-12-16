// ===== src/pages/admin/Orders.jsx ===== (VERSION SIMPLIFIÉE TABLETTE)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faUser,
  faPhone,
  faMapMarkerAlt,
  faCommentDots,
  faTruck,
  faUtensils,
  faCheck,
  faHourglass,
  faBan,
  faBell,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import useAdminNotifications from "../../hooks/useAdminNotifications";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Charger toutes les commandes
      const data = await api.getAdminOrders();

      if (data.success !== undefined) {
        setOrders(data.data || []);
      } else {
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erreur chargement commandes:", err);
      setOrders([]);
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  const { isConnected } = useAdminNotifications(loadOrders);

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);

      toast.success("✓ Statut mis à jour", {
        duration: 2000,
        style: {
          fontSize: "18px",
          padding: "16px 24px",
        },
      });

      loadOrders();
    } catch (err) {
      toast.error("Erreur de mise à jour");
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        label: "Nouvelle commande",
        color: "#ffc107",
        bgColor: "#fff8e1",
        icon: faHourglass,
        priority: 1,
      },
      confirmed: {
        label: "Confirmée",
        color: "#17a2b8",
        bgColor: "#d1ecf1",
        icon: faCheck,
        priority: 2,
      },
      preparing: {
        label: "En préparation",
        color: "#28a745",
        bgColor: "#d4edda",
        icon: faUtensils,
        priority: 3,
      },
      delivering: {
        label: "En livraison",
        color: "#6f42c1",
        bgColor: "#e7d4f5",
        icon: faTruck,
        priority: 4,
      },
      completed: {
        label: "Terminée",
        color: "#6c757d",
        bgColor: "#e9ecef",
        icon: faCheck,
        priority: 5,
      },
      cancelled: {
        label: "Annulée",
        color: "#dc3545",
        bgColor: "#f8d7da",
        icon: faBan,
        priority: 6,
      },
    };
    return configs[status] || configs.pending;
  };

  const getNextStatuses = (currentStatus, orderType) => {
    // Workflow pour livraison
    const deliveryFlows = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["delivering", "cancelled"],
      delivering: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    // Workflow pour à emporter (pas de livraison)
    const takeawayFlows = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    const flows = orderType === "delivery" ? deliveryFlows : takeawayFlows;
    return flows[currentStatus] || [];
  };

  const formatDeliveryTime = (timeString) => {
    if (!timeString) return null;
    return timeString.slice(0, 5);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Compter les nouvelles commandes (pending)
  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  // Trier par statut (nouvelles en premier) puis par date
  const sortedOrders = [...orders].sort((a, b) => {
    // Priorité 1: Nouvelles commandes en premier
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;

    // Priorité 2: Par date (plus récentes en premier)
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="admin-orders-tablet">
      {/* Header simplifié */}
      <div className="orders-header-tablet">
        <Link to="/admin" className="back-btn-tablet">
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>

        <h1>Commandes</h1>

        <div className="header-badges">
         

          {/* Badge nouvelles commandes */}
          {pendingCount > 0 && (
            <span className="new-orders-badge">
              <FontAwesomeIcon icon={faExclamationCircle} />
              <span>
                {pendingCount} nouvelle{pendingCount > 1 ? "s" : ""}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Liste des commandes */}
      {loading ? (
        <div className="loading-tablet">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state-tablet">
          <FontAwesomeIcon icon={faUtensils} />
          <p>Aucune commande</p>
        </div>
      ) : (
        <div className="orders-list-tablet">
          {sortedOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const nextStatuses = getNextStatuses(
              order.status,
              order.order_type
            );
            const isNew = order.status === "pending";

            return (
              <div
                key={order.id}
                className={`order-card-tablet ${isNew ? "is-new" : ""}`}
                style={{
                  borderLeft: `6px solid ${statusConfig.color}`,
                  background: statusConfig.bgColor,
                }}
              >
                {/* Badge "NOUVELLE" pour les commandes non traitées */}
                {isNew && (
                  <div className="new-order-indicator">
                    <FontAwesomeIcon icon={faExclamationCircle} />
                    <span>NOUVELLE</span>
                  </div>
                )}

                {/* Header de la commande */}
                <div className="order-card-header-tablet">
                  <div className="order-number-tablet">#{order.id}</div>

                  {/* Badge Type de commande */}
                  <div
                    className="order-type-badge-tablet"
                    style={{
                      background:
                        order.order_type === "delivery" ? "#6f42c1" : "#17a2b8",
                      color: "white",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={
                        order.order_type === "delivery" ? faTruck : faUtensils
                      }
                    />
                    <span>
                      {order.order_type === "delivery"
                        ? "Livraison"
                        : "À emporter"}
                    </span>
                  </div>

                  <div
                    className="order-status-badge-tablet"
                    style={{
                      background: statusConfig.color,
                      color: "white",
                    }}
                  >
                    <FontAwesomeIcon icon={statusConfig.icon} />
                    <span>{statusConfig.label}</span>
                  </div>

                  <div className="order-time-tablet">
                    <FontAwesomeIcon icon={faClock} />
                    {order.delivery_time
                      ? formatDeliveryTime(order.delivery_time)
                      : formatTime(order.created_at)}
                  </div>
                </div>

                {/* Infos client */}
                <div className="order-client-tablet">
                  <div className="client-row">
                    <FontAwesomeIcon icon={faUser} />
                    <span className="client-name">{order.customer_name}</span>
                  </div>

                  <div className="client-row">
                    <FontAwesomeIcon icon={faPhone} />
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="client-phone"
                    >
                      {order.customer_phone}
                    </a>
                  </div>

                  {order.delivery_address && (
                    <div className="client-row">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      <span className="client-address">
                        {order.delivery_address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Articles */}
                <div className="order-items-tablet">
                  <div className="items-label">Articles :</div>
                  <div className="items-content">{order.items}</div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="order-notes-tablet">
                    <FontAwesomeIcon icon={faCommentDots} />
                    <span>{order.notes}</span>
                  </div>
                )}

                {/* Footer avec montant et actions */}
                <div className="order-footer-tablet">
                  <div className="order-total-tablet">
                    {parseFloat(order.total_amount).toFixed(2)} €
                  </div>

                  {/* Boutons d'action rapide */}
                  {nextStatuses.length > 0 && (
                    <div className="order-actions-tablet">
                      {nextStatuses.map((nextStatus) => {
                        const nextConfig = getStatusConfig(nextStatus);
                        return (
                          <button
                            key={nextStatus}
                            onClick={() =>
                              handleStatusChange(order.id, nextStatus)
                            }
                            className="action-btn-tablet"
                            style={{
                              background: nextConfig.color,
                              color: "white",
                            }}
                          >
                            <FontAwesomeIcon icon={nextConfig.icon} />
                            {nextConfig.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="order-timestamp-tablet">
                  Commander à {formatTime(order.created_at)} le{" "}
                  {formatDate(order.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
