// ===== src/hooks/useAdminNotifications.jsx ===== (AVEC CONTRÔLE VOLUME)
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import websocket from '../services/websocket';

const useAdminNotifications = (onOrderUpdate = null) => {
  const audioRef = useRef(null);
  const hasShownWelcome = useRef(false);
  const [volume, setVolume] = useState(() => {
    // Récupérer le volume sauvegardé (localStorage)
    const saved = localStorage.getItem('notification_volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Récupérer le statut du son
    const saved = localStorage.getItem('notification_sound');
    return saved ? saved === 'true' : true;
  });

  useEffect(() => {
    // Créer l'élément audio
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = volume;

    // Mettre à jour le volume quand il change
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sauvegarder les préférences
  useEffect(() => {
    localStorage.setItem('notification_volume', volume.toString());
    localStorage.setItem('notification_sound', soundEnabled.toString());
  }, [volume, soundEnabled]);

  useEffect(() => {
    if (!websocket.isConnected && !websocket.isConnecting) {
      websocket.connect('admin');
    }

    const handleConnected = () => {
      if (!hasShownWelcome.current) {
        toast.success('🔔 Notifications activées', {
          duration: 2000,
          position: 'top-right',
        });
        hasShownWelcome.current = true;
      }
    };

    // Fonction pour jouer le son
    const playNotificationSound = () => {
      if (!soundEnabled) return;
      
      try {
        // Reset audio pour pouvoir le rejouer
        audioRef.current.currentTime = 0;
        audioRef.current.volume = volume;
        
        audioRef.current.play().catch(e => {
          console.log('Audio play failed:', e.message);
          // Si l'autoplay est bloqué, afficher un message une seule fois
          if (e.name === 'NotAllowedError' && !hasShownWelcome.current) {
            toast('Cliquez sur la page pour activer le son', {
              icon: '🔇',
              duration: 3000
            });
          }
        });
      } catch (error) {
        console.log('Audio non disponible');
      }
    };

    const handleNewOrder = (data) => {
      console.log('📨 Notification reçue:', data);
      
      if (!data) {
        console.warn('⚠️ Données manquantes');
        return;
      }
      
      // Normaliser les données
      let order;
      
      if (data.order) {
        order = data.order;
      } else if (data.order_id) {
        order = {
          id: data.order_id,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          total_amount: data.total || data.total_amount,
          order_type: data.order_type,
          delivery_date: data.delivery_date,
          delivery_time: data.delivery_time,
          delivery_address: data.delivery_address
        };
      } else {
        console.warn('⚠️ Format de données non reconnu:', data);
        return;
      }
      
      if (!order.id) {
        console.warn('⚠️ ID de commande manquant');
        return;
      }
      
      console.log('✅ Commande normalisée:', order);
      
      // Jouer le son
      playNotificationSound();

      // Préparer le message
      const orderType = (order.order_type === 'delivery') ? '🚚 Livraison' : '🍽️ Sur place';
      const customerName = order.customer_name || 'Client';
      const totalAmount = order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00';
      
      const message = `Nouvelle commande #${order.id}\n${customerName} - ${totalAmount} €\n${orderType}`;
      
      toast.success(message, {
        duration: 6000,
        position: 'top-right',
        icon: '🔔',
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '16px',
          borderRadius: '12px',
          minWidth: '300px',
          whiteSpace: 'pre-line',
        },
      });

      if (onOrderUpdate) {
        console.log('🔄 Rafraîchissement des données...');
        onOrderUpdate();
      }
    };

    const handleOrderUpdated = (data) => {
      if (!data) return;
      
      const order = data.order || data;
      const orderId = order.id || data.order_id;
      
      if (!orderId) return;
      
      toast.success(`Commande #${orderId} mise à jour`, {
        duration: 3000,
        position: 'top-right',
        icon: '✅',
      });

      if (onOrderUpdate) {
        onOrderUpdate();
      }
    };

    const handleOrderCancelled = (data) => {
      if (!data) return;
      
      const order = data.order || data;
      const orderId = order.id || data.order_id;
      
      if (!orderId) return;
      
      toast.error(`Commande #${orderId} annulée`, {
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });

      if (onOrderUpdate) {
        onOrderUpdate();
      }
    };

    const handleLowStock = (data) => {
      if (!data) return;
      
      const product = data.product || data;
      
      if (!product.name || product.stock === undefined) return;
      
      const units = product.stock > 1 ? 'unités' : 'unité';
      const message = `⚠️ Stock faible\n${product.name} - Plus que ${product.stock} ${units}`;
      
      toast(message, {
        duration: 5000,
        position: 'top-right',
        style: {
          background: '#f59e0b',
          color: '#fff',
          padding: '12px',
          borderRadius: '10px',
          whiteSpace: 'pre-line',
        },
      });
    };

    const handleOutOfStock = (data) => {
      if (!data) return;
      
      const product = data.product || data;
      
      if (!product.name) return;
      
      toast.error(`🚫 ${product.name} en rupture de stock !`, {
        duration: 6000,
        position: 'top-right',
      });
    };

    const handleConnectionFailed = () => {
      toast.error('Connexion aux notifications impossible', {
        duration: 5000,
        position: 'top-right',
        icon: '⚠️',
      });
    };

    websocket.on('connected', handleConnected);
    websocket.on('new_order', handleNewOrder);
    websocket.on('order_updated', handleOrderUpdated);
    websocket.on('order_cancelled', handleOrderCancelled);
    websocket.on('low_stock', handleLowStock);
    websocket.on('out_of_stock', handleOutOfStock);
    websocket.on('connection_failed', handleConnectionFailed);

    return () => {
      websocket.off('connected', handleConnected);
      websocket.off('new_order', handleNewOrder);
      websocket.off('order_updated', handleOrderUpdated);
      websocket.off('order_cancelled', handleOrderCancelled);
      websocket.off('low_stock', handleLowStock);
      websocket.off('out_of_stock', handleOutOfStock);
      websocket.off('connection_failed', handleConnectionFailed);
    };
  }, [onOrderUpdate, volume, soundEnabled]);

  return {
    isConnected: websocket.isConnected,
    attemptsRemaining: websocket.attemptsRemaining,
    volume,
    setVolume,
    soundEnabled,
    setSoundEnabled
  };
};

export default useAdminNotifications;