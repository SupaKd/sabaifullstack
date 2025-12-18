// ===== src/pages/admin/AdminServiceHours.jsx ===== (OPTIMISÉ TABLETTE)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faClock, 
  faCalendarAlt, 
  faSave, 
  faTrash, 
  faPlus,
  faCog,
  faBell,
  faToggleOn,
  faToggleOff
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAdminNotifications from '../../hooks/useAdminNotifications';

const AdminServiceHours = () => {
  const [hours, setHours] = useState([]);
  const [closures, setClosures] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hours'); // hours, closures, settings

  // États pour le formulaire de fermeture
  const [newClosure, setNewClosure] = useState({
    closure_date: '',
    reason: '',
    is_all_day: true,
    start_time: '',
    end_time: ''
  });

  const daysNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadHours(),
        loadClosures(),
        loadSettings()
      ]);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const { isConnected } = useAdminNotifications();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadHours = async () => {
    try {
      const data = await api.getServiceHours();
      setHours(data.data || []);
    } catch (error) {
      console.error('Erreur horaires:', error);
    }
  };

  const loadClosures = async () => {
    try {
      const data = await api.getClosures();
      setClosures(data.data || []);
    } catch (error) {
      console.error('Erreur fermetures:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await api.getServiceSettings();
      setSettings(data.data || {});
    } catch (error) {
      console.error('Erreur paramètres:', error);
    }
  };

  const handleUpdateHours = async (dayOfWeek, updatedHours) => {
    try {
      await api.updateDayHours(dayOfWeek, updatedHours);
      toast.success('✓ Horaires mis à jour', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      loadHours();
    } catch (error) {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleToggleDay = async (dayOfWeek, isActive) => {
    try {
      const day = hours.find(h => h.day_of_week === dayOfWeek);
      if (!day) return;

      await api.updateDayHours(dayOfWeek, {
        opening_time: day.opening_time,
        closing_time: day.closing_time,
        is_active: !isActive
      });

      toast.success(isActive ? 'Jour désactivé' : 'Jour activé', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      loadHours();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleAddClosure = async (e) => {
    e.preventDefault();
    
    if (!newClosure.closure_date) {
      toast.error('Date requise');
      return;
    }

    try {
      await api.addClosure(newClosure);
      toast.success('✓ Fermeture ajoutée', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      setNewClosure({
        closure_date: '',
        reason: '',
        is_all_day: true,
        start_time: '',
        end_time: ''
      });
      loadClosures();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleDeleteClosure = async (id) => {
    try {
      await api.deleteClosure(id);
      toast.success('✓ Fermeture supprimée', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      loadClosures();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      await api.updateServiceSetting(key, value);
      toast.success('✓ Paramètre mis à jour', {
        duration: 2000,
        style: { fontSize: '18px', padding: '16px 24px' }
      });
      loadSettings();
    } catch (error) {
      toast.error('Erreur');
    }
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
      <div className="loading-tablet">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="admin-service-hours-tablet">
      {/* Header */}
      <div className="hours-header-tablet">
        <Link to="/admin" className="back-btn-tablet">
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>
        
        <h1>Horaires & Paramètres</h1>
        
        <div className="header-badges">
          {isConnected && (
            <span className="ws-badge connected">
              <FontAwesomeIcon icon={faBell} />
            </span>
          )}
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="tabs-navigation-tablet">
        <button
          className={`tab-btn ${activeSection === 'hours' ? 'active' : ''}`}
          onClick={() => setActiveSection('hours')}
        >
          <FontAwesomeIcon icon={faClock} />
          <span>Horaires</span>
        </button>
        <button
          className={`tab-btn ${activeSection === 'closures' ? 'active' : ''}`}
          onClick={() => setActiveSection('closures')}
        >
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>Fermetures</span>
        </button>
        <button
          className={`tab-btn ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          <FontAwesomeIcon icon={faCog} />
          <span>Paramètres</span>
        </button>
      </div>

      {/* SECTION 1 : Horaires hebdomadaires */}
      {activeSection === 'hours' && (
        <div className="section-content-tablet">
          <div className="hours-grid-tablet">
            {hours.map((hour) => (
              <div 
                key={hour.day_of_week} 
                className={`hour-card-tablet ${hour.is_active ? 'active' : 'inactive'}`}
              >
                <div className="hour-header-tablet">
                  <h3>{daysNames[hour.day_of_week]}</h3>
                  <button
                    className={`toggle-btn-tablet ${hour.is_active ? 'on' : 'off'}`}
                    onClick={() => handleToggleDay(hour.day_of_week, hour.is_active)}
                  >
                    <FontAwesomeIcon icon={hour.is_active ? faToggleOn : faToggleOff} />
                    <span>{hour.is_active ? 'Ouvert' : 'Fermé'}</span>
                  </button>
                </div>

                {hour.is_active && (
                  <>
                    <div className="hour-times-tablet">
                      <div className="time-input-tablet">
                        <label>Ouverture</label>
                        <input
                          type="time"
                          value={hour.opening_time}
                          onChange={(e) =>
                            handleHourChange(hour.day_of_week, 'opening_time', e.target.value)
                          }
                        />
                      </div>

                      <div className="time-input-tablet">
                        <label>Fermeture</label>
                        <input
                          type="time"
                          value={hour.closing_time}
                          onChange={(e) =>
                            handleHourChange(hour.day_of_week, 'closing_time', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <button
                      className="save-btn-tablet"
                      onClick={() => saveHour(hour.day_of_week)}
                    >
                      <FontAwesomeIcon icon={faSave} />
                      Enregistrer
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2 : Fermetures exceptionnelles */}
      {activeSection === 'closures' && (
        <div className="section-content-tablet">
          {/* Formulaire d'ajout */}
          <form onSubmit={handleAddClosure} className="closure-form-tablet">
            <div className="form-field-tablet">
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

            <div className="form-field-tablet">
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

            <label className="checkbox-field-tablet">
              <input
                type="checkbox"
                checked={newClosure.is_all_day}
                onChange={(e) =>
                  setNewClosure({ ...newClosure, is_all_day: e.target.checked })
                }
              />
              <span>Toute la journée</span>
            </label>

            {!newClosure.is_all_day && (
              <div className="time-range-tablet">
                <div className="form-field-tablet">
                  <label>Début</label>
                  <input
                    type="time"
                    value={newClosure.start_time}
                    onChange={(e) =>
                      setNewClosure({ ...newClosure, start_time: e.target.value })
                    }
                  />
                </div>

                <div className="form-field-tablet">
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

            <button type="submit" className="add-btn-tablet">
              <FontAwesomeIcon icon={faPlus} />
              Ajouter une fermeture
            </button>
          </form>

          {/* Liste des fermetures */}
          <div className="closures-list-tablet">
            {closures.length === 0 ? (
              <div className="empty-state-tablet">
                <FontAwesomeIcon icon={faCalendarAlt} />
                <p>Aucune fermeture prévue</p>
              </div>
            ) : (
              closures.map((closure) => (
                <div key={closure.id} className="closure-card-tablet">
                  <div className="closure-info-tablet">
                    <div className="closure-date-tablet">
                      {new Date(closure.closure_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </div>
                    <div className="closure-reason-tablet">
                      {closure.reason || 'Fermeture'}
                    </div>
                    {!closure.is_all_day && (
                      <div className="closure-time-tablet">
                        {closure.start_time} - {closure.end_time}
                      </div>
                    )}
                  </div>
                  <button
                    className="delete-btn-tablet"
                    onClick={() => handleDeleteClosure(closure.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECTION 3 : Paramètres */}
      {activeSection === 'settings' && (
        <div className="section-content-tablet">
          <div className="settings-grid-tablet">
            {/* Service activé */}
            <div className="setting-card-tablet">
              <div className="setting-label-tablet">
                <span>Service activé</span>
                <p>Active/désactive le restaurant</p>
              </div>
              <button
                className={`toggle-btn-tablet ${settings.service_enabled === 'true' ? 'on' : 'off'}`}
                onClick={() =>
                  handleUpdateSetting('service_enabled', (settings.service_enabled !== 'true').toString())
                }
              >
                <FontAwesomeIcon icon={settings.service_enabled === 'true' ? faToggleOn : faToggleOff} />
                <span>{settings.service_enabled === 'true' ? 'Actif' : 'Inactif'}</span>
              </button>
            </div>

            {/* Livraison activée */}
            <div className="setting-card-tablet">
              <div className="setting-label-tablet">
                <span>Livraison</span>
                <p>Active/désactive la livraison</p>
              </div>
              <button
                className={`toggle-btn-tablet ${settings.delivery_enabled === 'true' ? 'on' : 'off'}`}
                onClick={() =>
                  handleUpdateSetting('delivery_enabled', (settings.delivery_enabled !== 'true').toString())
                }
              >
                <FontAwesomeIcon icon={settings.delivery_enabled === 'true' ? faToggleOn : faToggleOff} />
                <span>{settings.delivery_enabled === 'true' ? 'Actif' : 'Inactif'}</span>
              </button>
            </div>

            {/* Temps de préparation */}
            <div className="setting-card-tablet full-width">
              <label>Temps de préparation (minutes)</label>
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

            {/* Frais de livraison */}
            <div className="setting-card-tablet">
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

            {/* Minimum commande */}
            <div className="setting-card-tablet">
              <label>Minimum livraison (€)</label>
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
      )}
    </div>
  );
};

export default AdminServiceHours;