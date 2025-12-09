// ===== middleware/rateLimiter.js =====

const rateLimit = new Map();

/**
 * Rate Limiter principal (export par défaut pour compatibilité)
 */
function rateLimiter(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!rateLimit.has(ip)) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = rateLimit.get(ip);
    
    if (now > record.resetTime) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        success: false,
        error: 'Trop de requêtes, veuillez réessayer plus tard',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
    next();
  };
}

// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimit.entries()) {
    if (now > record.resetTime) {
      rateLimit.delete(ip);
    }
  }
}, 60000);

// Export par défaut (pour compatibilité avec require('...'))
module.exports = rateLimiter;

// Exports nommés optionnels
module.exports.rateLimiter = rateLimiter;
module.exports.default = rateLimiter;