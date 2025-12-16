// ===== src/services/api.js ===== (CORRECTION)
import API_CONFIG from './api.config';

class APIService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  async request(endpoint, options = {}) {
    // ✅ CORRECTION : Utiliser API_CONFIG.url() au lieu de this.baseURL
    const url = API_CONFIG.url(endpoint); // ← ICI LA CORRECTION
    
    const config = {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
          console.warn('Session expirée');
          window.location.href = '/admin/login';
          throw new Error('Session expirée');
        }

        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  // ========== MÉTHODES PRODUITS ==========

  async getProducts() {
    return this.request('/products');
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async getCategories() {
    return this.request('/products/categories');
  }

  // ========== MÉTHODES COMMANDES ==========

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  // ========== MÉTHODES ADMIN (nécessitent authentification) ==========

  async getAdminOrders(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getOrder(id) {
    return this.request(`/admin/orders/${id}`);
  }

  async updateOrderStatus(id, status) {
    return this.request(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async getAdminProducts() {
    return this.request('/admin/products');
  }

  async updateProductStock(id, stock) {
    return this.request(`/admin/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock })
    });
  }

  async updateProductAvailability(id, available) {
    return this.request(`/admin/products/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available })
    });
  }

  async createProduct(productData) {
    return this.request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id, productData) {
    return this.request(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(id) {
    return this.request(`/admin/products/${id}`, {
      method: 'DELETE'
    });
  }

  // ✅ Upload image (FormData, pas JSON)
  async uploadProductImage(id, file) {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${this.baseURL}/admin/products/${id}/image`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include', // ✅ Envoyer cookies
        body: formData
        // ❌ NE PAS mettre Content-Type (géré automatiquement avec FormData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Erreur HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Erreur upload image:', error);
      throw error;
    }
  }

  async deleteProductImage(id) {
    return this.request(`/admin/products/${id}/image`, {
      method: 'DELETE'
    });
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // ========== HORAIRES DE SERVICE ==========

  async getServiceHours() {
    return this.request('/service-hours');
  }

  async getServiceStatus() {
    return this.request('/service-hours/status');
  }

  async getDeliveryStatus() {
    return this.request('/service-hours/delivery-status');
  }

  async updateDayHours(dayOfWeek, hoursData) {
    return this.request(`/service-hours/${dayOfWeek}`, {
      method: 'PUT',
      body: JSON.stringify(hoursData)
    });
  }

  async getClosures() {
    return this.request('/service-hours/closures');
  }

  async addClosure(closureData) {
    return this.request('/service-hours/closures', {
      method: 'POST',
      body: JSON.stringify(closureData)
    });
  }

  async deleteClosure(id) {
    return this.request(`/service-hours/closures/${id}`, {
      method: 'DELETE'
    });
  }

  async getServiceSettings() {
    return this.request('/service-hours/settings');
  }

  async updateServiceSetting(key, value) {
    return this.request(`/service-hours/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }

  async updateDeliveryEnabled(value) {
    return this.request('/service-hours/settings/delivery_enabled', {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
  }

  // ========== PAIEMENT STRIPE ==========

  async createCheckoutSession(orderData) {
    return this.request('/payment/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async verifyPayment(sessionId) {
    return this.request('/payment/verify-payment', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId })
    });
  }
}

export default new APIService();