// ===== middleware/auth.js ===== (VERSION COOKIES)
const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT
 * Vérifie le token dans les cookies httpOnly
 */
function authenticateToken(req, res, next) {
  // ✅ Lire le token depuis le cookie au lieu du header
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token d\'authentification manquant',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_a_changer');
    req.user = decoded; // Ajoute les infos user à la requête
    next();
  } catch (error) {
    // Token expiré
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Session expirée',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // Token invalide
    return res.status(403).json({ 
      success: false,
      error: 'Token invalide',
      code: 'INVALID_TOKEN'
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