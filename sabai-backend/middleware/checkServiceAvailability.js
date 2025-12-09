// ===== middleware/checkServiceAvailability.js =====

const serviceHoursHelper = require('../config/serviceHours');

/**
 * Middleware pour vérifier si le service est disponible
 * À utiliser sur les routes de commande
 */
const checkServiceAvailability = async (req, res, next) => {
  try {
    const status = await serviceHoursHelper.isServiceOpen();
    
    if (!status.open) {
      return res.status(503).json({
        success: false,
        error: 'Service indisponible',
        reason: status.reason,
        details: {
          opening_time: status.opening_time || null,
          closing_time: status.closing_time || null
        }
      });
    }
    
    // Service ouvert, on peut continuer
    req.serviceStatus = status;
    next();
  } catch (error) {
    console.error('Erreur vérification disponibilité service:', error);
    // En cas d'erreur, on laisse passer pour ne pas bloquer le service
    next();
  }
};

/**
 * Middleware optionnel qui ajoute l'info de disponibilité sans bloquer
 */
const addServiceInfo = async (req, res, next) => {
  try {
    const status = await serviceHoursHelper.isServiceOpen();
    req.serviceStatus = status;
    next();
  } catch (error) {
    console.error('Erreur récupération info service:', error);
    next();
  }
};

module.exports = {
  checkServiceAvailability,
  addServiceInfo
};