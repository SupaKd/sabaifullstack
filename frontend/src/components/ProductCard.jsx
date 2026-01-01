// ===== src/components/ProductCard.jsx ===== (VERSION OPTIMISÉE avec Lucide)
import { useCart } from "../context/CartContext";
import { useServiceStatus } from "../context/ServiceStatusContext";
import { Plus, Clock } from "lucide-react";
import OptimizedImage from "./OptimizedImage";
import toast from "react-hot-toast";

import {
  notifyAddToCart,
  notifyOutOfStock,
} from "../utils/notify";

const ProductCard = ({ product }) => {
  const { addItem, items } = useCart();
  const { serviceStatus } = useServiceStatus();

  const price = parseFloat(product.price);
  const stock = parseInt(product.stock_quantity || product.stock || 0);
  const isServiceOpen = serviceStatus?.open ?? true;

  const getQuantityInCart = () => {
    const cartItem = items.find(item => item.product?.id === product.id);
    return cartItem ? cartItem.quantity : 0;
  };

  const quantityInCart = getQuantityInCart();
  const availableStock = stock - quantityInCart;
  const isFullyInCart = availableStock <= 0;

  const handleAddToCart = () => {
    if (!isServiceOpen) {
      toast.error("Nous sommes actuellement fermés", {
        duration: 4000,
        icon: '🕐'
      });
      return;
    }

    if (stock === 0) {
      notifyOutOfStock();
      return;
    }

    if (isFullyInCart) {
      toast.error(`Vous avez déjà tout le stock disponible dans votre panier (${quantityInCart})`, {
        duration: 4000,
        icon: '📦'
      });
      return;
    }

    if (quantityInCart >= stock) {
      toast.error(`Stock maximum atteint (${stock} disponibles)`, {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }

    addItem(product, 1);
    
    const newQuantityInCart = quantityInCart + 1;
    const remainingStock = stock - newQuantityInCart;

    if (remainingStock > 0) {
      notifyAddToCart(product.name);
    } else {
      toast.success(`${product.name} ajouté - C'était le dernier !`, {
        duration: 3000,
        icon: '✅'
      });
    }

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

  const isDisabled = !isServiceOpen || stock === 0 || isFullyInCart;

  const getButtonContent = () => {
    if (!isServiceOpen) {
      return <Clock size={18} />;
    }
    if (stock === 0 || isFullyInCart) {
      return "Rupture";
    }
    return <Plus size={18} />;
  };

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
        <OptimizedImage
          src={product.image_url}
          alt={product.name}
          className="product-card__image"
        />
      )}
    </div>
  );
};

export default ProductCard;