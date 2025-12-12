// ===== src/services/api.js =====
import API_CONFIG from '../services/api.config';

class ApiService {
  getToken() {
    return localStorage.getItem('admin_token');
  }

  async request(endpoint, options = {}) {
    const url = API_CONFIG.url(endpoint);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (endpoint.startsWith('/api/admin') && !endpoint.includes('/login')) {
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

  async getProducts(category = null) {
    const query = category ? `?category=${category}` : '';
    return this.request(`/api/products${query}`);
  }

  async getProduct(id) {
    return this.request(`/api/products/${id}`);
  }

  async getCategories() {
    return this.request('/api/products/categories');
  }

  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(id) {
    return this.request(`/api/orders/${id}`);
  }

  async getServiceHours() {
    return this.request('/api/service-hours');
  }

  async getServiceStatus() {
    return this.request('/api/service-hours/status');
  }

  async getDeliveryStatus() {
    return this.request('/api/service-hours/delivery-status');
  }

  async getServiceSettings() {
    return this.request('/api/service-hours/settings');
  }

  // ========== ADMIN - AUTH ==========
async adminLogin(credentials) {
  const response = await this.request('/api/admin/login', {  // ✅ Ajoute /api/
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  
  if (response.token) {
    localStorage.setItem('admin_token', response.token);
  }
  
  return response;
}

async verifyToken() {
  return this.request('/api/admin/verify');  // ✅ Ajoute /api/
}

async adminLogout() {
  try {
    await this.request('/api/admin/logout', { method: 'POST' });  // ✅ Ajoute /api/
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
  return this.request(`/api/admin/orders${query}`);  // ✅ Vérifie que /api/ est bien là
}

async updateOrderStatus(orderId, status) {
  return this.request(`/api/admin/orders/${orderId}/status`, {  // ✅ /api/
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ========== ADMIN - PRODUCTS ==========
async getAdminProducts() {
  return this.request('/api/admin/products');  // ✅ /api/
}

async updateProductStock(productId, stock) {
  return this.request(`/api/admin/products/${productId}/stock`, {  // ✅ /api/
    method: 'PATCH',
    body: JSON.stringify({ stock }),
  });
}

async updateProductAvailability(productId, available) {
  return this.request(`/api/admin/products/${productId}/availability`, {  // ✅ /api/
    method: 'PATCH',
    body: JSON.stringify({ available }),
  });
}

// ========== ADMIN - STATS ==========
async getAdminStats() {
  return this.request('/api/admin/stats');  // ✅ /api/
}

  async uploadProductImage(productId, file) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(
      API_CONFIG.url(`/admin/products/${productId}/image`),
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );

    const data = await response.json();

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
  return this.request(`/api/service-hours/${dayOfWeek}`, {  // ✅ Vérifie que /api/ est là
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async updateDeliveryEnabled(enabled) {
  return this.request('/api/service-hours/settings/delivery_enabled', {  // ✅ /api/
    method: 'PUT',
    body: JSON.stringify({ value: enabled ? 'true' : 'false' }),
  });
}

async updateSetting(key, value) {
  return this.request(`/api/service-hours/settings/${key}`, {  // ✅ /api/
    method: 'PUT',
    body: JSON.stringify({ value: value.toString() }),
  });
}
}

export default new ApiService();
