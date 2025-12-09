// ===== routes/products.js =====
const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

// --- GET /api/products ---
// Récupère tous les produits disponibles.
// Option : filtrage par catégorie via ?category=sushis
router.get('/', async (req, res, next) => {
  try {
    const pool = getPool();
    const { category } = req.query; // filtre optionnel

    // Base de la requête SQL : uniquement les produits disponibles
    let query = 'SELECT * FROM products WHERE available = true';
    const params = [];

    // Ajout du filtre catégorie si présent
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Tri par catégorie puis nom (présentation plus propre)
    query += ' ORDER BY category, name';

    const [products] = await pool.query(query, params);
    res.json(products);
  } catch (error) {
    next(error); // passe au middleware d'erreurs
  }
});

// --- GET /api/products/categories ---
// Récupère uniquement la liste des catégories disponibles.
// Exemple de réponse : ["sushi", "ramen", "desserts"]
router.get('/categories', async (req, res, next) => {
  try {
    const pool = getPool();

    const [categories] = await pool.query(
      'SELECT DISTINCT category FROM products WHERE available = true ORDER BY category'
    );

    // On renvoie uniquement les noms sous forme de tableau simple
    res.json(categories.map(c => c.category));
  } catch (error) {
    next(error);
  }
});

// --- GET /api/products/:id ---
// Récupère un produit précis par son ID.
router.get('/:id', async (req, res, next) => {
  try {
    const pool = getPool();
    
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    // Aucun produit trouvé -> 404
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json(products[0]); // renvoie le produit unique
  } catch (error) {
    next(error);
  }
});

module.exports = router;
