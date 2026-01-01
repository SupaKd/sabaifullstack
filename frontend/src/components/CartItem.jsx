// ===== src/components/CartItem.jsx (Version avec Lucide React) =====
import { useState } from "react";
import { useCart } from "../context/CartContext";
import {
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";
import {
  notifyQuantityUpdated,
  notifyInvalidQuantity,
  notifyStockMaxReached,
} from "../utils/notify";
import API_CONFIG from '../services/api.config';

const CartItem = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!item?.product) return null;

  const price = Number(item.product.price);
  const quantity = Number(item.quantity);
  const stock = Number(item.product.stock_quantity || item.product.stock || 0);
  const subtotal = (price * quantity).toFixed(2);
  
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock < 10;
  const hasStockIssue = quantity > stock;

  const hasValidImage = () => {
    return item.product.image_url && 
           item.product.image_url.trim() !== '' && 
           item.product.image_url !== 'null' &&
           item.product.image_url !== 'undefined';
  };

  const getImageUrl = () => {
    if (!hasValidImage()) {
      return null;
    }
    
    if (item.product.image_url.startsWith("http")) {
      return item.product.image_url;
    }
    
    return API_CONFIG.imageUrl(item.product.image_url);
  };

  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleIncrement = () => {
    if (quantity >= stock) {
      notifyStockMaxReached(stock);
      return;
    }
    
    updateQuantity(item.product.id, quantity + 1);
    notifyQuantityUpdated();
  };

  const handleDecrement = () => {
    if (quantity <= 1) {
      setIsRemoving(true);
      setTimeout(() => {
        removeItem(item.product.id);
      }, 300);
      return;
    }
    
    updateQuantity(item.product.id, quantity - 1);
    notifyQuantityUpdated();
  };

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

  const cartItemClasses = [
    "cart-item",
    isRemoving && "cart-item--removing",
    isOutOfStock && "cart-item--unavailable",
    hasStockIssue && "cart-item--warning",
    !hasValidImage() && "cart-item--no-image",
  ]
    .filter(Boolean)
    .join(" ");

  const imageUrl = getImageUrl();

  return (
    <div className={cartItemClasses}>
      {/* Image du produit - CONDITIONNELLE */}
      {imageUrl && !imageError ? (
        <div className="cart-item__image">
          <img
            src={imageUrl}
            alt={item.product.name}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {!imageLoaded && (
            <div className="cart-item__image-loader">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      ) : (
        <div className="cart-item__image cart-item__image--placeholder">
          <UtensilsCrossed className="placeholder-icon" size={40} />
        </div>
      )}

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
              <AlertTriangle size={16} />
            </span>
            <span>Stock insuffisant (max: {stock})</span>
          </div>
        )}

        {isLowStock && !isOutOfStock && !hasStockIssue && (
          <div className="cart-item__alert cart-item__alert--warning">
            <span className="alert-icon">
              <AlertTriangle size={16} />
            </span>
            <span>
              Plus que {stock - quantity} disponible{stock - quantity > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {isOutOfStock && (
          <div className="cart-item__alert cart-item__alert--error">
            <span className="alert-icon">
              <AlertCircle size={16} />
            </span>
            <span>Produit actuellement indisponible</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="cart-item__actions">
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
                <Trash2 size={16} />
              ) : (
                <Minus size={16} />
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
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="cart-item__subtotal">
          <span className="cart-item__subtotal-amount">{subtotal} €</span>
        </div>
      </div>
    </div>
  );
};

export default CartItem;