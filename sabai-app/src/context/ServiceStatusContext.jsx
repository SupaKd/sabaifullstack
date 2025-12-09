// src/context/ServiceStatusContext.jsx (version enrichie avec DEBUG)
import { createContext, useContext, useState, useEffect } from 'react';

const ServiceStatusContext = createContext();

export const ServiceStatusProvider = ({ children }) => {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Données dérivées utiles
  const isOpen = serviceStatus?.open ?? false;
  const closingTime = serviceStatus?.closing_time;
  const openingTime = serviceStatus?.opening_time;

  // 🔍 DEBUG - Suivre les changements
  useEffect(() => {
    console.log('🔵 ServiceStatusContext - Status updated:', serviceStatus);
    console.log('🔵 ServiceStatusContext - isOpen:', isOpen);
  }, [serviceStatus, isOpen]);

  const value = {
    serviceStatus,
    setServiceStatus,
    isLoading,
    setIsLoading,
    // Helpers
    isOpen,
    closingTime,
    openingTime,
  };

  return (
    <ServiceStatusContext.Provider value={value}>
      {children}
    </ServiceStatusContext.Provider>
  );
};

export const useServiceStatus = () => {
  const context = useContext(ServiceStatusContext);
  if (!context) {
    throw new Error('useServiceStatus doit être utilisé dans un ServiceStatusProvider');
  }
  return context;
};