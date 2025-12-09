// ===== routes/orders.js ===== (VERSION ORIGINALE)
const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const { sendConfirmationEmail } = require('../config/email');
const { validateOrder } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');
const { checkServiceAvailability } = require('../middleware/checkServiceAvailability');


// --- POST /api/orders ---
router.post('/', checkServiceAvailability, rateLimiter(5, 60000), validateOrder, async (req, res, next) => {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      order_type = 'delivery',
      customer_name, 
      customer_email, 
      customer_phone, 
      delivery_address,
      delivery_date,
      delivery_time,
      items, 
      notes 
    } = req.body;

    // Vérifier si la livraison est activée
    if (order_type === 'delivery') {
      const [deliverySettings] = await connection.query(
        "SELECT setting_value FROM service_settings WHERE setting_key = 'delivery_enabled'"
      );
      
      const deliveryEnabled = deliverySettings[0]?.setting_value === 'true';
      
      if (!deliveryEnabled) {
        throw new Error('La livraison est actuellement désactivée. Veuillez choisir le retrait au restaurant.');
      }
    }

    if (!customer_name || !customer_email || !customer_phone) {
      throw new Error('Informations client incomplètes');
    }

    if (!['delivery', 'takeaway'].includes(order_type)) {
      throw new Error('Type de commande invalide. Utilisez "delivery" ou "takeaway"');
    }

    if (order_type === 'delivery' && !delivery_address) {
      throw new Error('L\'adresse de livraison est obligatoire pour une livraison');
    }

    if (!delivery_date || !delivery_time) {
      throw new Error(`La date et l'heure ${order_type === 'delivery' ? 'de livraison' : 'de retrait'} sont obligatoires`);
    }

    // Validation date/heure dans le futur (avec marge de 5 minutes)
    const deliveryDateTime = new Date(`${delivery_date}T${delivery_time}`);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    if (deliveryDateTime <= fiveMinutesAgo) {
      throw new Error(`La date et l'heure ${order_type === 'delivery' ? 'de livraison' : 'de retrait'} doivent être dans le futur`);
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(delivery_date)) {
      throw new Error('Format de date invalide. Utilisez YYYY-MM-DD');
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (!timeRegex.test(delivery_time)) {
      throw new Error('Format d\'heure invalide. Utilisez HH:MM ou HH:MM:SS');
    }

    let total = 0;
    const orderDetails = [];

    for (const item of items) {
      const [products] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? AND available = true',
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Produit ${item.product_id} non disponible`);
      }

      if (products[0].stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${products[0].name} (disponible: ${products[0].stock})`);
      }

      const itemTotal = products[0].price * item.quantity;
      total += itemTotal;

      orderDetails.push({
        product_id: products[0].id,
        name: products[0].name,
        quantity: item.quantity,
        price: products[0].price
      });
    }

    // Ajouter les frais de livraison
    let deliveryFee = 0;
    if (order_type === 'delivery') {
      const [deliverySettings] = await connection.query(
        "SELECT setting_key, setting_value FROM service_settings WHERE setting_key IN ('delivery_fee', 'delivery_min_amount')"
      );
      
      const settings = {};
      deliverySettings.forEach(s => {
        settings[s.setting_key] = parseFloat(s.setting_value);
      });
      
      const minAmount = settings.delivery_min_amount || 30;
      deliveryFee = settings.delivery_fee || 5;
      
      if (total < minAmount) {
        throw new Error(`Minimum de commande ${minAmount.toFixed(2)}€ requis pour la livraison`);
      }
      
      total += deliveryFee;
    }

    // Insertion de la commande - VERSION ORIGINALE (avec payment_status = 'paid')
    const [orderResult] = await connection.query(
      'INSERT INTO orders (order_type, customer_name, customer_email, customer_phone, delivery_address, delivery_date, delivery_time, total_amount, delivery_fee, notes, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      //                                                                                                                                      ^^^^^^^^^^^^^^                                                                 ^^
      // MODIFICATION 1 : Ajouter "delivery_fee" dans la requête                                                                                                                                                           ||
      //                                                                                                                                                                                                     MODIFICATION 2 : Ajouter un "?" de plus
      [
        order_type,
        customer_name, 
        customer_email, 
        customer_phone, 
        order_type === 'delivery' ? delivery_address : null,
        delivery_date, 
        delivery_time, 
        total, 
        deliveryFee, // ← AJOUTER CETTE LIGNE
        notes || null, 
        'paid'
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of orderDetails) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name, item.quantity, item.price]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    const actionText = order_type === 'delivery' ? 'Livraison' : 'Retrait';
    console.log(`✓ Commande #${orderId} créée pour ${customer_name} (${total.toFixed(2)}€) - ${actionText} prévu le ${delivery_date} à ${delivery_time}`);

    sendConfirmationEmail(customer_email, customer_name, orderId, total, orderDetails, delivery_date, delivery_time, order_type);

    const { notifyAdmins } = require('../config/websocket');
    notifyAdmins('new_order', {
      order_id: orderId,
      order_type,
      customer_name,
      total,
      items_count: orderDetails.length,
      delivery_date,
      delivery_time
    });

    res.status(201).json({
      success: true,
      order_id: orderId,
      order_type: order_type,
      total: total,
      delivery_date: delivery_date,
      delivery_time: delivery_time,
      message: 'Commande créée avec succès. Un email de confirmation a été envoyé.'
    });

  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// --- GET /api/orders/:id ---
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();

    const [orders] = await pool.query(
      `SELECT 
        o.*,
        DATE_FORMAT(o.delivery_date, '%Y-%m-%d') as delivery_date_formatted,
        TIME_FORMAT(o.delivery_time, '%H:%i') as delivery_time_formatted
      FROM orders o
      WHERE o.id = ?`,
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const [items] = await pool.query(`
      SELECT oi.*, p.name, p.description
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    res.json({
      order: orders[0],
      items: items
    });

  } catch (error) {
    next(error);
  }
});

// --- GET /api/admin/orders ---
router.get('/admin/orders', async (req, res, next) => {
  try {
    const pool = getPool();
    const { status, delivery_date, date_from, date_to, order_type } = req.query;

    let query = `
      SELECT 
        o.*,
        DATE_FORMAT(o.delivery_date, '%Y-%m-%d') as delivery_date_formatted,
        TIME_FORMAT(o.delivery_time, '%H:%i') as delivery_time_formatted,
        GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (order_type) {
      query += ' AND o.order_type = ?';
      params.push(order_type);
    }

    if (delivery_date) {
      query += ' AND o.delivery_date = ?';
      params.push(delivery_date);
    }

    if (date_from) {
      query += ' AND o.delivery_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND o.delivery_date <= ?';
      params.push(date_to);
    }

    query += ' GROUP BY o.id ORDER BY o.delivery_date ASC, o.delivery_time ASC';

    const [orders] = await pool.query(query, params);

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    next(error);
  }
});

// --- PUT /api/orders/:id/status ---
router.put('/:id/status', async (req, res, next) => {
  try {
    const pool = getPool();
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Statut invalide' 
      });
    }

    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Commande non trouvée' 
      });
    }

    const { notifyAdmins } = require('../config/websocket');
    notifyAdmins('order_status_updated', {
      order_id: parseInt(req.params.id),
      new_status: status
    });

    res.json({
      success: true,
      message: 'Statut mis à jour'
    });

  } catch (error) {
    next(error);
  }
});

// --- GET /api/orders/stats/by-timeslot ---
router.get('/stats/by-timeslot', async (req, res, next) => {
  try {
    const pool = getPool();
    const { date_from, date_to, order_type } = req.query;

    let query = `
      SELECT 
        DATE_FORMAT(delivery_date, '%Y-%m-%d') as date,
        TIME_FORMAT(delivery_time, '%H:%i') as time_slot,
        order_type,
        COUNT(*) as order_count,
        SUM(total_amount) as total_revenue
      FROM orders
      WHERE 1=1
    `;

    const params = [];

    if (date_from) {
      query += ' AND delivery_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      query += ' AND delivery_date <= ?';
      params.push(date_to);
    }

    if (order_type) {
      query += ' AND order_type = ?';
      params.push(order_type);
    }

    query += ' GROUP BY date, time_slot, order_type ORDER BY date ASC, time_slot ASC';

    const [stats] = await pool.query(query, params);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    next(error);
  }
});

// ===== À AJOUTER À LA FIN de routes/orders.js =====

// Fonction réutilisable pour créer une commande (appelée par Stripe)
async function createOrderFromStripe(orderData) {
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // (Même logique que dans POST / mais sans les validations de service)
    
    let total = 0;
    const orderDetails = [];

    for (const item of orderData.items) {
      const [products] = await connection.query(
        'SELECT id, name, price, stock FROM products WHERE id = ? AND available = true',
        [item.product_id]
      );

      if (products.length === 0) {
        throw new Error(`Produit ${item.product_id} non disponible`);
      }

      if (products[0].stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${products[0].name}`);
      }

      const itemTotal = products[0].price * item.quantity;
      total += itemTotal;

      orderDetails.push({
        product_id: products[0].id,
        name: products[0].name,
        quantity: item.quantity,
        price: products[0].price
      });
    }

    let deliveryFee = 0;
    if (orderData.order_type === 'delivery') {
      const [deliverySettings] = await connection.query(
        "SELECT setting_value FROM service_settings WHERE setting_key = 'delivery_fee'"
      );
      deliveryFee = deliverySettings[0] ? parseFloat(deliverySettings[0].setting_value) : 5;
      total += deliveryFee;
    }

    const [orderResult] = await connection.query(
      'INSERT INTO orders (order_type, customer_name, customer_email, customer_phone, delivery_address, delivery_date, delivery_time, total_amount, delivery_fee, notes, payment_status, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        orderData.order_type,
        orderData.customer_name, 
        orderData.customer_email, 
        orderData.customer_phone, 
        orderData.delivery_address || null,
        orderData.delivery_date, 
        orderData.delivery_time, 
        total,
        deliveryFee,
        orderData.notes || null, 
        orderData.payment_status || 'paid',
        orderData.payment_method || 'card'
      ]
    );

    const orderId = orderResult.insertId;

    for (const item of orderDetails) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name, item.quantity, item.price]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();

    console.log(`✓ Commande #${orderId} créée via Stripe`);

    // Envoyer email
    sendConfirmationEmail(orderData.customer_email, orderData.customer_name, orderId, total, orderDetails, orderData.delivery_date, orderData.delivery_time, orderData.order_type);

    // Notifier WebSocket
    const { notifyAdmins } = require('../config/websocket');
    notifyAdmins('new_order', {
      order_id: orderId,
      order_type: orderData.order_type,
      customer_name: orderData.customer_name,
      total,
      items_count: orderDetails.length,
      delivery_date: orderData.delivery_date,
      delivery_time: orderData.delivery_time
    });

    return { orderId, total };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Exporter la fonction
module.exports.createOrderFromStripe = createOrderFromStripe;

module.exports = router;