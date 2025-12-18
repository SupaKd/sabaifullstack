// ===== config/websocket.js =====
const WebSocket = require('ws');

let wss = null;
const clients = new Map(); 

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('✓ Nouvelle connexion WebSocket');

    // Gestion des messages du client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        // Identifier le type de client (admin ou order avec ID)
        if (data.type === 'admin_connect') {
          clients.set(ws, { type: 'admin' });
          console.log('✓ Admin connecté via WebSocket');
          ws.send(JSON.stringify({ type: 'connected', role: 'admin' }));
        } else if (data.type === 'order_connect' && data.order_id) {
          clients.set(ws, { type: 'order', order_id: data.order_id });
          console.log(`✓ Client connecté pour suivre la commande #${data.order_id}`);
          ws.send(JSON.stringify({ type: 'connected', role: 'client', order_id: data.order_id }));
        }
      } catch (error) {
        console.error('Erreur parsing message WebSocket:', error);
      }
    });

    ws.on('close', () => {
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        console.log(`✓ Déconnexion WebSocket: ${clientInfo.type}`);
        clients.delete(ws);
      }
    });

    ws.on('error', (error) => {
      console.error('Erreur WebSocket:', error);
    });

    // Ping pour garder la connexion active
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Nettoyage des connexions mortes
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('✓ Serveur WebSocket initialisé');
}

// Envoyer une notification à tous les admins
function notifyAdmins(event, data) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'notification',
    event: event,
    data: data,
    timestamp: new Date().toISOString()
  });

  clients.forEach((clientInfo, ws) => {
    if (clientInfo.type === 'admin' && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  console.log(`✓ Notification envoyée aux admins: ${event}`);
}

// Envoyer une notification à un client spécifique (par order_id)
function notifyClient(orderId, event, data) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'notification',
    event: event,
    data: data,
    timestamp: new Date().toISOString()
  });

  clients.forEach((clientInfo, ws) => {
    if (clientInfo.type === 'order' && 
        clientInfo.order_id === orderId && 
        ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  console.log(`✓ Notification envoyée au client (commande #${orderId}): ${event}`);
}

// Broadcast à tous les clients connectés
function broadcast(event, data) {
  if (!wss) return;

  const message = JSON.stringify({
    type: 'notification',
    event: event,
    data: data,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  console.log(`✓ Broadcast: ${event}`);
}

module.exports = {
  initWebSocket,
  notifyAdmins,
  notifyClient,
  broadcast
};