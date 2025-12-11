// ===== src/components/CartItem.jsx (Version Optimisée avec notify.js) =====
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faTrash,
  faExclamationTriangle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  notifyQuantityUpdated,
  notifyInvalidQuantity,
  notifyStockMaxReached,
} from "../utils/notify";

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);

  if (!item?.product) return null;

  const price = Number(item.product.price);
  const quantity = Number(item.quantity);
  const stock = Number(item.product.stock_quantity || item.product.stock || 0);
  const subtotal = (price * quantity).toFixed(2);
  
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock < 10;
  const hasStockIssue = quantity > stock;

  // Gestion de l'image avec fallback
  const getImageUrl = () => {
    if (!item.product.image_url) {
      return "/images/placeholder-food.jpg";
    }
    
    if (item.product.image_url.startsWith("http")) {
      return item.product.image_url;
    }
    
    return `http://localhost:3000${item.product.image_url}`;
  };

  const handleImageError = (e) => {
    e.target.src = "/images/placeholder-food.jpg";
  };

  // Incrémenter la quantité
  const handleIncrement = () => {
    if (quantity >= stock) {
      notifyStockMaxReached(stock);
      return;
    }
    
    updateQuantity(item.product.id, quantity + 1);
    notifyQuantityUpdated();
  };

  // Décrémenter la quantité
  const handleDecrement = () => {
    if (quantity <= 1) {
      // Suppression directe sans confirmation
      setIsRemoving(true);
      setTimeout(() => {
        removeItem(item.product.id);
      }, 300);
      return;
    }
    
    updateQuantity(item.product.id, quantity - 1);
    notifyQuantityUpdated();
  };

  // Changer la quantité manuellement
  const handleQuantityChange = (e) => {
    const newQuantity = Number(e.target.value);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
      notifyInvalidQuantity();
      return;
    }
    
    if (newQuantity > stock) {
      notifyStockMaxReached(stock);
      updateQuantity(item.product.id, stock);
      return;
    }
    
    updateQuantity(item.product.id, newQuantity);
  };

  // Classes CSS dynamiques
  const cartItemClasses = [
    "cart-item",
    isRemoving && "cart-item--removing",
    isOutOfStock && "cart-item--unavailable",
    hasStockIssue && "cart-item--warning",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cartItemClasses}>
      {/* Image du produit */}
      <div className="cart-item__image">
        <img
          src={getImageUrl()}
          alt={item.product.name}
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      {/* Détails du produit */}
      <div className="cart-item__details">
        <div className="cart-item__info">
          <h3 className="cart-item__name">{item.product.name}</h3>
          
          {item.product.description && (
            <p className="cart-item__description">
              {item.product.description.length > 80
                ? item.product.description.substring(0, 80) + "..."
                : item.product.description}
            </p>
          )}

          <div className="cart-item__price-unit">
            {price.toFixed(2)} € / unité
          </div>
        </div>

        {/* Alertes de stock */}
        {hasStockIssue && !isOutOfStock && (
          <div className="cart-item__alert cart-item__alert--error">
            <span className="alert-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </span>
            <span>Stock insuffisant (max: {stock})</span>
          </div>
        )}

        {isLowStock && !isOutOfStock && !hasStockIssue && (
          <div className="cart-item__alert cart-item__alert--warning">
            <span className="alert-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </span>
            <span>
              Plus que {stock - quantity} disponible{stock - quantity > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="cart-item__alert cart-item__alert--error">
            <span className="alert-icon">
              <FontAwesomeIcon icon={faExclamationCircle} />
            </span>
            <span>Produit actuellement indisponible</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="cart-item__actions">
        {/* Contrôles de quantité */}
        <div className="cart-item__quantity">
          <div className="quantity-controls">
            <button
              className="quantity-btn quantity-btn--minus"
              disabled={isOutOfStock}
              onClick={handleDecrement}
              aria-label={quantity <= 1 ? "Supprimer du panier" : "Diminuer la quantité"}
              title={quantity <= 1 ? "Supprimer l'article" : "Diminuer"}
            >
              {quantity <= 1 ? (
                <FontAwesomeIcon icon={faTrash} />
              ) : (
                <FontAwesomeIcon icon={faMinus} />
              )}
            </button>

            <input
              type="number"
              className="quantity-input"
              value={quantity}
              min="1"
              max={stock}
              onChange={handleQuantityChange}
              disabled={isOutOfStock}
              aria-label="Quantité"
            />

            <button
              className="quantity-btn quantity-btn--plus"
              onClick={handleIncrement}
              disabled={quantity >= stock || isOutOfStock}
              aria-label="Augmenter la quantité"
              title={quantity >= stock ? "Stock maximum atteint" : "Augmenter"}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
        </div>

        {/* Sous-total */}
        <div className="cart-item__subtotal">
          <span className="cart-item__subtotal-amount">{subtotal} €</span>
        </div>
      </div>
    </div>
  );
};

export default CartItem;