// ===== src/hooks/useFilters.js =====
import { useState, useMemo } from 'react';

/**
 * Hook personnalisé pour gérer les filtres
 * Élimine la duplication de code entre Home, AdminOrders, AdminProducts
 * 
 * @param {Array} items - Liste des éléments à filtrer
 * @param {Object} config - Configuration des filtres
 * @returns {Object} - État et méthodes de filtrage
 */
const useFilters = (items, config = {}) => {
  const {
    categoryKey = 'category',
    statusKey = 'status',
    dateKey = 'date',
    searchKey = 'name'
  } = config;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Extraire les catégories uniques
  const categories = useMemo(() => {
    if (!items || items.length === 0) return [];
    const unique = [...new Set(items.map(item => item[categoryKey]))];
    return unique.filter(Boolean);
  }, [items, categoryKey]);

  // ✅ Extraire les statuts uniques
  const statuses = useMemo(() => {
    if (!items || items.length === 0) return [];
    const unique = [...new Set(items.map(item => item[statusKey]))];
    return unique.filter(Boolean);
  }, [items, statusKey]);

  // ✅ Filtrer les items
  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter(item => {
      // Filtre par catégorie
      if (selectedCategory && item[categoryKey] !== selectedCategory) {
        return false;
      }

      // Filtre par statut
      if (selectedStatus && item[statusKey] !== selectedStatus) {
        return false;
      }

      // Filtre par date
      if (selectedDate && item[dateKey] !== selectedDate) {
        return false;
      }

      // Filtre par recherche textuelle
      if (searchQuery && searchKey) {
        const searchValue = item[searchKey]?.toLowerCase() || '';
        if (!searchValue.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, selectedStatus, selectedDate, searchQuery, categoryKey, statusKey, dateKey, searchKey]);

  // ✅ Compter items par catégorie
  const getCategoryCount = (category) => {
    return items.filter(item => item[categoryKey] === category).length;
  };

  // ✅ Compter items par statut
  const getStatusCount = (status) => {
    return items.filter(item => item[statusKey] === status).length;
  };

  // ✅ Reset tous les filtres
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSelectedDate(null);
    setSearchQuery('');
  };

  // ✅ Vérifier si des filtres sont actifs
  const hasActiveFilters = useMemo(() => {
    return !!(selectedCategory || selectedStatus || selectedDate || searchQuery);
  }, [selectedCategory, selectedStatus, selectedDate, searchQuery]);

  return {
    // États
    selectedCategory,
    selectedStatus,
    selectedDate,
    searchQuery,
    
    // Setters
    setSelectedCategory,
    setSelectedStatus,
    setSelectedDate,
    setSearchQuery,
    
    // Données dérivées
    categories,
    statuses,
    filteredItems,
    
    // Helpers
    getCategoryCount,
    getStatusCount,
    resetFilters,
    hasActiveFilters,
    
    // Stats
    totalItems: items?.length || 0,
    filteredCount: filteredItems.length
  };
};

export default useFilters;