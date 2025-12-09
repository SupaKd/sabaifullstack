// ===== routes/admin.js ===== (VERSION AMÉLIORÉE)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');
const { sendOrderStatusEmail } = require('../config/email');
const { validateProductStock, validateOrderStatus } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_a_changer';
const JWT_EXPIRES_IN = '24h'; // Token valide 24h

/* =====================================================
   ADMIN LOGIN - Génère un JWT
===================================================== */
router.post('/login', async (req, res, next) => {
  try {
    const pool = getPool();
    const { username, password } = req.body;

    console.log('=== TENTATIVE DE CONNEXION ===');

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Username et password requis' 
      });
    }

    // Cherche l'utilisateur admin
    const [users] = await pool.query(
      'SELECT * FROM admin_users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Identifiants incorrects' 
      });
    }

    // Vérifie le mot de passe
    const valid = await bcrypt.compare(password, users[0].password_hash);

    if (!valid) {
      return res.status(401).json({ 
        success: false,
        error: 'Identifiants incorrects' 
      });
    }

    // ✨ NOUVEAU : Génération du JWT
    const token = jwt.sign(
      { 
        id: users[0].id, 
        username: users[0].username,
        role: 'admin'
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Mise à jour last_login
    await pool.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [users[0].id]
    );

    console.log(`✓ Connexion réussie pour ${username}`);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token: token, // ✨ Token JWT à stocker côté client
      user: { 
        id: users[0].id, 
        username: users[0].username 
      },
      expiresIn: JWT_EXPIRES_IN
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   ADMIN LOGOUT - Optionnel (côté client supprime le token)
===================================================== */
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

/* =====================================================
   VÉRIFIER TOKEN - Endpoint pour valider un token existant
===================================================== */
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    valid: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

/* =====================================================
   🔒 TOUTES LES ROUTES CI-DESSOUS NÉCESSITENT L'AUTHENTIFICATION
===================================================== */

/* =====================================================
   COMMANDES - Liste
===================================================== */
router.get('/orders', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT o.*, 
        GROUP_CONCAT(
          CONCAT(p.name, ' (x', oi.quantity, ')')
        SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const [orders] = await pool.query(query, params);
    res.json({ success: true, data: orders });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   COMMANDES - Détail
===================================================== */
router.get('/orders/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [req.params.id]
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
    `, [req.params.id]);

    res.json({ 
      success: true,
      data: { order: orders[0], items }
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   COMMANDES - Changer le statut
===================================================== */
router.patch('/orders/:id/status', authenticateToken, requireAdmin, validateOrderStatus, async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { status } = req.body;

    const [orders] = await pool.query(
      'SELECT customer_email, customer_name FROM orders WHERE id = ?',
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Commande non trouvée' 
      });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // Envoi email client
    sendOrderStatusEmail(
      orders[0].customer_email,
      orders[0].customer_name,
      id,
      status
    );

    // ✨ Notification WebSocket
    const { notifyClient } = require('../config/websocket');
    notifyClient(parseInt(id), 'order_status_updated', {
      order_id: parseInt(id),
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

/* =====================================================
   PRODUITS - Liste
===================================================== */
router.get('/products', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();

    const [products] = await pool.query(
      'SELECT * FROM products ORDER BY category, name'
    );

    res.json({ success: true, data: products });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   PRODUITS - Mettre à jour le stock
===================================================== */
router.patch('/products/:id/stock', authenticateToken, requireAdmin, validateProductStock, async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { stock } = req.body;

    await pool.query(
      'UPDATE products SET stock = ? WHERE id = ?',
      [stock, id]
    );

    res.json({ 
      success: true, 
      message: 'Stock mis à jour' 
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   PRODUITS - Changer disponibilité
===================================================== */
router.patch('/products/:id/availability', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { available } = req.body;

    await pool.query(
      'UPDATE products SET available = ? WHERE id = ?',
      [available, id]
    );

    res.json({ 
      success: true, 
      message: 'Disponibilité mise à jour' 
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   PRODUITS - Ajouter
===================================================== */
router.post('/products', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();
    const { name, description, price, stock, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ 
        success: false,
        error: 'Nom, prix et catégorie requis' 
      });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, price, stock || 0, category]
    );

    res.status(201).json({
      success: true,
      product_id: result.insertId,
      message: 'Produit créé avec succès'
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   PRODUITS - Modifier
===================================================== */
router.patch('/products/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    const { name, description, price, stock, category, available } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (available !== undefined) { updates.push('available = ?'); values.push(available); }

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucune modification fournie' 
      });
    }

    values.push(id);

    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ 
      success: true, 
      message: 'Produit modifié avec succès' 
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   PRODUITS - Supprimer
===================================================== */
router.delete('/products/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { deleteImage } = require('../middleware/upload');

    const [products] = await pool.query(
      'SELECT image_url FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Produit non trouvé' 
      });
    }

    await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (products[0].image_url) {
      deleteImage(products[0].image_url);
    }

    res.json({ 
      success: true, 
      message: 'Produit supprimé avec succès' 
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   PRODUITS - Upload image
===================================================== */
router.post('/products/:id/image', authenticateToken, requireAdmin, async (req, res, next) => {
  const { upload, deleteImage } = require('../middleware/upload');

  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false,
          error: 'Fichier trop volumineux (max 5MB)' 
        });
      }
      return res.status(400).json({ 
        success: false,
        error: err.message 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucun fichier fourni' 
      });
    }

    try {
      const pool = getPool();
      const { id } = req.params;

      const [products] = await pool.query(
        'SELECT image_url FROM products WHERE id = ?',
        [id]
      );

      if (products.length === 0) {
        deleteImage(req.file.filename);
        return res.status(404).json({ 
          success: false,
          error: 'Produit non trouvé' 
        });
      }

      const imageUrl = `/uploads/products/${req.file.filename}`;

      await pool.query(
        'UPDATE products SET image_url = ? WHERE id = ?',
        [imageUrl, id]
      );

      if (products[0].image_url) {
        deleteImage(products[0].image_url);
      }

      res.json({
        success: true,
        image_url: imageUrl,
        message: 'Image uploadée avec succès'
      });

    } catch (error) {
      deleteImage(req.file.filename);
      next(error);
    }
  });
});

/* =====================================================
   PRODUITS - Supprimer image
===================================================== */
router.delete('/products/:id/image', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { deleteImage } = require('../middleware/upload');

    const [products] = await pool.query(
      'SELECT image_url FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Produit non trouvé' 
      });
    }

    if (!products[0].image_url) {
      return res.status(400).json({ 
        success: false,
        error: 'Aucune image à supprimer' 
      });
    }

    deleteImage(products[0].image_url);

    await pool.query(
      'UPDATE products SET image_url = NULL WHERE id = ?',
      [id]
    );

    res.json({ 
      success: true, 
      message: 'Image supprimée avec succès' 
    });

  } catch (error) {
    next(error);
  }
});

/* =====================================================
   STATS - Dashboard
===================================================== */
router.get('/stats', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const pool = getPool();

    // Stats commandes du jour
    const [orderStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
        SUM(CASE WHEN status = 'delivering' THEN 1 ELSE 0 END) as delivering_orders,
        SUM(total_amount) as total_revenue
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);

    // Stats produits
    const [productStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN stock < 10 THEN 1 ELSE 0 END) as low_stock_products,
        SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM products
      WHERE available = true
    `);

    // Meilleures ventes du jour
    const [topProducts] = await pool.query(`
      SELECT p.name, SUM(oi.quantity) as total_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = CURDATE()
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        today: {
          orders: orderStats[0].total_orders,
          pending: orderStats[0].pending_orders,
          confirmed: orderStats[0].confirmed_orders,
          preparing: orderStats[0].preparing_orders,
          delivering: orderStats[0].delivering_orders,
          revenue: orderStats[0].total_revenue || 0
        },
        products: {
          total: productStats[0].total_products,
          low_stock: productStats[0].low_stock_products,
          out_of_stock: productStats[0].out_of_stock
        },
        top_products: topProducts
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;