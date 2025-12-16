// ===== server.js ===== (VERSION SÉCURISÉE - COOKIES httpOnly)

// Import des modules principaux
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // ✅ NOUVEAU
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

// ✅ NOUVEAU : Cookie parser (AVANT cors et express.json)
app.use(cookieParser());

// Middlewares globaux - CORS avec credentials
app.use(cors({
  origin: [
    'https://white-lark-930387.hostingersite.com',
    'http://white-lark-930387.hostingersite.com',
    'https://sabai-thoiry.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true, // ✅ IMPORTANT : Permet l'envoi de cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      admin: '/api/admin',
      serviceHours: '/api/service-hours',
      payment: '/api/payment'
    }
  });
});

// Health Check
app.get('/health', async (req, res) => {
  try {
    const { getPool } = require('./config/database');
    const pool = getPool();
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
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
      console.log(`✓ Serveur WebSocket actif`);
      console.log(`✓ API accessible sur http://localhost:${PORT}`);
      console.log(`✓ WebSocket sur ws://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ Gestion des heures: http://localhost:${PORT}/api/service-hours`);
      console.log(`✓ Paiement Stripe: http://localhost:${PORT}/api/payment`); 
      console.log(`✓ 🔒 Auth avec cookies httpOnly activée`); // ✅ NOUVEAU
      console.log('================================');
    });
  })
  .catch(err => {
    console.error('✗ Erreur initialisation:', err);
    process.exit(1);
  });