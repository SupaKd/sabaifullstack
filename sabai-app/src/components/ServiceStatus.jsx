// ===== src/components/ServiceStatus.jsx ===== (VERSION CORRIGÉE)
import { useEffect, useCallback, useState } from "react";
import { useServiceStatus } from "../context/ServiceStatusContext";
import DeliveryClosedModal from "./DeliveryClosedModal";
import api from '../services/api'; // ✅ CHANGEMENT 1

const CHECK_INTERVAL = 60000; // 1 minute

const ServiceStatus = ({ onStatusChange }) => {
  const { setServiceStatus } = useServiceStatus();
  const [showModal, setShowModal] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      // ✅ CHANGEMENT 2 : Utiliser api.js
      const data = await api.getServiceStatus();

      if (data.success) {
        setServiceStatus(data.data);
        onStatusChange?.(data.data);
        setShowModal(!data.data.open);
      }
    } catch (error) {
      console.error("Erreur statut :", error);
    }
  }, [onStatusChange, setServiceStatus]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <DeliveryClosedModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
    />
  );
};

export default ServiceStatus;