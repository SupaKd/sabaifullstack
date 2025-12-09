// ===== src/services/api.js ===== (VERSION COMPLÈTE)
const API_URL = 'http://localhost:3000/api';

class ApiService {
  // ✅ Helper pour récupérer le token
  getToken() {
    return localStorage.getItem('admin_token');
  }

  // ✅ Request améliorée avec gestion du token
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    // Préparer les headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // ✅ Ajouter le token JWT pour les routes admin
    if (endpoint.startsWith('/admin') && !endpoint.includes('/login')) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // ✅ Gestion spécifique de l'expiration du token
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        console.warn('⚠️ Token expiré - Redirection vers login');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
        throw new Error('Session expirée');
      }

      if (!response.ok) {
        console.error('❌ Erreur API:', {
          status: response.status,
          endpoint,
          error: data.error,
          details: data.details,
          code: data.code
        });
        throw new Error(data.error || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ========== PRODUCTS (PUBLIC) ==========
  async getProducts(category = null) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/products${query}`);
  }

  async getProduct(id) {
    return this.request(`/products/${id}`);
  }

  async getCategories() {
    return this.request('/products/categories');
  }

  // ========== ORDERS (PUBLIC) ==========
  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id) {
    return this.request(`/orders/${id}`);
  }

  // ========== SERVICE HOURS (PUBLIC) ==========
  async getServiceHours() {
    return this.request('/service-hours');
  }

  async getServiceStatus() {
    return this.request('/service-hours/status');
  }

  async getDeliveryStatus() {
    return this.request('/service-hours/delivery-status');
  }

  async getServiceSettings() {
    return this.request('/service-hours/settings');
  }

  // ========== ADMIN - AUTH ==========
  async adminLogin(credentials) {
    const response = await this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // ✅ Stocker le token après login
    if (response.token) {
      localStorage.setItem('admin_token', response.token);
    }
    
    return response;
  }

  async verifyToken() {
    return this.request('/admin/verify');
  }

  async adminLogout() {
    try {
      await this.request('/admin/logout', { method: 'POST' });
    } catch (error) {
      console.log('Logout error (ignoré):', error);
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }

  // ========== ADMIN - ORDERS ==========
  async getAdminOrders(status = null, limit = 50) {
    const query = status ? `?status=${status}&limit=${limit}` : `?limit=${limit}`;
    return this.request(`/admin/orders${query}`);
  }

  async updateOrderStatus(orderId, status) {
    return this.request(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ========== ADMIN - PRODUCTS ==========
  async getAdminProducts() {
    return this.request('/admin/products');
  }

  async updateProductStock(productId, stock) {
    return this.request(`/admin/products/${productId}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock }),
    });
  }

  // ✅ NOUVELLE MÉTHODE : Disponibilité produit
  async updateProductAvailability(productId, available) {
    return this.request(`/admin/products/${productId}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ available }),
    });
  }

  // ========== ADMIN - STATS ==========
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // ========== ADMIN - IMAGES ==========
  async uploadProductImage(productId, file) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/admin/products/${productId}/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    // Gérer l'expiration du token
    if (response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
      throw new Error('Session expirée');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Erreur upload');
    }

    return data;
  }

  // ========== ADMIN - SERVICE HOURS ==========
  async updateServiceHours(dayOfWeek, data) {
    return this.request(`/service-hours/${dayOfWeek}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateDeliveryEnabled(enabled) {
    return this.request('/service-hours/settings/delivery_enabled', {
      method: 'PUT',
      body: JSON.stringify({ value: enabled ? 'true' : 'false' }),
    });
  }

  async updateSetting(key, value) {
    return this.request(`/service-hours/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value: value.toString() }),
    });
  }
}

export default new ApiService();