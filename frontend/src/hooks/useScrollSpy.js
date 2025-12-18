// ===== src/hooks/useScrollSpy.js =====
// Hook personnalisé pour détecter l'élément visible dans le viewport

import { useState, useEffect, useRef } from 'react';

/**
 * Hook pour implémenter un système de Scroll Spy
 * @param {Array} elements - Liste des identifiants des sections à observer
 * @param {Object} options - Options pour l'IntersectionObserver
 * @returns {Object} - { activeId, refs } où activeId est l'élément visible et refs pour assigner aux sections
 */
export const useScrollSpy = (elements = [], options = {}) => {
  const [activeId, setActiveId] = useState(null);
  const refs = useRef({});
  const observerRef = useRef(null);

  const defaultOptions = {
    root: null,
    rootMargin: '-100px 0px -50% 0px',
    threshold: 0.1,
    ...options,
  };

  useEffect(() => {
    // Créer l'observer
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.dataset.id;
          setActiveId(id);
        }
      });
    }, defaultOptions);

    // Observer tous les éléments
    Object.values(refs.current).forEach((ref) => {
      if (ref) {
        observerRef.current.observe(ref);
      }
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elements.length]);

  /**
   * Scroll vers un élément spécifique
   * @param {string} id - Identifiant de l'élément
   * @param {number} offset - Offset en pixels (défaut: 120)
   */
  const scrollTo = (id, offset = 120) => {
    const element = refs.current[id];
    if (element) {
      const offsetTop = element.offsetTop - offset;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  };

  return {
    activeId,
    setActiveId,
    refs,
    scrollTo,
  };
};

export default useScrollSpy;