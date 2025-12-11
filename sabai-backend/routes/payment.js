// ===== routes/payment.js ===== (VERSION CORRIGÉE - ANTI-DOUBLON)
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getPool } = require('../config/database');
const { sendConfirmationEmail } = require('../config/email');

// Créer une session de paiement Stripe
router.post('/create-checkout-session', async (req, res) => {
  try {
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
      total_amount,
      delivery_fee
    } = req.body;

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customer_email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Commande Sabai - ${order_type === 'delivery' ? 'Livraison' : 'À emporter'}`,
              description: `${items.length} produit(s) - ${delivery_date} à ${delivery_time}`,
            },
            unit_amount: Math.round(total_amount * 100), // Convertir en centimes
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout?cancelled=true`,
      metadata: {
        order_type,
        customer_name,
        customer_phone,
        delivery_address: delivery_address || '',
        delivery_date,
        delivery_time,
        notes: notes || '',
        items: JSON.stringify(items),
        delivery_fee: delivery_fee.toString()
      },
    });

    res.json({ 
      success: true,
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ✅ Vérifier le paiement et créer la commande
router.post('/verify-payment', async (req, res) => {
  const { session_id } = req.body;

  // ✅ Validation
  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'Session ID manquant'
    });
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    // Récupérer la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Paiement non confirmé'
      });
    }

    // ✅ VÉRIFICATION ANTI-DOUBLON via payment_session_id
    const [existing] = await connection.query(
      'SELECT id, total_amount FROM orders WHERE payment_session_id = ?',
      [session_id]
    );

    if (existing.length > 0) {
      console.log(`⚠️ Commande #${existing[0].id} déjà créée pour session ${session_id}`);
      return res.json({
        success: true,
        order_id: existing[0].id,
        total: parseFloat(existing[0].total_amount).toFixed(2),
        message: 'Commande déjà créée'
      });
    }

    await connection.beginTransaction();

    // Récupérer les données
    const metadata = session.metadata;
    const items = JSON.parse(metadata.items);

    // ✅ CALCULER LE TOTAL ET VÉRIFIER LES STOCKS
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

    const deliveryFee = parseFloat(metadata.delivery_fee);
    total += deliveryFee;

    // ✅ CRÉER LA COMMANDE avec payment_session_id
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        order_type, 
        customer_name, 
        customer_email, 
        customer_phone, 
        delivery_address, 
        delivery_date, 
        delivery_time, 
        total_amount, 
        delivery_fee, 
        notes, 
        payment_status, 
        payment_method,
        payment_session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.order_type,
        metadata.customer_name,
        session.customer_email,
        metadata.customer_phone,
        metadata.delivery_address || null,
        metadata.delivery_date,
        metadata.delivery_time,
        total,
        deliveryFee,
        metadata.notes || null,
        'paid',
        'card',
        session_id // ✅ IMPORTANT - Empêche les doublons
      ]
    );

    const orderId = orderResult.insertId;

    // ✅ CRÉER LES ORDER_ITEMS ET DÉCRÉMENTER LE STOCK
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

    console.log(`✓ Commande #${orderId} créée via Stripe (${total.toFixed(2)}€)`);

    // ✅ ENVOYER L'EMAIL DE CONFIRMATION
    try {
      sendConfirmationEmail(
        session.customer_email,
        metadata.customer_name,
        orderId,
        total,
        orderDetails,
        metadata.delivery_date,
        metadata.delivery_time,
        metadata.order_type
      );
    } catch (err) {
      console.error('⚠️ Erreur email:', err);
      // Ne pas bloquer si l'email échoue
    }

    // ✅ NOTIFIER WEBSOCKET
    try {
      const { notifyAdmins } = require('../config/websocket');
      notifyAdmins('new_order', {
        order_id: orderId,
        order_type: metadata.order_type,
        customer_name: metadata.customer_name,
        total,
        items_count: orderDetails.length,
        delivery_date: metadata.delivery_date,
        delivery_time: metadata.delivery_time
      });
    } catch (err) {
      console.error('⚠️ Erreur WebSocket:', err);
      // Ne pas bloquer si WebSocket échoue
    }

    res.json({
      success: true,
      order_id: orderId,
      total: total.toFixed(2),
      message: 'Paiement confirmé et commande créée'
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur vérification paiement:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
  }
});

module.exports = router;