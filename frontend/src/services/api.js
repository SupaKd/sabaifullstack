// ===== src/services/api.js ===== (VERSION CORRIGÉE)
import API_CONFIG from './api.config';

class APIService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
  }

  async request(endpoint, options = {}) {
    const url = API_CONFIG.url(endpoint);
    
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
      
      // ✅ CORRECTION: Gérer les réponses vides
      const text = await response.text();
      let data = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('Erreur parsing JSON:', parseError);
          data = { error: 'Réponse invalide du serveur' };
        }
      }

      if (!response.ok) {
        // Session expirée - rediriger vers login
        if (response.status === 401) {
          const code = data.code;
          if (code === 'TOKEN_EXPIRED' || code === 'NO_TOKEN' || code === 'INVALID_TOKEN') {
            console.warn('Session expirée, redirection vers login...');
            // ✅ Ne pas rediriger si on est déjà sur la page login
            if (!window.location.pathname.includes('/admin/login')) {
              window.location.href = '/admin/login';
            }
            throw new Error('Session expirée');
          }
        }

        throw new Error(data.error || data.message || `Erreur HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      // ✅ Ne pas logger les erreurs de session expirée
      if (!error.message.includes('Session expirée')) {
        console.error(`Erreur API ${endpoint}:`, error);
      }
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

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  // ========== MÉTHODES ADMIN ==========

  async adminLogin(credentials) {
    const response = await fetch(API_CONFIG.url('/admin/login'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const text = await response.text();
    let data = {};
    
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Réponse invalide du serveur');
      }
    }

    if (!response.ok) {
      throw new Error(data.error || 'Erreur de connexion');
    }

    return data;
  }

  async adminLogout() {
    return this.request('/admin/logout', {
      method: 'POST'
    });
  }

  async verifySession() {
    return this.request('/admin/verify');
  }

  async getAdminOrders(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    return this.request(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminOrder(id) {
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
        credentials: 'include',
        body: formData
        // ❌ NE PAS mettre Content-Type (géré automatiquement avec FormData)
      });

      const text = await response.text();
      let data = {};
      
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error('Réponse invalide du serveur');
        }
      }

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

// ✅ Export singleton
const apiInstance = new APIService();
export default apiInstance;