// ===== src/pages/client/Checkout.jsx ===== (VERSION STRIPE)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faClock,
  faEnvelope,
  faPhone,
  faUser,
  faHome,
  faMailBulk,
  faTruck,
  faShoppingBag,
  faExclamationTriangle,
  faBan,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { notifyOrderError } from "../../utils/notify";
import DeliveryClosedModal from "../../components/DeliveryClosedModal";
import API_CONFIG from "../../services/api.config";

const PAYS_DE_GEX_CITIES = [
  { name: "Thoiry", postalCode: "01710" },
  { name: "Saint-Genis-Pouilly", postalCode: "01630" },
  { name: "Saint-Jean-de-Gonville", postalCode: "01630" },
  { name: "Péron", postalCode: "01410" },
];

const INITIAL_FORM_DATA = {
  order_type: "delivery",
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  delivery_address: "",
  postal_code: "",
  city: "",
  delivery_time: "",
  notes: "",
};

const Checkout = () => {
  const { items, getTotal } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [serviceHours, setServiceHours] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const [serviceOpen, setServiceOpen] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(5);
  const [deliveryMinAmount, setDeliveryMinAmount] = useState(30);

  const validItems = items.filter((item) => item.product && item.product.id);

  useEffect(() => {
    if (validItems.length === 0) navigate("/cart");
  }, [validItems.length, navigate]);

  useEffect(() => {
    loadServiceHours();
  }, []);

  useEffect(() => {
    if (serviceHours) generateTimeSlots();
  }, [serviceHours, formData.order_type]);

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const response = await fetch(
          API_CONFIG.url("/api/service-hours/status")
        );

        const data = await response.json();
        if (data.success) {
          setServiceOpen(data.data.open);
          if (!data.data.open) setShowModal(true);
        }
      } catch (err) {
        console.error("Erreur statut service:", err);
        setServiceOpen(false);
        setShowModal(true);
      }
    };

    checkServiceStatus();
    const interval = setInterval(checkServiceStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkDeliveryStatus = async () => {
      try {
        const response = await fetch(
          API_CONFIG.url("/api/service-hours/delivery-status")
        );

        const data = await response.json();
        if (data.success) {
          setDeliveryAvailable(data.data.delivery_available);

          if (
            !data.data.delivery_available &&
            formData.order_type === "delivery"
          ) {
            setFormData((prev) => ({ ...prev, order_type: "takeaway" }));
          }
        }
      } catch (err) {
        console.error("Erreur vérification statut livraison:", err);
      }
    };

    checkDeliveryStatus();
    const interval = setInterval(checkDeliveryStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadDeliverySettings = async () => {
      try {
        const response = await fetch(
          API_CONFIG.url("/api/service-hours/settings")
        );

        const data = await response.json();
        if (data.success) {
          setDeliveryFee(parseFloat(data.data.delivery_fee) || 5);
          setDeliveryMinAmount(parseFloat(data.data.delivery_min_amount) || 30);
        }
      } catch (err) {
        console.error("Erreur chargement paramètres livraison:", err);
      }
    };

    loadDeliverySettings();
  }, []);

  const loadServiceHours = async () => {
    try {
      const response = await fetch(API_CONFIG.url("/api/service-hours"));
      const data = await response.json();
      if (data.success) setServiceHours(data.data);
    } catch (err) {
      console.error("Erreur horaires:", err);
    }
  };

  const generateTimeSlots = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const dayHours = serviceHours.find((h) => h.day_of_week === dayOfWeek);

    if (!dayHours || !dayHours.is_active) {
      setAvailableTimeSlots([]);
      return;
    }

    const slots = [];
    const [openHour, openMinute] = dayHours.opening_time.split(":").map(Number);
    const [closeHour, closeMinute] = dayHours.closing_time
      .split(":")
      .map(Number);
    const now = new Date();

    const minDelay = formData.order_type === "takeaway" ? 15 : 20;
    const minTime = new Date(now.getTime() + minDelay * 60 * 1000);

    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const slotDateTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        currentHour,
        currentMinute
      );
      if (slotDateTime > minTime) {
        slots.push(
          `${String(currentHour).padStart(2, "0")}:${String(
            currentMinute
          ).padStart(2, "0")}`
        );
      }
      currentMinute += 15;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }

    setAvailableTimeSlots(slots);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOrderTypeChange = (type) => {
    if (type === "delivery" && !deliveryAvailable) {
      return;
    }

    setFormData({
      ...formData,
      order_type: type,
      ...(type === "takeaway"
        ? {
            delivery_address: "",
            postal_code: "",
            city: "",
          }
        : {}),
    });
  };

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    const cityData = PAYS_DE_GEX_CITIES.find(
      (city) => city.name === selectedCity
    );
    setFormData({
      ...formData,
      city: selectedCity,
      postal_code: cityData?.postalCode || "",
    });
  };

  const validateForm = () => {
    if (formData.order_type === "delivery") {
      if (!formData.city || !formData.postal_code) {
        setError("Veuillez sélectionner une ville");
        return false;
      }
      if (!formData.delivery_address) {
        setError("Veuillez saisir votre adresse de livraison");
        return false;
      }

      const cartTotal = getTotal();
      if (cartTotal < deliveryMinAmount) {
        setError(
          `Minimum de commande ${deliveryMinAmount.toFixed(
            2
          )}€ pour la livraison`
        );
        return false;
      }
    }

    if (!formData.delivery_time) {
      setError(
        `Veuillez choisir une heure ${
          formData.order_type === "delivery" ? "de livraison" : "de retrait"
        }`
      );
      return false;
    }
    return true;
  };

  const getFinalTotal = () => {
    const cartTotal = getTotal();
    if (formData.order_type === "delivery") {
      return cartTotal + deliveryFee;
    }
    return cartTotal;
  };

  // ✅ VERSION STRIPE - Nouvelle fonction handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!validateForm() || !serviceOpen) {
      setLoading(false);
      if (!serviceOpen) setShowModal(true);
      return;
    }

    try {
      // Préparer les données de commande
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const today = `${year}-${month}-${day}`;

      const orderData = {
        order_type: formData.order_type,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        delivery_date: today,
        delivery_time: formData.delivery_time,
        notes: formData.notes,
        items: validItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        total_amount: getFinalTotal(),
        delivery_fee: formData.order_type === "delivery" ? deliveryFee : 0,
      };

      if (formData.order_type === "delivery") {
        orderData.delivery_address = `${formData.delivery_address}, ${formData.postal_code} ${formData.city}`;
      }

      // ✅ Créer la session Stripe
      // ✅ Créer la session Stripe
      const response = await fetch(
        API_CONFIG.url("/api/payment/create-checkout-session"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData), 
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error || "Erreur lors de la création de la session de paiement"
        );
      }

      // ✅ Rediriger vers Stripe Checkout (nouvelle méthode)
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de paiement non reçue");
      }

      // Note: Pas besoin de clearCart() ici car la redirection se fait avant
      // Le panier sera vidé dans CheckoutSuccess après confirmation du paiement
    } catch (err) {
      console.error("Erreur commande:", err);
      setError(err.message);
      notifyOrderError(err.message);
      setLoading(false);
    }
  };

  if (validItems.length === 0) return null;

  return (
    <div className="container__checkout">
      <div className="checkout__content">
        <h1 className="checkout__title">Plus que quelques informations...</h1>

        <form onSubmit={handleSubmit} className="checkout__form">
          <div className="checkout__order-type">
            <h2 className="checkout__form-title">Type de commande</h2>
            <div className="order-type__options">
              {deliveryAvailable ? (
                <button
                  type="button"
                  className={`order-type__option ${
                    formData.order_type === "delivery" ? "active" : ""
                  }`}
                  onClick={() => handleOrderTypeChange("delivery")}
                >
                  <FontAwesomeIcon
                    icon={faTruck}
                    className="order-type__icon"
                  />
                  <div className="order-type__label">Livraison</div>
                  <div className="order-type__description">
                    À votre domicile
                  </div>
                </button>
              ) : (
                <div className="order-type__option order-type__option--disabled">
                  <FontAwesomeIcon
                    icon={faTruck}
                    className="order-type__icon"
                  />
                  <div className="order-type__label">Livraison</div>
                  <div className="order-type__description">
                    <FontAwesomeIcon
                      icon={faBan}
                      style={{ marginRight: "0.3rem" }}
                    />
                    Indisponible
                  </div>
                </div>
              )}

              <button
                type="button"
                className={`order-type__option ${
                  formData.order_type === "takeaway" ? "active" : ""
                }`}
                onClick={() => handleOrderTypeChange("takeaway")}
              >
                <FontAwesomeIcon
                  icon={faShoppingBag}
                  className="order-type__icon"
                />
                <div className="order-type__label">À emporter</div>
                <div className="order-type__description">Retrait sur place</div>
              </button>
            </div>

            {!deliveryAvailable && (
              <div className="delivery-disabled-alert">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>
                  La livraison est temporairement désactivée. Seul le retrait au
                  restaurant est disponible.
                </span>
              </div>
            )}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form-field">
            <label className="form-field__label">
              <FontAwesomeIcon icon={faUser} /> Nom *
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              required
              className="form-field__input"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">
              <FontAwesomeIcon icon={faEnvelope} /> Email (pour suivi de
              commande) *
            </label>
            <input
              type="email"
              name="customer_email"
              value={formData.customer_email}
              onChange={handleChange}
              required
              className="form-field__input"
            />
          </div>

          <div className="form-field">
            <label className="form-field__label">
              <FontAwesomeIcon icon={faPhone} /> Téléphone *
            </label>
            <input
              type="tel"
              name="customer_phone"
              value={formData.customer_phone}
              onChange={handleChange}
              required
              className="form-field__input"
            />
          </div>

          {formData.order_type === "delivery" && (
            <>
              <div className="form-field">
                <label className="form-field__label">
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> Ville *
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleCityChange}
                  required
                  className="form-field__select"
                >
                  <option value="">-- Sélectionnez --</option>
                  {PAYS_DE_GEX_CITIES.map((city) => (
                    <option key={city.name} value={city.name}>
                      {city.name} ({city.postalCode})
                    </option>
                  ))}
                </select>
              </div>

              {formData.city && (
                <div className="checkout__selected-city">
                  <small>
                    <FontAwesomeIcon icon={faMailBulk} /> Code postal :{" "}
                    {formData.postal_code}
                  </small>
                </div>
              )}

              <div className="form-field">
                <label className="form-field__label">
                  <FontAwesomeIcon icon={faHome} /> Adresse *
                </label>
                <input
                  type="text"
                  name="delivery_address"
                  value={formData.delivery_address}
                  onChange={handleChange}
                  required
                  className="form-field__input"
                />
              </div>
            </>
          )}

          <div className="checkout__delivery-schedule">
            <div className="form-field">
              <label className="form-field__label">
                <FontAwesomeIcon icon={faClock} />
                {formData.order_type === "delivery"
                  ? " Heure de livraison *"
                  : " Heure de retrait *"}
              </label>
              <select
                name="delivery_time"
                value={formData.delivery_time}
                onChange={handleChange}
                className="form-field__select"
                required
                disabled={!serviceOpen || availableTimeSlots.length === 0}
              >
                <option value="">-- Choisissez un créneau horaire --</option>
                {availableTimeSlots.length === 0 ? (
                  <option disabled>Aucun créneau disponible aujourd'hui</option>
                ) : (
                  availableTimeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label className="form-field__label">
              {formData.order_type === "delivery"
                ? "Instructions de livraison (optionnel)"
                : "Remarques (optionnel)"}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="form-field__textarea"
              placeholder={
                formData.order_type === "delivery"
                  ? "Ex: Code portail, étage, consignes spéciales..."
                  : "Ex: Demandes spéciales, allergies..."
              }
            />
          </div>

          <div className="checkout__summary">
            <div className="summary-line">
              <span>Sous-total</span>
              <span>{getTotal().toFixed(2)} €</span>
            </div>

            {formData.order_type === "delivery" && (
              <div className="summary-line">
                <span>Frais de livraison</span>
                <span>{deliveryFee.toFixed(2)} €</span>
              </div>
            )}

            <div className="summary-line summary-line--total">
              <span>Total</span>
              <span>{getFinalTotal().toFixed(2)} €</span>
            </div>

            {formData.order_type === "delivery" &&
              getTotal() < deliveryMinAmount && (
                <div className="checkout__min-warning">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>
                    Minimum {deliveryMinAmount.toFixed(2)}€ pour la livraison
                    (encore {(deliveryMinAmount - getTotal()).toFixed(2)}€)
                  </span>
                </div>
              )}
          </div>

          <button
            type="submit"
            className="checkout__submit"
            disabled={
              loading ||
              availableTimeSlots.length === 0 ||
              !serviceOpen ||
              (formData.order_type === "delivery" &&
                getTotal() < deliveryMinAmount)
            }
          >
            {loading
              ? "Redirection vers le paiement..."
              : !serviceOpen
              ? "Service fermé"
              : availableTimeSlots.length === 0
              ? "Aucun créneau disponible"
              : formData.order_type === "delivery" &&
                getTotal() < deliveryMinAmount
              ? `Minimum ${deliveryMinAmount.toFixed(
                  2
                )}€ requis pour la livraison`
              : `Payer - ${getFinalTotal().toFixed(2)} €`}
          </button>
        </form>
        <div className="checkout__stripe">
          <p>
            <FontAwesomeIcon icon={faLock} /> Paiement sécurisé via Stripe
          </p>
        </div>
      </div>

      <DeliveryClosedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};

export default Checkout;
