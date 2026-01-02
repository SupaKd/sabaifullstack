// ===== server.js ===== (VERSION CORRIGÉE)

// Import des modules principaux
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
require('dotenv').config();

// Import des modules internes
const { initDB } = require('./config/database');
const { initWebSocket } = require('./config/websocket');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const serviceHoursRoutes = require('./routes/serviceHours');
const paymentRoutes = require('./routes/payment');

// Import du error handler
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Initialisation d'Express et du serveur HTTP
const app = express();
const server = http.createServer(app);

// ✅ Cookie parser (AVANT cors et express.json)
app.use(cookieParser());

// ✅ CORS corrigé avec gestion dynamique des origines
const allowedOrigins = [
  'https://white-lark-930387.hostingersite.com',
  'http://white-lark-930387.hostingersite.com',
  'https://sabai-thoiry.com',
  'https://www.sabai-thoiry.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origine (comme Postman ou curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqué pour: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Parser JSON avec limite
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Logger amélioré
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const origin = req.get('origin') || 'no-origin';
  
  // Log condensé pour les routes fréquentes
  if (path.includes('/health') || path.includes('/status')) {
    // Ne pas logger les health checks
  } else {
    console.log(`${timestamp} - ${method} ${path} [${origin}]`);
  }
  
  next();
});

// Routes principales
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/service-hours', serviceHoursRoutes);
app.use('/api/payment', paymentRoutes);

// Route d'accueil
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Sabai Restaurant',
    version: '1.0.0',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      admin: '/api/admin',
      serviceHours: '/api/service-hours',
      payment: '/api/payment'
    }
  });
});

// Health Check amélioré
app.get('/health', async (req, res) => {
  try {
    const { getPool } = require('./config/database');
    const pool = getPool();
    
    const start = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - start;
    
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      dbLatency: `${dbLatency}ms`,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message
    });
  }
});

// 404 HANDLER - Doit être AVANT errorHandler
app.use(notFoundHandler);

// ERROR HANDLER - Doit être le dernier middleware
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

initDB()
  .then(() => {
    initWebSocket(server);
    
    server.listen(PORT, () => {
      console.log('================================');
      console.log(`✓ Serveur HTTP démarré sur le port ${PORT}`);
      console.log(`✓ Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Serveur WebSocket actif`);
      console.log(`✓ API accessible sur http://localhost:${PORT}`);
      console.log(`✓ WebSocket sur ws://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ 🔒 Auth avec cookies httpOnly activée`);
      console.log('================================');
    });
  })
  .catch(err => {
    console.error('✗ Erreur initialisation:', err);
    process.exit(1);
  });

// ✅ Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt gracieux...');
  server.close(() => {
    console.log('Serveur arrêté');
    process.exit(0);
  });
});