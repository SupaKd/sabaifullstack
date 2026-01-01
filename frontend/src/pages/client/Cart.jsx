// ===== src/pages/client/Cart.jsx ===== (VERSION avec Lucide React)
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import {
  Trash2,
  ShoppingCart,
  ArrowLeft,
  Lock,
  Truck,
  ShoppingBag,
  Package,
  AlertTriangle,
} from "lucide-react";
import { notifyCartCleared, notifyStockIssue } from "../../utils/notify";
import CartItem from "../../components/CartItem";
import { useEffect, useState } from "react";
import DeliveryClosedModal from "../../components/DeliveryClosedModal";
import api from '../../services/api';

const Cart = () => {
  const { items, getTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const validItems = items.filter((item) => item.product && item.product.id);

  const [serviceOpen, setServiceOpen] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState(5);
  const [deliveryMinAmount, setDeliveryMinAmount] = useState(30);

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const data = await api.getServiceStatus();
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
    const loadDeliverySettings = async () => {
      try {
        const data = await api.getServiceSettings();
        if (data.success) {
          setDeliveryFee(Number(data.data.delivery_fee) || 5);
          setDeliveryMinAmount(Number(data.data.delivery_min_amount) || 30);
        }
      } catch (err) {
        console.error("Erreur chargement paramètres livraison:", err);
      }
    };
    loadDeliverySettings();
  }, []);

  const handleClearCart = () => {
    clearCart();
    notifyCartCleared();
  };

  const handleCheckout = () => {
    if (!serviceOpen) {
      setShowModal(true);
      return;
    }

    const stockIssues = validItems.filter((item) => {
      const stock = Number(item.product.stock_quantity || item.product.stock || 0);
      return item.quantity > stock;
    });

    if (stockIssues.length > 0) {
      notifyStockIssue();
      return;
    }

    navigate("/checkout");
  };

  const itemCount = validItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const hasStockIssues = validItems.some((item) => {
    const stock = Number(item.product.stock_quantity || item.product.stock || 0);
    return item.quantity > stock;
  });

  const cartTotal = getTotal();

  // Panier vide
  if (validItems.length === 0) {
    return (
      <div className="container__cart">
        <div className="cart-empty">
          <div className="cart-empty__icon">
            <ShoppingCart size={64} />
          </div>
          <h2 className="cart-empty__title">Votre panier est vide</h2>
          <p className="cart-empty__text">
            Ajoutez des produits pour commencer votre commande
          </p>
          <button onClick={() => navigate("/")} className="cart__btntwo">
            <ShoppingCart size={18} style={{ marginRight: "0.5rem" }} />
            Découvrir le menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container__cart">
      <div className="cart">
        {/* En-tête */}
        <div className="cart__header">
          <div className="cart__header-left">
            <button onClick={() => navigate("/")} className="cart__return">
              <ArrowLeft size={18} />
              <span>Continuer mes achats</span>
            </button>
          </div>

          <div className="cart__header-center">
            <h1 className="cart__title">
              Mon panier{" "}
              <span className="cart__count">
                ({itemCount} article{itemCount > 1 ? "s" : ""})
              </span>
            </h1>
          </div>
        </div>

        {/* Contenu */}
        <div className="cart__content">
          <div className="cart__items">
            {validItems.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
            <button onClick={handleClearCart} className="cart__trash">
              <Trash2 size={18} />
              Vider le panier
            </button>
          </div>

          {/* Résumé */}
          <div className="cart__summary">
            <div className="cart-summary">
              <h2 className="cart-summary__title">Résumé de la commande</h2>

              <div className="cart-summary__content">
                <div className="cart-summary__line">
                  <span>Sous-total ({itemCount} articles)</span>
                  <span>{cartTotal.toFixed(2)} €</span>
                </div>

                <div className="cart-summary__divider" />

                <div className="cart-summary__total">
                  <span>Total</span>
                  <span className="cart-summary__total-amount">
                    {cartTotal.toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Règles livraison */}
              <div className="cart-summary__rules">
                <p className="cart-summary__rules-title">
                  <Package size={18} />
                  Modes de retrait :
                </p>

                <ul className="cart-summary__rules-list">
                  <li>
                    <Truck size={16} style={{ marginRight: 6 }} />
                    <strong>Livraison :</strong> {deliveryFee.toFixed(2)}€
                    {cartTotal < deliveryMinAmount && (
                      <span className="cart-summary__rules-warning">
                        (minimum {deliveryMinAmount.toFixed(2)}€)
                      </span>
                    )}
                  </li>

                  <li>
                    <ShoppingBag size={16} style={{ marginRight: 6 }} />
                    <strong>À emporter :</strong> Gratuit, sans minimum
                  </li>
                </ul>
              </div>

              {/* Alerte minimum */}
              {cartTotal < deliveryMinAmount && (
                <div className="cart-summary__min-alert">
                  <AlertTriangle size={18} />
                  <span>
                    Ajoutez{" "}
                    {(deliveryMinAmount - cartTotal).toFixed(2)}€ pour atteindre
                    le minimum de livraison
                  </span>
                </div>
              )}

              {/* Bouton */}
              <button
                onClick={handleCheckout}
                className="cart__btn"
                disabled={hasStockIssues || !serviceOpen}
              >
                {!serviceOpen
                  ? "Service fermé pour le moment"
                  : hasStockIssues
                  ? "Vérifiez votre panier"
                  : "Terminer la commande"}
              </button>

              <div className="cart-summary__info">
                <p>
                  <Lock size={14} /> Paiement sécurisé via Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeliveryClosedModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default Cart;