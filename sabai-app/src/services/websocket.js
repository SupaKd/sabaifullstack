// ===== src/services/websocket.js =====
class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectInterval = 3000;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  connect(type, orderId = null) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket déjà connecté ou en cours de connexion');
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;
    
    // ✅ URL CORRIGÉE
    const baseUrl = import.meta.env.VITE_API_URL || 'https://sabai-thoiry.com';
    const url = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('✓ WebSocket connecté');
      this.isConnecting = false;
      
      if (type === 'admin') {
        this.send({ type: 'admin_connect' });
      } else if (type === 'order' && orderId) {
        this.send({ type: 'order_connect', order_id: orderId });
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data);
      } catch (error) {
        console.error('Erreur parsing WebSocket:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      this.isConnecting = false;
    };

    this.ws.onclose = () => {
      console.log('WebSocket déconnecté');
      this.isConnecting = false;
      
      if (this.shouldReconnect) {
        this.reconnect(type, orderId);
      }
    };
  }

  reconnect(type, orderId) {
    if (this.reconnectTimeout || !this.shouldReconnect) return;
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Tentative de reconnexion...');
      this.connect(type, orderId);
      this.reconnectTimeout = null;
    }, this.reconnectInterval);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(data) {
    if (data.type === 'notification' && this.listeners.has(data.event)) {
      this.listeners.get(data.event).forEach(callback => callback(data.data));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.listeners.clear();
    this.isConnecting = false;
  }
}

export default new WebSocketService();