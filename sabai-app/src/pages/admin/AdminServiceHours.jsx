import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Configuration des constantes
const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api/service-hours',
  ENDPOINTS: {
    HOURS: '',
    CLOSURES: '/closures',
    SETTINGS: '/settings',
    CLOSURE_DETAIL: (id) => `/closures/${id}`,
    DAY_DETAIL: (dayOfWeek) => `/${dayOfWeek}`,
    SETTING_DETAIL: (key) => `/settings/${key}`,
  }
};

const DAYS_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const INITIAL_CLOSURE_STATE = {
  closure_date: '',
  reason: '',
  is_all_day: true,
  start_time: '',
  end_time: ''
};

/**
 * Composant de gestion des horaires de service et des fermetures
 * Permet de configurer les horaires d'ouverture, les fermetures exceptionnelles
 * et les paramètres de disponibilité
 */
const AdminServiceHours = () => {
  // États principaux
  const [hours, setHours] = useState([]);
  const [closures, setClosures] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [newClosure, setNewClosure] = useState(INITIAL_CLOSURE_STATE);

  /**
   * Initialisation du composant au montage
   */
  useEffect(() => {
    loadAllData();
  }, []);

  /**
   * Charge toutes les données nécessaires en parallèle
   */
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        loadHours(),
        loadClosures(),
        loadSettings()
      ]);
    } catch (error) {
      handleError('Erreur lors du chargement des données', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les horaires hebdomadaires
   */
  const loadHours = async () => {
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.HOURS);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setHours(data.data);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des horaires');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des horaires:', error);
      throw error;
    }
  };

  /**
   * Charge la liste des fermetures exceptionnelles
   */
  const loadClosures = async () => {
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CLOSURES);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setClosures(data.data);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des fermetures');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fermetures:', error);
      throw error;
    }
  };

  /**
   * Charge les paramètres de service
   */
  const loadSettings = async () => {
    try {
      const response = await fetch(API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SETTINGS);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des paramètres');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      throw error;
    }
  };

  /**
   * Met à jour les horaires d'un jour spécifique
   * @param {number} dayOfWeek - Numéro du jour (0-6)
   * @param {string} openingTime - Heure d'ouverture (HH:MM)
   * @param {string} closingTime - Heure de fermeture (HH:MM)
   * @param {boolean} isActive - Si le jour est actif
   */
  const updateDayHours = async (dayOfWeek, openingTime, closingTime, isActive) => {
    try {
      const response = await fetch(
        API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.DAY_DETAIL(dayOfWeek),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            opening_time: openingTime,
            closing_time: closingTime,
            is_active: isActive
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Horaires mis à jour avec succès');
        await loadHours();
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      handleError('Erreur lors de la mise à jour des horaires', error);
    }
  };

  /**
   * Bascule l'état d'un jour (ouvert/fermé)
   * @param {Object} day - Objet jour
   */
  const toggleDay = async (day) => {
    await updateDayHours(
      day.day_of_week,
      day.opening_time,
      day.closing_time,
      !day.is_active
    );
  };

  /**
   * Ajoute une nouvelle fermeture exceptionnelle
   * @param {Event} e - Événement de soumission du formulaire
   */
  const addClosure = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(
        API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CLOSURES,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newClosure)
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Fermeture ajoutée avec succès');
        await loadClosures();
        setNewClosure(INITIAL_CLOSURE_STATE);
      } else {
        setError(data.error || 'Erreur lors de l\'ajout de la fermeture');
      }
    } catch (error) {
      handleError('Erreur lors de l\'ajout de la fermeture', error);
    }
  };

  /**
   * Supprime une fermeture exceptionnelle
   * @param {number} id - ID de la fermeture
   */
  const deleteClosure = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette fermeture ?')) {
      return;
    }

    try {
      const response = await fetch(
        API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.CLOSURE_DETAIL(id),
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Fermeture supprimée avec succès');
        await loadClosures();
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      handleError('Erreur lors de la suppression de la fermeture', error);
    }
  };

  /**
   * Met à jour un paramètre de service
   * @param {string} key - Clé du paramètre
   * @param {string|boolean} value - Nouvelle valeur
   */
  const updateSetting = async (key, value) => {
    try {
      const response = await fetch(
        API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS.SETTING_DETAIL(key),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: value.toString() })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        showSuccess('Paramètre mis à jour avec succès');
        await loadSettings();
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      handleError('Erreur lors de la mise à jour du paramètre', error);
    }
  };

  /**
   * Gère les erreurs de manière centralisée
   * @param {string} userMessage - Message affiché à l'utilisateur
   * @param {Error} error - Erreur originale
   */
  const handleError = (userMessage, error) => {
    setError(userMessage);
    console.error(userMessage, error);
  };

  /**
   * Affiche un message de succès temporaire
   * @param {string} message - Message de succès
   */
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  /**
   * Formate une date pour l'affichage
   * @param {string} dateString - Date au format ISO
   * @returns {string} Date formatée
   */
  const formatClosureDate = useCallback((dateString) => {
    const date = new Date(dateString);
    
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, []);

  // Afficher l'état de chargement
  if (loading) {
    return (
      <div className="container">
        <div className="loading">Chargement des horaires...</div>
      </div>
    );
  }

  return (
    <div className="admin-service-hours">
      {/* En-tête de la page */}
      <div className="admin-service-hours__header">
        <div className="admin-service-hours__header-left">
          <Link to="/admin" className="btn-back" title="Retour au dashboard">
            ← Retour au dashboard
          </Link>
          <h1 className="admin-service-hours__title">
            📅 Gestion des horaires et fermetures
          </h1>
        </div>
      </div>

      {/* Messages de feedback */}
      {successMessage && (
        <div className="alert alert--success" role="alert">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="alert alert--error" role="alert">
          <div className="alert__content">
            <span className="alert__message">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="alert__close"
              aria-label="Fermer l'alerte"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal en deux colonnes */}
      <div className="service-hours-layout">
        {/* Colonne principale - Horaires hebdomadaires */}
        <div className="service-hours-main">
          <div className="service-section">
            <div className="service-section__header">
              <h2 className="service-section__title">
                📅 Horaires hebdomadaires
              </h2>
              <p className="service-section__subtitle">
                Configurez les horaires d'ouverture pour chaque jour de la semaine
              </p>
            </div>
            
            <div className="weekly-hours-table">
              <table className="hours-table">
                <thead>
                  <tr>
                    <th scope="col">Jour</th>
                    <th scope="col">Heure d'ouverture</th>
                    <th scope="col">Heure de fermeture</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map((day) => (
                    <DayRow
                      key={day.day_of_week}
                      day={day}
                      daysNames={DAYS_NAMES}
                      onUpdate={updateDayHours}
                      onToggle={toggleDay}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Colonne latérale - Fermetures exceptionnelles */}
        <div className="service-hours-sidebar">
          <div className="service-section">
            <div className="service-section__header">
              <h2 className="service-section__title">
                🚫 Fermetures exceptionnelles
              </h2>
              <p className="service-section__subtitle">
                Ajoutez des fermetures ponctuelles pour jours fériés, congés, etc.
              </p>
            </div>

            {/* Formulaire d'ajout de fermeture */}
            <form 
              onSubmit={addClosure} 
              className="closure-form"
              aria-label="Formulaire d'ajout de fermeture"
            >
              <div className="closure-form__fields">
                {/* Champ Date */}
                <div className="form-field">
                  <label htmlFor="closure-date" className="form-field__label">
                    Date de fermeture
                  </label>
                  <input
                    id="closure-date"
                    type="date"
                    value={newClosure.closure_date}
                    onChange={(e) => setNewClosure({
                      ...newClosure,
                      closure_date: e.target.value
                    })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="form-field__input"
                  />
                </div>
                
                {/* Champ Raison */}
                <div className="form-field">
                  <label htmlFor="closure-reason" className="form-field__label">
                    Raison (optionnel)
                  </label>
                  <input
                    id="closure-reason"
                    type="text"
                    value={newClosure.reason}
                    onChange={(e) => setNewClosure({
                      ...newClosure,
                      reason: e.target.value
                    })}
                    placeholder="Ex: Noël, Jour férié, Congés..."
                    className="form-field__input"
                  />
                </div>
                
                {/* Case à cocher Toute la journée */}
                <div className="form-field form-field--checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newClosure.is_all_day}
                      onChange={(e) => setNewClosure({
                        ...newClosure,
                        is_all_day: e.target.checked
                      })}
                      aria-label="Fermeture toute la journée"
                    />
                    <span>Fermeture toute la journée</span>
                  </label>
                </div>
                
                {/* Horaires spécifiques (si pas toute la journée) */}
                {!newClosure.is_all_day && (
                  <div className="form-field-group" role="group" aria-label="Horaires de fermeture">
                    <div className="form-field">
                      <label htmlFor="closure-start" className="form-field__label">
                        Heure de début
                      </label>
                      <input
                        id="closure-start"
                        type="time"
                        value={newClosure.start_time}
                        onChange={(e) => setNewClosure({
                          ...newClosure,
                          start_time: e.target.value
                        })}
                        className="form-field__input"
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label htmlFor="closure-end" className="form-field__label">
                        Heure de fin
                      </label>
                      <input
                        id="closure-end"
                        type="time"
                        value={newClosure.end_time}
                        onChange={(e) => setNewClosure({
                          ...newClosure,
                          end_time: e.target.value
                        })}
                        className="form-field__input"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                type="submit" 
                className="btn btn--primary btn--block"
                aria-label="Ajouter la fermeture"
              >
                ➕ Ajouter la fermeture
              </button>
            </form>

            {/* Liste des fermetures existantes */}
            <div className="closures-list">
              <h3 className="closures-list__title">
                Fermetures programmées ({closures.length})
              </h3>
              
              {closures.length === 0 ? (
                <div className="closures-list__empty">
                  <p>Aucune fermeture programmée</p>
                </div>
              ) : (
                <div className="closures-list__items">
                  {closures.map((closure) => (
                    <ClosureItem
                      key={closure.id}
                      closure={closure}
                      onDelete={deleteClosure}
                      formatDate={formatClosureDate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant pour afficher et gérer une fermeture
 * @param {Object} props
 * @param {Object} props.closure - Données de la fermeture
 * @param {Function} props.onDelete - Fonction de suppression
 * @param {Function} props.formatDate - Fonction de formatage de date
 */
const ClosureItem = ({ closure, onDelete, formatDate }) => {
  return (
    <div className="closure-item">
      <div className="closure-item__info">
        <div className="closure-item__date" aria-label="Date de fermeture">
          📅 {formatDate(closure.closure_date)}
        </div>
        
        {closure.reason && (
          <div 
            className="closure-item__reason" 
            aria-label="Raison de la fermeture"
          >
            {closure.reason}
          </div>
        )}
        
        <div className="closure-item__time" aria-label="Horaires de fermeture">
          {closure.is_all_day 
            ? '⏰ Toute la journée' 
            : `⏰ De ${closure.start_time} à ${closure.end_time}`}
        </div>
      </div>
      
      <button
        onClick={() => onDelete(closure.id)}
        className="closure-item__delete"
        aria-label={`Supprimer la fermeture du ${formatDate(closure.closure_date)}`}
        title="Supprimer cette fermeture"
      >
        🗑️
      </button>
    </div>
  );
};

/**
 * Composant pour une ligne du tableau des horaires
 * @param {Object} props
 * @param {Object} props.day - Données du jour
 * @param {Array} props.daysNames - Noms des jours
 * @param {Function} props.onUpdate - Fonction de mise à jour
 * @param {Function} props.onToggle - Fonction de basculement
 */
const DayRow = ({ day, daysNames, onUpdate, onToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [openingTime, setOpeningTime] = useState(day.opening_time.slice(0, 5));
  const [closingTime, setClosingTime] = useState(day.closing_time.slice(0, 5));

  /**
   * Enregistre les modifications des horaires
   */
  const handleSave = () => {
    onUpdate(day.day_of_week, openingTime, closingTime, day.is_active);
    setIsEditing(false);
  };

  /**
   * Annule les modifications en cours
   */
  const handleCancel = () => {
    setOpeningTime(day.opening_time.slice(0, 5));
    setClosingTime(day.closing_time.slice(0, 5));
    setIsEditing(false);
  };

  return (
    <tr 
      className={`day-row ${!day.is_active ? 'day-row--inactive' : ''}`}
      aria-label={`Horaires du ${daysNames[day.day_of_week]}`}
    >
      {/* Nom du jour */}
      <td className="day-row__day">
        <strong>{daysNames[day.day_of_week]}</strong>
      </td>

      {/* Heure d'ouverture */}
      <td className="day-row__time">
        {isEditing ? (
          <input
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
            className="time-input"
            aria-label={`Heure d'ouverture du ${daysNames[day.day_of_week]}`}
          />
        ) : (
          <span className="time-display" aria-label={`Ouverture à ${openingTime}`}>
            {openingTime}
          </span>
        )}
      </td>

      {/* Heure de fermeture */}
      <td className="day-row__time">
        {isEditing ? (
          <input
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
            className="time-input"
            aria-label={`Heure de fermeture du ${daysNames[day.day_of_week]}`}
          />
        ) : (
          <span className="time-display" aria-label={`Fermeture à ${closingTime}`}>
            {closingTime}
          </span>
        )}
      </td>

      {/* Statut (ouvert/fermé) */}
      <td className="day-row__status">
        <span 
          className={`status-badge ${day.is_active ? 'status-badge--success' : 'status-badge--danger'}`}
          aria-label={`Statut: ${day.is_active ? 'Ouvert' : 'Fermé'}`}
        >
          {day.is_active ? '✓ Ouvert' : '✕ Fermé'}
        </span>
      </td>

      {/* Actions */}
      <td className="day-row__actions">
        {isEditing ? (
          <div className="action-buttons">
            <button
              onClick={handleSave}
              className="btn btn--small btn--success"
              aria-label="Enregistrer les modifications"
              title="Enregistrer"
            >
              ✓
            </button>
            <button
              onClick={handleCancel}
              className="btn btn--small btn--secondary"
              aria-label="Annuler les modifications"
              title="Annuler"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="action-buttons">
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn--small btn--primary"
              aria-label={`Modifier les horaires du ${daysNames[day.day_of_week]}`}
            >
              ✏️ Modifier
            </button>
            <button
              onClick={() => onToggle(day)}
              className={`btn btn--small ${day.is_active ? 'btn--danger' : 'btn--success'}`}
              aria-label={`${day.is_active ? 'Fermer' : 'Ouvrir'} le ${daysNames[day.day_of_week]}`}
            >
              {day.is_active ? 'Fermer' : 'Ouvrir'}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default AdminServiceHours;