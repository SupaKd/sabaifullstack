// ===== src/components/NotificationSettings.jsx ===== (avec Lucide React)
import { useState } from 'react';
import {
  Volume2,
  Volume1,
  VolumeX,
  Bell,
  BellOff,
  Settings,
  X
} from 'lucide-react';

const NotificationSettings = ({ volume, setVolume, soundEnabled, setSoundEnabled, isConnected }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getVolumeIcon = () => {
    if (!soundEnabled || volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
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
      <button 
        className="settings-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title="Paramètres des notifications"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Paramètres des notifications</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="settings-body">
            <div className="setting-item">
              <div className="setting-label">
                {isConnected ? (
                  <Bell size={18} className="text-success" />
                ) : (
                  <BellOff size={18} className="text-danger" />
                )}
                <span>Statut</span>
              </div>
              <div className="setting-value">
                <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
              </div>
            </div>

            <div className="divider"></div>

            <div className="setting-item">
              <div className="setting-label">
                <VolumeIcon size={18} />
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

            {soundEnabled && (
              <div className="setting-item volume-control">
                <div className="setting-label">
                  <VolumeIcon size={18} />
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