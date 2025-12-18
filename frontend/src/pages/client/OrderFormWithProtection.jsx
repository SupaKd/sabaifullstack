import React, { useState } from 'react';
import ServiceStatus from './ServiceStatus';
import API_CONFIG from '../config/api.config';

const OrderFormWithProtection = () => {
  const [serviceOpen, setServiceOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    delivery_address: '',
    notes: '',
    items: []
  });

  const handleStatusChange = (status) => {
    setServiceOpen(status.open);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!serviceOpen) {
      alert('Le service est actuellement fermé. Veuillez réessayer pendant nos horaires d\'ouverture.');
      return;
    }

    try {
      const response = await fetch(API_CONFIG.url('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Commande créée avec succès ! Numéro de commande : ' + data.order_id);
        setFormData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          delivery_address: '',
          notes: '',
          items: []
        });
      } else {
        if (response.status === 503) {
          alert(`Service indisponible : ${data.reason || 'Veuillez réessayer plus tard'}`);
        } else {
          alert(`Erreur : ${data.error || 'Une erreur est survenue'}`);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="order-form-container">
      <ServiceStatus onStatusChange={handleStatusChange} />

      {!serviceOpen && (
        <div className="service-closed-overlay">
          <div className="closed-message">
            <span className="closed-icon">🕐</span>
            <h3>Service actuellement fermé</h3>
            <p>Vous pourrez commander pendant nos horaires d'ouverture.</p>
            <p className="closed-hint">Consultez nos horaires ci-dessus</p>
          </div>
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        className={`order-form ${!serviceOpen ? 'disabled' : ''}`}
      >
        <h2>Passer une commande</h2>

        <div className="form-group">
          <label htmlFor="customer_name">Nom complet *</label>
          <input
            type="text"
            id="customer_name"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            required
            disabled={!serviceOpen}
            placeholder="Votre nom"
          />
        </div>

        <div className="form-group">
          <label htmlFor="customer_email">Email *</label>
          <input
            type="email"
            id="customer_email"
            name="customer_email"
            value={formData.customer_email}
            onChange={handleChange}
            required
            disabled={!serviceOpen}
            placeholder="votre@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="customer_phone">Téléphone *</label>
          <input
            type="tel"
            id="customer_phone"
            name="customer_phone"
            value={formData.customer_phone}
            onChange={handleChange}
            required
            disabled={!serviceOpen}
            placeholder="06 12 34 56 78"
          />
        </div>

        <div className="form-group">
          <label htmlFor="delivery_address">Adresse de livraison *</label>
          <textarea
            id="delivery_address"
            name="delivery_address"
            value={formData.delivery_address}
            onChange={handleChange}
            required
            disabled={!serviceOpen}
            placeholder="Adresse complète"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Instructions spéciales</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={!serviceOpen}
            placeholder="Allergies, préférences, code d'accès..."
            rows="2"
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={!serviceOpen}
        >
          {serviceOpen ? 'Passer la commande' : 'Service fermé'}
        </button>
      </form>
    </div>
  );
};

export default OrderFormWithProtection;