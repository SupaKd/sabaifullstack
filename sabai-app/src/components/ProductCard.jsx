// ===== src/components/ProductCard.jsx =====
import { useCart } from "../context/CartContext";
import { useServiceStatus } from "../context/ServiceStatusContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faClock } from "@fortawesome/free-solid-svg-icons";
import API_CONFIG from '../services/api.config';

// Notifications
import {
  notifyAddToCart,
  notifyOutOfStock,
  notifyLowStock,
} from "../utils/notify";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
  const { addItem, items } = useCart();
  const { serviceStatus, isOpen } = useServiceStatus();

  const price = parseFloat(product.price);
  const stock = parseInt(product.stock_quantity || product.stock || 0);
  const isServiceOpen = serviceStatus?.open ?? true; // Par défaut ouvert si pas de statut

  // Calculer la quantité déjà dans le panier pour ce produit
  const getQuantityInCart = () => {
    const cartItem = items.find(item => item.product?.id === product.id);
    return cartItem ? cartItem.quantity : 0;
  };

  const quantityInCart = getQuantityInCart();
  const availableStock = stock - quantityInCart;
  const isFullyInCart = availableStock <= 0;

  const handleAddToCart = () => {
    // Vérifier si le service est ouvert
    if (!isServiceOpen) {
      toast.error("Nous sommes actuellement fermés", {
        duration: 4000,
        icon: '🕐'
      });
      return;
    }

    // Vérifier si le produit est en rupture de stock
    if (stock === 0) {
      notifyOutOfStock();
      return;
    }

    // Vérifier si tout le stock est déjà dans le panier
    if (isFullyInCart) {
      toast.error(`Vous avez déjà tout le stock disponible dans votre panier (${quantityInCart})`, {
        duration: 4000,
        icon: '📦'
      });
      return;
    }

    // Vérifier si on peut ajouter +1 au panier
    if (quantityInCart >= stock) {
      toast.error(`Stock maximum atteint (${stock} disponibles)`, {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }

    // Ajouter au panier
    addItem(product, 1);
    
    // Nouvelle quantité après ajout
    const newQuantityInCart = quantityInCart + 1;
    const remainingStock = stock - newQuantityInCart;

    // Notification d'ajout au panier
    if (remainingStock > 0) {
      notifyAddToCart(product.name);
    } else {
      // Si c'était le dernier en stock
      toast.success(`${product.name} ajouté - C'était le dernier !`, {
        duration: 3000,
        icon: '✅'
      });
    }

    // Alerte de stock faible
    if (remainingStock > 0 && remainingStock < 5) {
      toast(`Plus que ${remainingStock} disponible${remainingStock > 1 ? 's' : ''}`, {
        duration: 3000,
        icon: '⚠️',
        style: {
          background: '#fff3cd',
          color: '#856404'
        }
      });
    }
  };

  // Calculer si le bouton doit être désactivé
  const isDisabled = !isServiceOpen || stock === 0 || isFullyInCart;

  // Déterminer le texte du bouton
  const getButtonContent = () => {
    if (!isServiceOpen) {
      return <FontAwesomeIcon icon={faClock} />;
    }
    if (stock === 0 || isFullyInCart) {
      return "Rupture";
    }
    return <FontAwesomeIcon icon={faPlus} />;
  };

  // Déterminer le titre du bouton
  const getButtonTitle = () => {
    if (!isServiceOpen) {
      return "Service fermé";
    }
    if (stock === 0) {
      return "Rupture de stock";
    }
    if (isFullyInCart) {
      return "Tout le stock est dans votre panier";
    }
    return "Ajouter au panier";
  };

  return (
    <div className={`product-card ${!isServiceOpen ? 'product-card--closed' : ''}`}>
      <div className="product-card__content">
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__description">{product.description}</p>

        <div className="product-card__footer">
          <span className="product-card__price">{price.toFixed(2)} €</span>

          <button
            onClick={handleAddToCart}
            disabled={isDisabled}
            className={`product-card__button ${isDisabled ? "btn-disabled" : ""}`}
            title={getButtonTitle()}
          >
            {getButtonContent()}
          </button>
        </div>

        {/* Affichage du stock (uniquement si service ouvert) */}
        {isServiceOpen && stock > 0 && (
          <div className="product-card__stock-info">
            {availableStock > 0 && availableStock < 10 && (
              <p className="product-card__stock-warning">
                Plus que {availableStock} disponible{availableStock > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {product.image_url && (
       <img
       src={API_CONFIG.imageUrl(product.image_url)} 
       alt={product.name}
       className="product-card__image"
     />
      )}
    </div>
  );
};

export default ProductCard;