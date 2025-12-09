// ===== middleware/errorHandler.js =====

/**
 * Classe personnalisée pour les erreurs métier
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Logger les erreurs
 */
function logError(err, req) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: {
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  console.error('❌ ERROR:', JSON.stringify(errorLog, null, 2));
}

/**
 * Middleware de gestion des erreurs global
 */
function errorHandler(err, req, res, next) {
  logError(err, req);

  // Erreur MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ 
      success: false,
      error: 'Cette entrée existe déjà',
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ 
      success: false,
      error: 'Référence invalide',
      code: 'INVALID_REFERENCE'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      success: false,
      error: 'Service de base de données indisponible',
      code: 'DB_CONNECTION_FAILED'
    });
  }

  // Erreur JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false,
      error: 'Session expirée, veuillez vous reconnecter',
      code: 'TOKEN_EXPIRED'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      error: 'Token d\'authentification invalide',
      code: 'TOKEN_INVALID'
    });
  }

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false,
      error: err.message,
      code: 'VALIDATION_ERROR',
      details: err.details || []
    });
  }

  // Erreur Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        error: 'Fichier trop volumineux (max 5MB)',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({ 
      success: false,
      error: 'Erreur lors de l\'upload',
      code: 'UPLOAD_ERROR'
    });
  }

  // Erreur personnalisée AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }

  // Erreur générique
  res.status(err.statusCode || 500).json({ 
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Une erreur est survenue',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * Helper pour attraper les erreurs async
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware pour les routes non trouvées (404)
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} non trouvée`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
}

module.exports = { 
  errorHandler, 
  AppError, 
  asyncHandler,
  notFoundHandler 
};