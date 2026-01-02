// ===== routes/orders.js ===== (VERSION CORRIGÉE)
const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { sendConfirmationEmail, sendOrderStatusEmail } = require('../config/email');
const { validateOrder } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');
const { checkServiceAvailability } = require('../middleware/checkServiceAvailability');
const { notifyAdmins } = require('../config/websocket');

// ===== CONSTANTES =====
const VALID_ORDER_TYPES = ['delivery', 'takeaway'];
const TIME_BUFFER_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_DELIVERY_FEE = 5;
const DEFAULT_MIN_ORDER = 30;

// ===== HELPERS =====

/**
 * Valide le format de date et heure et vérifie qu'ils sont dans le futur
 */
function validateDateTime(delivery_date, delivery_time, order_type) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

  if (!dateRegex.test(delivery_date)) {
    throw new Error('Format de date invalide. Utilisez YYYY-MM-DD');
  }

  if (!timeRegex.test(delivery_time)) {
    throw new Error('Format d\'heure invalide. Utilisez HH:MM ou HH:MM:SS');
  }

  const deliveryDateTime = new Date(`${delivery_date}T${delivery_time}`);
  const minAllowedTime = new Date(Date.now() - TIME_BUFFER_MS);
  
  if (deliveryDateTime <= minAllowedTime) {
    const action = order_type === 'delivery' ? 'de livraison' : 'de retrait';
    throw new Error(`La date et l'heure ${action} doivent être dans le futur`);
  }

  return deliveryDateTime;
}

/**
 * Récupère les paramètres de livraison
 */
async function getDeliverySettings(connection) {
  const [settings] = await connection.query(
    `SELECT setting_key, setting_value 
     FROM service_settings 
     WHERE setting_key IN ('delivery_enabled', 'delivery_fee', 'delivery_min_amount')`
  );
  
  const config = {
    enabled: false,
    fee: DEFAULT_DELIVERY_FEE,
    minAmount: DEFAULT_MIN_ORDER
  };

  settings.forEach(s => {
    if (s.setting_key === 'delivery_enabled') {
      config.enabled = s.setting_value === 'true';
    } else {
      config[s.setting_key === 'delivery_fee' ? 'fee' : 'minAmount'] = parseFloat(s.setting_value);
    }
  });

  return config;
}

/**
 * Valide les items et calcule le total (avec lock pessimiste)
 */
async function validateAndCalculateItems(connection, items) {
  if (!items || items.length === 0) {
    throw new Error('La commande doit contenir au moins un article');
  }

  const productIds = items.map(item => item.product_id);
  
  // Lock FOR UPDATE pour éviter les race conditions sur le stock
  const [products] = await connection.query(
    `SELECT id, name, price, stock 
     FROM products 
     WHERE id IN (?) AND available = true
     FOR UPDATE`,
    [productIds]
  );

  if (products.length !== items.length) {
    throw new Error('Un ou plusieurs produits sont indisponibles');
  }

  const productMap = new Map(products.map(p => [p.id, p]));
  let total = 0;
  const orderDetails = [];

  for (const item of items) {
    const product = productMap.get(item.product_id);
    
    if (!product) {
      throw new Error(`Produit ${item.product_id} non trouvé`);
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Stock insuffisant pour ${product.name} (disponible: ${product.stock}, demandé: ${item.quantity})`
      );
    }

    if (item.quantity <= 0) {
      throw new Error(`Quantité invalide pour ${product.name}`);
    }

    const itemTotal = product.price * item.quantity;
    total += itemTotal;

    orderDetails.push({
      product_id: product.id,
      name: product.name,
      quantity: item.quantity,
      price: product.price
    });
  }

  return { orderDetails, total };
}

/**
 * Crée une commande (logique partagée)
 */
async function createOrder(connection, orderData) {
  const {
    order_type,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    delivery_date,
    delivery_time,
    items,
    notes,
    payment_status = 'paid',
    payment_method = 'card'
  } = orderData;

  // Validation de base
  if (!customer_name?.trim() || !customer_email?.trim() || !customer_phone?.trim()) {
    throw new Error('Informations client incomplètes');
  }

  if (!VALID_ORDER_TYPES.includes(order_type)) {
    throw new Error(`Type de commande invalide. Utilisez: ${VALID_ORDER_TYPES.join(', ')}`);
  }

  // Validation date/heure
  validateDateTime(delivery_date, delivery_time, order_type);

  // Vérification livraison
  const deliverySettings = await getDeliverySettings(connection);
  
  if (order_type === 'delivery') {
    if (!deliverySettings.enabled) {
      throw new Error('La livraison est actuellement désactivée. Veuillez choisir le retrait au restaurant.');
    }
    
    if (!delivery_address?.trim()) {
      throw new Error('L\'adresse de livraison est obligatoire');
    }
  }

  // Validation et calcul des items
  const { orderDetails, total: subtotal } = await validateAndCalculateItems(connection, items);

  // Calcul des frais de livraison
  let deliveryFee = 0;
  let total = subtotal;

  if (order_type === 'delivery') {
    if (subtotal < deliverySettings.minAmount) {
      throw new Error(
        `Minimum de commande ${deliverySettings.minAmount.toFixed(2)}€ requis pour la livraison`
      );
    }
    deliveryFee = deliverySettings.fee;
    total += deliveryFee;
  }

  // Insertion de la commande
  const [orderResult] = await connection.query(
    `INSERT INTO orders (
      order_type, customer_name, customer_email, customer_phone, 
      delivery_address, delivery_date, delivery_time, 
      total_amount, delivery_fee, notes, payment_status, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order_type,
      customer_name.trim(),
      customer_email.trim(),
      customer_phone.trim(),
      order_type === 'delivery' ? delivery_address?.trim() : null,
      delivery_date,
      delivery_time,
      total,
      deliveryFee,
      notes?.trim() || null,
      payment_status,
      payment_method
    ]
  );

  const orderId = orderResult.insertId;

  // Insertion en batch des items et mise à jour du stock
  const itemValues = [];
  const stockUpdates = [];

  for (const item of orderDetails) {
    itemValues.push([
      orderId,
      item.product_id,
      item.name,
      item.quantity,
      item.price
    ]);

    stockUpdates.push([item.quantity, item.product_id]);
  }

  // Insertion batch des items
  await connection.query(
    `INSERT INTO order_items (order_id, product_id, product_name, quantity, price) 
     VALUES ?`,
    [itemValues]
  );

  // Mise à jour batch du stock
  for (const [quantity, productId] of stockUpdates) {
    await connection.query(
      'UPDATE products SET stock = stock - ? WHERE id = ?',
      [quantity, productId]
    );
  }

  return { orderId, total, orderDetails, deliveryFee };
}

// ===== ROUTES =====

/**
 * POST /api/orders - Créer une nouvelle commande
 */
router.post('/', 
  checkServiceAvailability, 
  rateLimiter(5, 60000), 
  validateOrder, 
  async (req, res, next) => {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { orderId, total, orderDetails, deliveryFee } = await createOrder(connection, req.body);
      
      await connection.commit();

      const { 
        order_type, 
        customer_name, 
        customer_email, 
        customer_phone,
        delivery_address,
        delivery_date, 
        delivery_time,
        notes 
      } = req.body;

      const action = order_type === 'delivery' ? 'Livraison' : 'Retrait';
      console.log(
        `✓ Commande #${orderId} créée pour ${customer_name} ` +
        `(${total.toFixed(2)}€) - ${action} prévu le ${delivery_date} à ${delivery_time}`
      );

      // Email de confirmation
      sendConfirmationEmail(
        customer_email,
        customer_name,
        orderId,
        total,
        orderDetails,
        delivery_date,
        delivery_time,
        order_type
      );

      // Notification WebSocket
      notifyAdmins('new_order', {
        order: {
          id: orderId,
          order_type,
          customer_name,
          customer_phone,
          customer_email,
          total_amount: total,
          delivery_fee: deliveryFee,
          delivery_address: order_type === 'delivery' ? delivery_address : null,
          delivery_date,
          delivery_time,
          items_count: orderDetails.length,
          items: orderDetails,
          notes
        }
      });

      res.status(201).json({
        success: true,
        order_id: orderId,
        order_type,
        total,
        delivery_date,
        delivery_time,
        message: 'Commande créée avec succès. Un email de confirmation a été envoyé.'
      });

    } catch (error) {
      await connection.rollback();
      next(error);
    } finally {
      connection.release();
    }
  }
);

/**
 * GET /api/orders/:id - Récupérer une commande par ID (pour le suivi client)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    const orderId = parseInt(req.params.id);

    if (!orderId || orderId <= 0) {
      return res.status(400).json({ 
        success: false,
        error: 'ID de commande invalide'
      });
    }

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Commande non trouvée' 
      });
    }

    const [items] = await pool.query(`
      SELECT oi.*, p.name, p.description 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({ 
      success: true,
      order: orders[0], 
      items 
    });

  } catch (error) {
    next(error);
  }
});

// ===== FONCTION RÉUTILISABLE POUR STRIPE =====

async function createOrderFromStripe(orderData) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { orderId, total, orderDetails } = await createOrder(connection, {
      ...orderData,
      payment_status: 'paid',
      payment_method: 'stripe'
    });
    
    await connection.commit();

    console.log(`✓ Commande #${orderId} créée via Stripe`);

    // Email de confirmation
    sendConfirmationEmail(
      orderData.customer_email,
      orderData.customer_name,
      orderId,
      total,
      orderDetails,
      orderData.delivery_date,
      orderData.delivery_time,
      orderData.order_type
    );

    // Notification WebSocket
    notifyAdmins('new_order', {
      order: {
        id: orderId,
        order_type: orderData.order_type,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        total_amount: total,
        delivery_address: orderData.delivery_address,
        delivery_date: orderData.delivery_date,
        delivery_time: orderData.delivery_time,
        items_count: orderDetails.length,
        payment_method: 'stripe'
      }
    });

    return { orderId, total };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = router;
module.exports.createOrderFromStripe = createOrderFromStripe;