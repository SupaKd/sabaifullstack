// ===== src/components/OptimizedImage.jsx =====
import { useState } from 'react';
import API_CONFIG from '../services/api.config';

/**
 * Composant image optimisé avec :
 * - Lazy loading natif
 * - Placeholder pendant chargement
 * - Fallback si erreur
 * - Support srcset (responsive)
 */
const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  fallback = '/images/placeholder-food.jpg',
  sizes = '(max-width: 768px) 100vw, 50vw'
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Construire l'URL complète
  const getImageUrl = () => {
    if (!src) return fallback;
    if (src.startsWith('http')) return src;
    return API_CONFIG.imageUrl(src);
  };

  const imageUrl = imageError ? fallback : getImageUrl();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <div className={`optimized-image ${className}`} style={{ position: 'relative' }}>
      {/* Skeleton loader pendant chargement */}
      {isLoading && (
        <div className="optimized-image__skeleton" />
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={`optimized-image__img ${isLoading ? 'optimized-image__img--loading' : ''}`}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
    </div>
  );
};

export default OptimizedImage;