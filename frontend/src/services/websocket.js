// ===== src/services/websocket.js ===== (VERSION STABLE SANS HEARTBEAT)
class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectInterval = 3000;
    this.reconnectTimeout = null;
    this.isConnecting = false;
    this.shouldReconnect = true;
    
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    
    // ⚠️ Heartbeat désactivé pour éviter les fausses déconnexions
    // this.heartbeatInterval = null;
    // this.heartbeatTimeout = null;
    // this.pingInterval = 30000;
    // this.pongTimeout = 5000;
  }

  connect(type, orderId = null) {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      console.log('WebSocket déjà connecté ou en cours de connexion');
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
      this.notifyListeners({
        type: 'notification',
        event: 'connection_failed',
        data: { message: 'Connexion impossible après plusieurs tentatives' }
      });
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;
    
    // URL WebSocket
    const baseUrl = import.meta.env.VITE_API_URL || 'https://api.sabai-thoiry.com';
    const url = baseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    try {
      this.ws = new WebSocket(url);
    } catch (error) {
      console.error('Erreur création WebSocket:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;
      this.reconnect(type, orderId);
      return;
    }

    this.ws.onopen = () => {
      console.log('✓ WebSocket connecté');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Envoyer message de connexion
      if (type === 'admin') {
        this.send({ type: 'admin_connect' });
      } else if (type === 'order' && orderId) {
        this.send({ type: 'order_connect', order_id: orderId });
      }

      // ⚠️ Heartbeat désactivé
      // this.startHeartbeat();
      
      this.notifyListeners({
        type: 'notification',
        event: 'connected',
        data: { message: 'Connexion établie' }
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // ⚠️ Pas de gestion de pong car pas de ping
        // if (data.type === 'pong') {
        //   this.handlePong();
        //   return;
        // }
        
        this.notifyListeners(data);
      } catch (error) {
        console.error('Erreur parsing WebSocket:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
      this.isConnecting = false;
      // this.stopHeartbeat();
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket déconnecté', event.code, event.reason);
      this.isConnecting = false;
      // this.stopHeartbeat();
      
      this.reconnectAttempts++;
      
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect(type, orderId);
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Arrêt des reconnexions après', this.maxReconnectAttempts, 'tentatives');
        this.notifyListeners({
          type: 'notification',
          event: 'connection_failed',
          data: { message: 'Connexion impossible' }
        });
      }
    };
  }

  // ⚠️ Heartbeat désactivé - Ces fonctions ne sont plus utilisées
  /*
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
        
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('⚠️ Pas de pong reçu, connexion probablement morte');
          this.ws.close();
        }, this.pongTimeout);
      }
    }, this.pingInterval);
  }

  handlePong() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
  */

  reconnect(type, orderId) {
    if (this.reconnectTimeout || !this.shouldReconnect) return;
    
    const delay = Math.min(
      this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1),
      30000
    );
    
    console.log(`Reconnexion dans ${Math.round(delay / 1000)}s (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect(type, orderId);
      this.reconnectTimeout = null;
    }, delay);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Erreur envoi WebSocket:', error);
      }
    } else {
      console.warn('WebSocket pas connecté, impossible d\'envoyer:', data);
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
      this.listeners.get(data.event).forEach(callback => {
        try {
          callback(data.data);
        } catch (error) {
          console.error('Erreur callback WebSocket:', error);
        }
      });
    }
  }

  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }

  disconnect() {
    this.shouldReconnect = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.listeners.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  get isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  get attemptsRemaining() {
    return Math.max(0, this.maxReconnectAttempts - this.reconnectAttempts);
  }
}

export default new WebSocketService();