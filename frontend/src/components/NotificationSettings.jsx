// ===== src/components/NotificationSettings.jsx ===== (NOUVEAU FICHIER)
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVolumeUp,
  faVolumeDown,
  faVolumeMute,
  faBell,
  faBellSlash,
  faCog
} from '@fortawesome/free-solid-svg-icons';

const NotificationSettings = ({ volume, setVolume, soundEnabled, setSoundEnabled, isConnected }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getVolumeIcon = () => {
    if (!soundEnabled || volume === 0) return faVolumeMute;
    if (volume < 0.5) return faVolumeDown;
    return faVolumeUp;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    // Activer le son automatiquement si on change le volume
    if (!soundEnabled && newVolume > 0) {
      setSoundEnabled(true);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const testSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = volume;
    audio.play().catch(e => {
      alert('Erreur lecture audio. Assurez-vous que le fichier notification.mp3 existe dans public/');
    });
  };

  return (
    <div className="notification-settings">
      {/* Bouton pour ouvrir les paramètres */}
      <button 
        className="settings-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Paramètres des notifications"
      >
        <FontAwesomeIcon icon={faCog} />
      </button>

      {/* Panel des paramètres */}
      {isOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Paramètres des notifications</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="settings-body">
            {/* Statut de connexion */}
            <div className="setting-item">
              <div className="setting-label">
                <FontAwesomeIcon 
                  icon={isConnected ? faBell : faBellSlash}
                  className={isConnected ? 'text-success' : 'text-danger'}
                />
                <span>Statut</span>
              </div>
              <div className="setting-value">
                <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
            </div>

            <div className="divider"></div>

            {/* Toggle son */}
            <div className="setting-item">
              <div className="setting-label">
                <FontAwesomeIcon icon={getVolumeIcon()} />
                <span>Son des notifications</span>
              </div>
              <div className="setting-value">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={toggleSound}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Contrôle du volume */}
            {soundEnabled && (
              <div className="setting-item volume-control">
                <div className="setting-label">
                  <FontAwesomeIcon icon={getVolumeIcon()} />
                  <span>Volume</span>
                  <span className="volume-percentage">{Math.round(volume * 100)}%</span>
                </div>
                <div className="setting-value full-width">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                 
                </div>
              </div>
            )}

            {/* Bouton de test */}
            {soundEnabled && (
              <div className="setting-item">
                <button 
                  className="test-sound-btn"
                  onClick={testSound}
                >
                  🔊 Tester le son
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;