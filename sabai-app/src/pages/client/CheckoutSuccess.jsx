// ===== src/pages/client/CheckoutSuccess.jsx ===== (VERSION CORRIGÉE)
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // ✅ Empêche les updates après unmount

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
        const response = await fetch('http://localhost:3000/api/payment/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });

        const data = await response.json();

        if (!isMounted) return; // ✅ Arrêter si le composant est démonté

        if (data.success) {
          setOrderId(data.order_id);
          clearCart(); // ✅ Appeler clearCart seulement en cas de succès
          setLoading(false);
        } else {
          throw new Error(data.error || 'Erreur lors de la vérification du paiement');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Erreur:', err);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    verifyPayment();

    return () => {
      isMounted = false; // ✅ Cleanup pour éviter les memory leaks
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // ✅ SEULEMENT searchParams - PAS clearCart !

  if (loading) {
    return (
      <div className="checkout-success__container">
        <div className="checkout-success__content">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="checkout-success__icon-loading" />
          <h2 className="checkout-success__title-loading">Vérification du paiement...</h2>
          <p className="checkout-success__text-loading">Veuillez patienter</p>
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
          <button onClick={() => navigate('/checkout')} className="checkout-success__button checkout-success__button--return">
            Retour au paiement
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-success__container">
      <div className="checkout-success__content">
        <FontAwesomeIcon icon={faCheckCircle} size="5x" className="checkout-success__icon-success" />
        
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