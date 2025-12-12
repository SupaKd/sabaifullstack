import { useEffect, useCallback, useState } from "react";
import { useServiceStatus } from "../context/ServiceStatusContext";
import DeliveryClosedModal from "./DeliveryClosedModal";
import API_CONFIG from '../services/api.config';

const CHECK_INTERVAL = 60000; // 1 minute

const ServiceStatus = ({ onStatusChange }) => {
  const { setServiceStatus } = useServiceStatus();
  const [showModal, setShowModal] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(API_CONFIG.url('/api/service-hours/status'));
      const data = await response.json();

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