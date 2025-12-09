// ===== src/components/DeliveryClosedModal.jsx =====
import React from "react";

const DeliveryClosedModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="service-modal-overlay">
      <div className="service-modal">
        <img src="/images/logosabai.png" alt="logo" />
        <p>Fermé pour le moment, à très vite !</p>
        <button className="service-modal-close" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

export default DeliveryClosedModal;
