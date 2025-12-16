// ===== middleware/auth.js ===== (VERSION SÉCURISÉE - COOKIES)
const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT - LIT LE TOKEN DEPUIS LES COOKIES
 * ✅ Sécurisé contre XSS (token inaccessible en JavaScript)
 */
function authenticateToken(req, res, next) {
  // ✅ NOUVEAU : Lire le token depuis les cookies au lieu du header
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
    // Gestion des erreurs JWT
    if (error.name === 'TokenExpiredError') {
      // ✅ Supprimer le cookie expiré
      res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      return res.status(401).json({ 
        success: false,
        error: 'Session expirée, veuillez vous reconnecter',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(403).json({ 
      success: false,
      error: 'Token invalide',
      code: 'TOKEN_INVALID'
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
      error: 'Accès réservé aux administrateurs',
      code: 'FORBIDDEN'
    });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin };