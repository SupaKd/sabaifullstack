// ===== routes/serviceHours.js =====

const express = require('express');
const router = express.Router();
const serviceHoursHelper = require('../config/serviceHours');
const { getPool } = require('../config/database');

/**
 * GET /api/service-hours
 * Récupère toutes les plages horaires de la semaine
 */
router.get('/', async (req, res, next) => {
  try {
    const hours = await serviceHoursHelper.getAllHours();
    
    // Ajouter les noms de jours pour faciliter l'affichage
    const daysNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const formattedHours = hours.map(h => ({
      ...h,
      day_name: daysNames[h.day_of_week]
    }));
    
    res.json({ success: true, data: formattedHours });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/service-hours/status
 * Vérifie si le service est actuellement ouvert
 */
router.get('/status', async (req, res, next) => {
  try {
    const status = await serviceHoursHelper.isServiceOpen();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/service-hours/delivery-status
 * NOUVEAU : Vérifie si la livraison est activée
 */
router.get('/delivery-status', async (req, res) => {
  try {
    const pool = getPool();
    
    // Vérifier le statut global du service
    const [serviceSettings] = await pool.query(
      "SELECT setting_value FROM service_settings WHERE setting_key = 'service_enabled'"
    );
    
    // Vérifier le statut de la livraison
    const [deliverySettings] = await pool.query(
      "SELECT setting_value FROM service_settings WHERE setting_key = 'delivery_enabled'"
    );

    const serviceEnabled = serviceSettings[0]?.setting_value === 'true';
    const deliveryEnabled = deliverySettings[0]?.setting_value === 'true';

    res.json({
      success: true,
      data: {
        service_enabled: serviceEnabled,
        delivery_enabled: deliveryEnabled,
        // La livraison est disponible si le service ET la livraison sont activés
        delivery_available: serviceEnabled && deliveryEnabled
      }
    });
  } catch (error) {
    console.error('Erreur récupération statut livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/service-hours/next-slot
 * Récupère le prochain créneau de livraison disponible
 */
router.get('/next-slot', async (req, res, next) => {
  try {
    const slot = await serviceHoursHelper.getNextAvailableSlot();
    res.json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/service-hours/:dayOfWeek
 * Met à jour les heures pour un jour spécifique
 * Body: { opening_time, closing_time, is_active }
 */
router.put('/:dayOfWeek', async (req, res, next) => {
  try {
    const { dayOfWeek } = req.params;
    const { opening_time, closing_time, is_active } = req.body;
    
    // Validation
    const day = parseInt(dayOfWeek);
    if (isNaN(day) || day < 0 || day > 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Jour invalide (0-6)' 
      });
    }
    
    if (!opening_time || !closing_time) {
      return res.status(400).json({ 
        success: false, 
        error: 'Heures d\'ouverture et de fermeture requises' 
      });
    }
    
    // Validation du format d'heure (HH:MM ou HH:MM:SS)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (!timeRegex.test(opening_time) || !timeRegex.test(closing_time)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Format d\'heure invalide (utilisez HH:MM)' 
      });
    }
    
    const success = await serviceHoursHelper.updateDayHours(
      day, 
      opening_time, 
      closing_time, 
      is_active !== false
    );
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Heures mises à jour avec succès' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Jour non trouvé' 
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/service-hours/closures
 * Récupère toutes les fermetures exceptionnelles à venir
 */
router.get('/closures', async (req, res, next) => {
  try {
    const closures = await serviceHoursHelper.getUpcomingClosures();
    res.json({ success: true, data: closures });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/service-hours/closures
 * Ajoute une fermeture exceptionnelle
 * Body: { closure_date, reason, is_all_day, start_time, end_time }
 */
router.post('/closures', async (req, res, next) => {
  try {
    const { closure_date, reason, is_all_day, start_time, end_time } = req.body;
    
    if (!closure_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Date de fermeture requise' 
      });
    }
    
    // Validation de la date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(closure_date)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Format de date invalide (utilisez YYYY-MM-DD)' 
      });
    }
    
    const result = await serviceHoursHelper.addClosure(
      closure_date, 
      reason || 'Fermeture exceptionnelle', 
      is_all_day !== false,
      start_time || null,
      end_time || null
    );
    
    if (result) {
      res.status(201).json({ 
        success: true, 
        message: 'Fermeture ajoutée avec succès' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de l\'ajout de la fermeture' 
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/service-hours/closures/:id
 * Supprime une fermeture exceptionnelle
 */
router.delete('/closures/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const success = await serviceHoursHelper.removeClosure(id);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Fermeture supprimée avec succès' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Fermeture non trouvée' 
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/service-hours/settings
 * Récupère tous les paramètres du service
 */
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await serviceHoursHelper.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/service-hours/settings/delivery_enabled
 * NOUVEAU : Met à jour spécifiquement le paramètre delivery_enabled
 * IMPORTANT : Cette route doit être AVANT /settings/:key
 */
router.put('/settings/delivery_enabled', async (req, res) => {
  try {
    const pool = getPool();
    const { value } = req.body;

    if (!['true', 'false'].includes(value)) {
      return res.status(400).json({
        success: false,
        message: 'Valeur invalide (true ou false)'
      });
    }

    await pool.query(
      "UPDATE service_settings SET setting_value = ? WHERE setting_key = 'delivery_enabled'",
      [value]
    );

    res.json({
      success: true,
      message: `Livraison ${value === 'true' ? 'activée' : 'désactivée'}`,
      data: { delivery_enabled: value }
    });
  } catch (error) {
    console.error('Erreur mise à jour delivery_enabled:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * PUT /api/service-hours/settings/:key
 * Met à jour un paramètre du service (route générique)
 * Body: { value }
 */
router.put('/settings/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valeur requise' 
      });
    }
    
    const success = await serviceHoursHelper.updateSetting(key, value.toString());
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Paramètre mis à jour avec succès' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Paramètre non trouvé' 
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;