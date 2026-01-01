// ===== src/pages/client/CheckoutSuccess.jsx ===== (VERSION avec Lucide React)
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { CheckCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        if (isMounted) {
          setError('Session invalide');
          setLoading(false);
        }
        return;
      }

      try {
        const data = await api.verifyPayment(sessionId);

        if (!isMounted) return;

        if (data.success) {
          setOrderId(data.order_id);
          clearCart();
          setLoading(false);
        } else {
          throw new Error(data.error || 'Erreur lors de la vérification du paiement');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur vérification paiement:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [searchParams, clearCart]);

  if (loading) {
    return (
      <div className="checkout-success__container">
        <div className="checkout-success__content">
          <Loader2 
            size={48} 
            className="checkout-success__icon-loading animate-spin" 
          />
          <h2 className="checkout-success__title-loading">
            Vérification du paiement...
          </h2>
          <p className="checkout-success__text-loading">
            Veuillez patienter
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-success__container">
        <div className="checkout-success__content">
          <div className="checkout-success__icon-error">❌</div>
          <h2 className="checkout-success__title-error">Erreur</h2>
          <p className="checkout-success__text-error">{error}</p>
          <button 
            onClick={() => navigate('/checkout')} 
            className="checkout-success__button checkout-success__button--return"
          >
            Retour au paiement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-success__container">
      <div className="checkout-success__content">
        <CheckCircle 
          size={80} 
          className="checkout-success__icon-success" 
        />
        <h1 className="checkout-success__title-success">
          Paiement réussi !
        </h1>
        <p className="checkout-success__subtitle">
          Votre commande a été confirmée
        </p>
        
        <div className="checkout-success__order-box">
          <p className="checkout-success__order-label">
            Numéro de commande
          </p>
          <p className="checkout-success__order-id">
            #{orderId}
          </p>
        </div>

        <div className="checkout-success__actions">
          <p className="checkout-success__confirmation">
            Un email de confirmation vous a été envoyé.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="checkout-success__button checkout-success__button--home"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;