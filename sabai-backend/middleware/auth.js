// ===== middleware/auth.js =====
const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT
 * Vérifie le token dans le header Authorization
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token d\'authentification manquant' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_a_changer');
    req.user = decoded; // Ajoute les infos user à la requête
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      error: 'Token invalide ou expiré' 
    });
  }
}

/**
 * Middleware pour vérifier le rôle admin
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      error: 'Accès réservé aux administrateurs' 
    });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };