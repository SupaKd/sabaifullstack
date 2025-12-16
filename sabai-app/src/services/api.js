// ===== src/services/api.js ===== (VERSION COOKIES)
import API_CONFIG from './api.config';

class APIService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  async request(endpoint, options = {}) {
    const url = API_CONFIG.url(endpoint);
    
    const config = {
      ...options,
      credentials: 'include', // ✅ TOUJOURS inclure les cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Session expirée - rediriger vers login
        if (response.status === 401 && (data.code === 'TOKEN_EXPIRED' || data.code === 'NO_TOKEN')) {
          console.warn('Session expirée, redirection vers login...');
          localStorage.removeItem('admin_user');
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

  // ========== MÉTHODES ADMIN ==========

  // ✅ Login (ne retourne plus le token, il est dans le cookie)
  async adminLogin(credentials) {
    const response = await fetch(API_CONFIG.url('/admin/login'), {
      method: 'POST',
      credentials: 'include', // ← Important
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur de connexion');
    }

    return data; // { success: true, user: {...} }
  }

  // ✅ Logout
  async adminLogout() {
    return this.request('/admin/logout', {
      method: 'POST'
    });
  }

  // ✅ Vérifier la session
  async verifySession() {
    return this.request('/admin/verify');
  }

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

  async uploadProductImage(id, file) {
    const formData = new FormData();
    formData.append('image', file);

    const url = API_CONFIG.url(`/admin/products/${id}/image`);

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