// ===== src/pages/admin/AdminDashboard.jsx ===== (AMÉLIORATIONS)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import ws from "../../services/websocket";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBowlFood,
  faBoxOpen,
  faSignOutAlt,
  faCheck,
  faTimes,
  faTruck,
  faShoppingBag,
  faMapMarkerAlt,
  faUser,
  faPhone,
  faCommentDots,
  faClock,
  faUtensils,
  faMotorcycle,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [serviceEnabled, setServiceEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();

    ws.connect("admin");
    ws.on("new_order", () => {
      playSound();
      loadData();
    });

    return () => {
      try {
        ws.disconnect();
      } catch (e) {}
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // ✅ Utiliser api.js au lieu de fetch direct
      const [ordersData, settingsData] = await Promise.all([
        api.getAdminOrders(null),
        api.getServiceHours(), 
      ]);

      // ✅ Gérer la réponse correctement
      if (ordersData.success !== undefined) {
        setOrders(ordersData.data || ordersData);
      } else {
        setOrders(ordersData);
      }

      // ✅ Charger les settings via API
      const settings = await api.getServiceSettings();

      if (settings.success) {
        setServiceEnabled(settings.data.service_enabled === "true");
        setDeliveryEnabled(settings.data.delivery_enabled === "true");
      }
    } catch (err) {
      console.error("Erreur chargement données:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Utiliser api.js pour les toggles
  const toggleService = async () => {
    try {
      const newValue = !serviceEnabled;
      await api.updateSetting("service_enabled", newValue ? "true" : "false");
      setServiceEnabled(newValue);
    } catch (err) {
      console.error("Erreur toggle service:", err);
      alert("Erreur lors de la mise à jour du service");
    }
  };

  const toggleDelivery = async () => {
    try {
      const newValue = !deliveryEnabled;
      await api.updateDeliveryEnabled(newValue);
      setDeliveryEnabled(newValue);
    } catch (err) {
      console.error("Erreur toggle delivery:", err);
      alert("Erreur lors de la mise à jour de la livraison");
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.updateOrderStatus(orderId, status);
      playSound();
      loadData();
    } catch (err) {
      console.error("Erreur mise à jour statut:", err);
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (err) {
      console.log("Audio non disponible");
    }
  };

  const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status)
  ).length;

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="header">
        <img src="/images/logosabai.png" alt="logo" className="logodash"/>

        <div className="header-nav">
          <a href="/admin/products">
            <FontAwesomeIcon icon={faBowlFood} /> Produits
          </a>

          <a href="/admin/horaires">
            <FontAwesomeIcon icon={faClock} /> Horaires
          </a>
        </div>

        <div className="header-right">

          <button
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
            className="btn-logout"
          >
            <FontAwesomeIcon icon={faSignOutAlt} /> Déconnexion
          </button>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="controls">
        {/* Service */}
        <div className="control-card">
          <div className="control-info">
            <h3>Service</h3>

            <div
              className={`control-status ${
                serviceEnabled ? "control-status--on" : "control-status--off"
              }`}
            >
              {serviceEnabled ? (
                <>
                  <FontAwesomeIcon icon={faCheck} /> Ouvert
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTimes} /> Fermé
                </>
              )}
            </div>
          </div>

          <div
            className={`toggle ${serviceEnabled ? "active" : ""}`}
            onClick={toggleService}
          ></div>
        </div>

        {/* Livraison */}
        <div className="control-card">
          <div className="control-info">
            <h3>Livraison</h3>

            <div
              className={`control-status ${
                deliveryEnabled ? "control-status--on" : "control-status--off"
              }`}
            >
              {deliveryEnabled ? (
                <>
                  <FontAwesomeIcon icon={faCheck} /> Activée
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTimes} /> Désactivée
                </>
              )}
            </div>
          </div>

          <div
            className={`toggle ${deliveryEnabled ? "active" : ""}`}
            onClick={toggleDelivery}
            style={{
              opacity: serviceEnabled ? 1 : 0.5,
              cursor: serviceEnabled ? "pointer" : "not-allowed",
            }}
          ></div>
        </div>

        {/* En cours */}
        <div className="control-card control-card--count">
          <div className="control-info">
            <h3>En cours</h3>
            <div className="control-status">{activeOrders}</div>
          </div>
        </div>
      </div>

      {/* COMMANDES */}
      <div className="orders-section">
        <div className="orders-header">
          <h2>
            <FontAwesomeIcon icon={faBoxOpen} /> Commandes récentes (
            {orders.length})
          </h2>
        </div>

        <div className="orders">
          {sortedOrders.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">
                <FontAwesomeIcon icon={faBoxOpen} />
              </div>
              <p>Aucune commande</p>
            </div>
          ) : (
            sortedOrders.slice(0, 10).map(
              (
                order // ← Limiter à 10 pour dashboard
              ) => (
                <div key={order.id} className={`order order--${order.status}`}>
                  {/* HEADER commande */}
                  <div className="order-header">
                    <div className="order-main">
                      <span className="order-id">
                        <FontAwesomeIcon icon={faChevronRight} /> #{order.id}
                      </span>

                      <span
                        className={`order-type ${
                          order.order_type === "takeaway"
                            ? "order-type--takeaway"
                            : "order-type--delivery"
                        }`}
                      >
                        {order.order_type === "takeaway" ? (
                          <>
                            <FontAwesomeIcon icon={faShoppingBag} /> À emporter
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faTruck} /> Livraison
                          </>
                        )}
                      </span>
                    </div>

                    {order.delivery_time && (
                      <div className="order-time">
                        <FontAwesomeIcon icon={faClock} />{" "}
                        {order.delivery_time.slice(0, 5)}
                      </div>
                    )}
                  </div>

                  {/* BODY commande */}
                  <div className="order-body">
                    <div className="order-client">
                      <div className="client-name">
                        <FontAwesomeIcon icon={faUser} /> {order.customer_name}
                      </div>

                      <div className="client-phone">
                        <FontAwesomeIcon icon={faPhone} />{" "}
                        {order.customer_phone}
                      </div>

                      {order.order_type === "delivery" &&
                        order.delivery_address && (
                          <div className="client-address">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />{" "}
                            {order.delivery_address}
                          </div>
                        )}
                    </div>

                    {order.notes && (
                      <div className="order-notes">
                        <strong>
                          <FontAwesomeIcon icon={faCommentDots} /> Note :
                        </strong>{" "}
                        {order.notes}
                      </div>
                    )}

                    <div className="order-items">{order.items}</div>
                  </div>

                  {/* FOOTER commande */}
                  <div className="order-footer">
                    <div className="order-total">
                      {parseFloat(order.total_amount).toFixed(2)} €
                    </div>

                    <div className="order-actions">
                      {order.status === "pending" && (
                        <button
                          onClick={() => updateStatus(order.id, "confirmed")}
                          className="order-btn"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Accepter
                        </button>
                      )}

                      {order.status === "confirmed" && (
                        <button
                          onClick={() => updateStatus(order.id, "preparing")}
                          className="order-btn"
                        >
                          <FontAwesomeIcon icon={faUtensils} /> Préparer
                        </button>
                      )}

                      {order.status === "preparing" &&
                        order.order_type === "delivery" && (
                          <button
                            onClick={() => updateStatus(order.id, "delivering")}
                            className="order-btn"
                          >
                            <FontAwesomeIcon icon={faMotorcycle} /> Livrer
                          </button>
                        )}

                      {(order.status === "delivering" ||
                        (order.status === "preparing" &&
                          order.order_type === "takeaway")) && (
                        <button
                          onClick={() => updateStatus(order.id, "completed")}
                          className="order-btn"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Terminée
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
