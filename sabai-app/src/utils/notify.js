// ===== src/utils/notify.js =====
import toast from "react-hot-toast";

// Style par défaut pour les toasts
const defaultStyle = {
  background: "#1f1f1f",
  color: "#fff",
  borderRadius: "12px",
  padding: "14px 18px",
  border: "1px solid #333",
};

// Notifications pour le panier
export const notifyAddToCart = (productName) =>
  toast.success(`${productName}`, {
    style: defaultStyle,
    duration: 2000,
  });

// Notifications pour le stock des produits
export const notifyOutOfStock = () =>
  toast.error("Ce produit est en rupture de stock.", {
    duration: 3000,
  });

// Notification pour le stock faible
export const notifyLowStock = (stock) =>
  toast(`⚠️ Plus que ${stock} en stock`, {
    style: { 
      background: "#ffdd57", 
      color: "#333",
      borderRadius: "12px",
      padding: "14px 18px",
    },
    duration: 2500,
  });

// Notifications pour CartItem
export const notifyQuantityUpdated = () =>
  toast.success("Quantité mise à jour", {
    duration: 1500,
    icon: "✅",
  });

export const notifyProductRemoved = (productName) =>
  toast.success(`${productName} retiré du panier`, {
    duration: 2000,
    icon: "🗑️",
  });

export const notifyInvalidQuantity = () =>
  toast.error("Quantité invalide", {
    duration: 2000,
    icon: "⚠️",
  });

export const notifyStockMaxReached = (stock) =>
  toast.error(`Stock maximum atteint (${stock})`, {
    duration: 2500,
  });

// Notifications pour Cart
export const notifyCartCleared = () =>
  toast.success("Panier vidé", {
    duration: 2000,
    icon: "🗑️",
  });

export const notifyStockIssue = () =>
  toast.error("Veuillez vérifier les quantités (stock insuffisant)", {
    duration: 4000,
    icon: "⚠️",
  });

// Notifications pour Checkout
export const notifyOrderSuccess = () =>
  toast.success("Commande créée avec succès !", {
    duration: 4000,
    icon: "✅",
  });

export const notifyServiceClosed = (reason) =>
  toast.error(`Service fermé : ${reason}`, {
    duration: 5000,
    icon: "🕐",
  });

export const notifyServiceUnavailable = (reason) =>
  toast.error(`Service indisponible : ${reason || "Veuillez réessayer plus tard"}`, {
    duration: 5000,
    icon: "🕐",
  });

export const notifyOrderError = (message) =>
  toast.error(message || "Erreur lors de la création de la commande", {
    duration: 4000,
    icon: "❌",
  });