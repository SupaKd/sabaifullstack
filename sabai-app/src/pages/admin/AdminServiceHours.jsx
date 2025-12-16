// ===== src/pages/admin/AdminServiceHours.jsx ===== (VERSION CORRIGÉE)
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faCalendarAlt, 
  faSave, 
  faTrash, 
  faPlus,
  faCog 
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import api from '../../services/api'; // ✅ IMPORT API

const AdminServiceHours = () => {
  const [hours, setHours] = useState([]);
  const [closures, setClosures] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // États pour le formulaire de fermeture
  const [newClosure, setNewClosure] = useState({
    closure_date: '',
    reason: '',
    is_all_day: true,
    start_time: '',
    end_time: ''
  });

  const daysNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  useEffect(() => {
    loadAllData();
  }, []);

  // ✅ CORRIGÉ : Utilise api.js
  const loadAllData = async () => {
    try {
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

  // ✅ CORRIGÉ
  const loadHours = async () => {
    try {
      const data = await api.getServiceHours();
      setHours(data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des horaires:', error);
      toast.error('Erreur chargement horaires');
    }
  };

  // ✅ CORRIGÉ
  const loadClosures = async () => {
    try {
      const data = await api.getClosures();
      setClosures(data.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des fermetures:', error);
      toast.error('Erreur chargement fermetures');
    }
  };

  // ✅ CORRIGÉ
  const loadSettings = async () => {
    try {
      const data = await api.getServiceSettings();
      setSettings(data.data || {});
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast.error('Erreur chargement paramètres');
    }
  };

  // ✅ CORRIGÉ
  const handleUpdateHours = async (dayOfWeek, updatedHours) => {
    try {
      await api.updateDayHours(dayOfWeek, updatedHours);
      toast.success('Horaires mis à jour');
      loadHours();
    } catch (error) {
      handleError('Erreur lors de la mise à jour des horaires', error);
    }
  };

  // ✅ CORRIGÉ
  const handleToggleDay = async (dayOfWeek, isActive) => {
    try {
      const day = hours.find(h => h.day_of_week === dayOfWeek);
      if (!day) return;

      await api.updateDayHours(dayOfWeek, {
        opening_time: day.opening_time,
        closing_time: day.closing_time,
        is_active: !isActive
      });

      toast.success(isActive ? 'Jour désactivé' : 'Jour activé');
      loadHours();
    } catch (error) {
      handleError('Erreur lors du changement de statut', error);
    }
  };

  // ✅ CORRIGÉ
  const handleAddClosure = async (e) => {
    e.preventDefault();
    
    if (!newClosure.closure_date) {
      toast.error('Date requise');
      return;
    }

    try {
      await api.addClosure(newClosure);
      toast.success('Fermeture ajoutée');
      setNewClosure({
        closure_date: '',
        reason: '',
        is_all_day: true,
        start_time: '',
        end_time: ''
      });
      loadClosures();
    } catch (error) {
      handleError('Erreur lors de l\'ajout de la fermeture', error);
    }
  };

  // ✅ CORRIGÉ
  const handleDeleteClosure = async (id) => {
    if (!confirm('Supprimer cette fermeture ?')) return;

    try {
      await api.deleteClosure(id);
      toast.success('Fermeture supprimée');
      loadClosures();
    } catch (error) {
      handleError('Erreur lors de la suppression', error);
    }
  };

  // ✅ CORRIGÉ
  const handleUpdateSetting = async (key, value) => {
    try {
      await api.updateServiceSetting(key, value);
      toast.success('Paramètre mis à jour');
      loadSettings();
    } catch (error) {
      handleError('Erreur lors de la mise à jour du paramètre', error);
    }
  };

  const handleError = (message, error) => {
    console.error(message, error);
    toast.error(message);
  };

  const handleHourChange = (dayOfWeek, field, value) => {
    setHours(prevHours =>
      prevHours.map(h =>
        h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
  };

  const saveHour = (dayOfWeek) => {
    const day = hours.find(h => h.day_of_week === dayOfWeek);
    if (day) {
      handleUpdateHours(dayOfWeek, {
        opening_time: day.opening_time,
        closing_time: day.closing_time,
        is_active: day.is_active
      });
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-service-hours">
      <div className="admin-header">
        <h1>
          <FontAwesomeIcon icon={faClock} /> Gestion des Horaires
        </h1>
      </div>

      {/* SECTION 1 : Horaires hebdomadaires */}
      <div className="service-section">
        <h2>
          <FontAwesomeIcon icon={faClock} /> Horaires d'ouverture
        </h2>
        <div className="hours-list">
          {hours.map((hour) => (
            <div key={hour.day_of_week} className="hour-card">
              <div className="hour-header">
                <h3>{daysNames[hour.day_of_week]}</h3>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={hour.is_active}
                    onChange={() => handleToggleDay(hour.day_of_week, hour.is_active)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {hour.is_active && (
                <div className="hour-inputs">
                  <div className="input-group">
                    <label>Ouverture</label>
                    <input
                      type="time"
                      value={hour.opening_time}
                      onChange={(e) =>
                        handleHourChange(hour.day_of_week, 'opening_time', e.target.value)
                      }
                    />
                  </div>

                  <div className="input-group">
                    <label>Fermeture</label>
                    <input
                      type="time"
                      value={hour.closing_time}
                      onChange={(e) =>
                        handleHourChange(hour.day_of_week, 'closing_time', e.target.value)
                      }
                    />
                  </div>

                  <button
                    className="btn-save"
                    onClick={() => saveHour(hour.day_of_week)}
                  >
                    <FontAwesomeIcon icon={faSave} /> Enregistrer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 : Fermetures exceptionnelles */}
      <div className="service-section">
        <h2>
          <FontAwesomeIcon icon={faCalendarAlt} /> Fermetures exceptionnelles
        </h2>

        <form onSubmit={handleAddClosure} className="closure-form">
          <div className="form-row">
            <div className="input-group">
              <label>Date</label>
              <input
                type="date"
                value={newClosure.closure_date}
                onChange={(e) =>
                  setNewClosure({ ...newClosure, closure_date: e.target.value })
                }
                required
              />
            </div>

            <div className="input-group">
              <label>Raison</label>
              <input
                type="text"
                value={newClosure.reason}
                onChange={(e) =>
                  setNewClosure({ ...newClosure, reason: e.target.value })
                }
                placeholder="Ex: Jour férié"
              />
            </div>
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newClosure.is_all_day}
                onChange={(e) =>
                  setNewClosure({ ...newClosure, is_all_day: e.target.checked })
                }
              />
              Toute la journée
            </label>
          </div>

          {!newClosure.is_all_day && (
            <div className="form-row">
              <div className="input-group">
                <label>Début</label>
                <input
                  type="time"
                  value={newClosure.start_time}
                  onChange={(e) =>
                    setNewClosure({ ...newClosure, start_time: e.target.value })
                  }
                />
              </div>

              <div className="input-group">
                <label>Fin</label>
                <input
                  type="time"
                  value={newClosure.end_time}
                  onChange={(e) =>
                    setNewClosure({ ...newClosure, end_time: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-add">
            <FontAwesomeIcon icon={faPlus} /> Ajouter une fermeture
          </button>
        </form>

        <div className="closures-list">
          {closures.length === 0 ? (
            <p className="empty-message">Aucune fermeture exceptionnelle prévue</p>
          ) : (
            closures.map((closure) => (
              <div key={closure.id} className="closure-card">
                <div className="closure-info">
                  <span className="closure-date">
                    {new Date(closure.closure_date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="closure-reason">{closure.reason || 'Fermeture'}</span>
                  {!closure.is_all_day && (
                    <span className="closure-time">
                      {closure.start_time} - {closure.end_time}
                    </span>
                  )}
                </div>
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteClosure(closure.id)}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 3 : Paramètres */}
      <div className="service-section">
        <h2>
          <FontAwesomeIcon icon={faCog} /> Paramètres
        </h2>

        <div className="settings-list">
          <div className="setting-card">
            <label>Service activé</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.service_enabled === 'true'}
                onChange={(e) =>
                  handleUpdateSetting('service_enabled', e.target.checked.toString())
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-card">
            <label>Livraison activée</label>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.delivery_enabled === 'true'}
                onChange={(e) =>
                  handleUpdateSetting('delivery_enabled', e.target.checked.toString())
                }
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-card">
            <label>Temps de préparation (min)</label>
            <input
              type="number"
              value={settings.preparation_time_minutes || 30}
              onChange={(e) =>
                handleUpdateSetting('preparation_time_minutes', e.target.value)
              }
              min="0"
              max="180"
            />
          </div>

          <div className="setting-card">
            <label>Frais de livraison (€)</label>
            <input
              type="number"
              step="0.01"
              value={settings.delivery_fee || 5}
              onChange={(e) =>
                handleUpdateSetting('delivery_fee', e.target.value)
              }
              min="0"
              max="50"
            />
          </div>

          <div className="setting-card">
            <label>Minimum commande livraison (€)</label>
            <input
              type="number"
              step="0.01"
              value={settings.delivery_min_amount || 30}
              onChange={(e) =>
                handleUpdateSetting('delivery_min_amount', e.target.value)
              }
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminServiceHours;