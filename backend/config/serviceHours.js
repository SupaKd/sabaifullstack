// ===== config/serviceHours.js =====

const { getPool } = require('./database');

/**
 * Helper pour la gestion des heures de service
 * Contient toute la logique métier pour les horaires, fermetures et paramètres
 */

/**
 * Récupère toutes les plages horaires de la semaine
 */
async function getAllHours() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, day_of_week, opening_time, closing_time, is_active, updated_at
     FROM service_hours 
     ORDER BY day_of_week`
  );
  return rows;
}

/**
 * Met à jour les heures pour un jour spécifique
 */
async function updateDayHours(dayOfWeek, openingTime, closingTime, isActive) {
  const pool = getPool();
  const [result] = await pool.query(
    `UPDATE service_hours 
     SET opening_time = ?, closing_time = ?, is_active = ?
     WHERE day_of_week = ?`,
    [openingTime, closingTime, isActive, dayOfWeek]
  );
  return result.affectedRows > 0;
}

/**
 * Vérifie si le service est ouvert à un moment donné
 */
async function isServiceOpen(datetime = new Date()) {
  const pool = getPool();
  
  // Vérifier les paramètres globaux
  const [settings] = await pool.query(
    `SELECT setting_value FROM service_settings WHERE setting_key = 'service_enabled'`
  );
  
  if (settings.length === 0 || settings[0].setting_value !== 'true') {
    return { open: false, reason: 'Service désactivé' };
  }

  const dayOfWeek = datetime.getDay();
  const currentTime = datetime.toTimeString().slice(0, 8);
  const currentDate = datetime.toISOString().slice(0, 10);

  // Vérifier les fermetures exceptionnelles
  const [closures] = await pool.query(
    `SELECT * FROM service_closures 
     WHERE closure_date = ? AND (
       is_all_day = TRUE OR 
       (? BETWEEN start_time AND end_time)
     )`,
    [currentDate, currentTime]
  );

  if (closures.length > 0) {
    return { 
      open: false, 
      reason: closures[0].reason || 'Fermeture exceptionnelle' 
    };
  }

  // Vérifier les heures normales
  const [hours] = await pool.query(
    `SELECT opening_time, closing_time, is_active 
     FROM service_hours 
     WHERE day_of_week = ?`,
    [dayOfWeek]
  );

  if (hours.length === 0 || !hours[0].is_active) {
    return { open: false, reason: 'Fermé aujourd\'hui' };
  }

  const { opening_time, closing_time } = hours[0];
  
  if (currentTime >= opening_time && currentTime <= closing_time) {
    return { 
      open: true, 
      opening_time, 
      closing_time,
      day_of_week: dayOfWeek
    };
  }

  return { 
    open: false, 
    reason: 'Hors des heures d\'ouverture',
    opening_time,
    closing_time
  };
}

/**
 * Récupère toutes les fermetures exceptionnelles à venir
 */
async function getUpcomingClosures() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT * FROM service_closures 
     WHERE closure_date >= CURDATE() 
     ORDER BY closure_date`
  );
  return rows;
}

/**
 * Ajoute une fermeture exceptionnelle
 */
async function addClosure(closureDate, reason, isAllDay = true, startTime = null, endTime = null) {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO service_closures 
     (closure_date, reason, is_all_day, start_time, end_time)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
     reason = VALUES(reason),
     is_all_day = VALUES(is_all_day),
     start_time = VALUES(start_time),
     end_time = VALUES(end_time)`,
    [closureDate, reason, isAllDay, startTime, endTime]
  );
  return result.insertId || result.affectedRows > 0;
}

/**
 * Supprime une fermeture exceptionnelle
 */
async function removeClosure(id) {
  const pool = getPool();
  const [result] = await pool.query(
    `DELETE FROM service_closures WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Récupère tous les paramètres du service
 */
async function getSettings() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT setting_key, setting_value, description 
     FROM service_settings`
  );
  
  // Convertir en objet clé-valeur
  const settings = {};
  rows.forEach(row => {
    settings[row.setting_key] = row.setting_value;
  });
  
  return settings;
}

/**
 * Met à jour un paramètre du service
 */
async function updateSetting(key, value) {
  const pool = getPool();
  const [result] = await pool.query(
    `UPDATE service_settings 
     SET setting_value = ? 
     WHERE setting_key = ?`,
    [value, key]
  );
  return result.affectedRows > 0;
}

/**
 * Calcule le prochain créneau de livraison disponible
 */
async function getNextAvailableSlot(fromDatetime = new Date()) {
  const pool = getPool();
  
  // Récupérer le temps de préparation
  const [settings] = await pool.query(
    `SELECT setting_value FROM service_settings 
     WHERE setting_key = 'preparation_time_minutes'`
  );
  
  const prepTime = parseInt(settings[0]?.setting_value || 30);
  
  // Calculer le point de départ (maintenant + temps de préparation)
  const checkDate = new Date(fromDatetime);
  checkDate.setMinutes(checkDate.getMinutes() + prepTime);
  
  // Vérifier jusqu'à 7 jours dans le futur
  for (let i = 0; i < 7; i++) {
    const status = await isServiceOpen(checkDate);
    
    if (status.open) {
      return {
        available: true,
        datetime: checkDate,
        preparation_time: prepTime
      };
    }
    
    // Passer au jour suivant à l'heure d'ouverture
    checkDate.setDate(checkDate.getDate() + 1);
    checkDate.setHours(11, 0, 0, 0); // Heure d'ouverture par défaut
  }
  
  return {
    available: false,
    reason: 'Aucun créneau disponible dans les 7 prochains jours'
  };
}

module.exports = {
  getAllHours,
  updateDayHours,
  isServiceOpen,
  getUpcomingClosures,
  addClosure,
  removeClosure,
  getSettings,
  updateSetting,
  getNextAvailableSlot
};