// ===== src/services/api.config.js ===== (VERSION CORRIGÉE)

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.sabai-thoiry.com";

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  baseURL: API_BASE_URL, 

  // Endpoints complets (avec /api)
  PRODUCTS: `${API_BASE_URL}/api/products`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  SERVICE_HOURS: `${API_BASE_URL}/api/service-hours`,
  PAYMENT: `${API_BASE_URL}/api/payment`,
  ADMIN: `${API_BASE_URL}/api/admin`,

  // ✅ Helper pour construire des URLs (AJOUTE /api)
  url: (path) => {
    // Si le path commence par /, ajouter /api
    if (path.startsWith('/')) {
      return `${API_BASE_URL}/api${path}`;
    }
    return `${API_BASE_URL}/api/${path}`;
  },

  // Helper pour les images (pas de /api pour les images)
  imageUrl: (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}${path}`;
  }
};

export default API_CONFIG;