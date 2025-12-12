// ===== src/config/api.config.js =====
// Configuration centralisée de l'API

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://145.223.34.3';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  
  // Endpoints
  PRODUCTS: `${API_BASE_URL}/api/products`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  SERVICE_HOURS: `${API_BASE_URL}/api/service-hours`,
  PAYMENT: `${API_BASE_URL}/api/payment`,
  ADMIN: `${API_BASE_URL}/api/admin`,
  
  // Helper pour construire des URLs
  url: (path) => `${API_BASE_URL}${path}`,
  
  // Helper pour les images
  imageUrl: (path) => path ? `${API_BASE_URL}${path}` : null,
};

export default API_CONFIG;