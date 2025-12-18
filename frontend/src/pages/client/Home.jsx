import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import ProductCard from "../../components/ProductCard";
import Hero from "../../components/Hero";
import ServiceStatus from "../../components/ServiceStatus";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null); // ✅ Catégorie active basée sur le scroll
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs pour les sections de catégories
  const categoryRefs = useRef({});
  const observerRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // ✅ Intersection Observer amélioré pour détecter correctement la catégorie visible
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-140px 0px -60% 0px", // Zone de détection centrée
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1], // Multiples seuils
    };

    let intersectingEntries = new Map();

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const category = entry.target.dataset.category;
        
        if (entry.isIntersecting) {
          // Stocker avec ratio et position
          intersectingEntries.set(category, {
            ratio: entry.intersectionRatio,
            top: entry.boundingClientRect.top,
          });
        } else {
          intersectingEntries.delete(category);
        }
      });

      // Trouver la catégorie la plus proche du haut avec le meilleur ratio
      if (intersectingEntries.size > 0) {
        let bestCategory = null;
        let bestScore = -Infinity;

        intersectingEntries.forEach((data, category) => {
          // Score = ratio élevé ET position proche du haut
          const score = data.ratio * 100 - Math.abs(data.top);
          
          if (score > bestScore) {
            bestScore = score;
            bestCategory = category;
          }
        });

        if (bestCategory) {
          setActiveCategory(bestCategory);
        }
      }
    }, observerOptions);

    // Observer toutes les sections
    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observerRef.current.observe(ref);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      intersectingEntries.clear();
    };
  }, [products]);

  // Chargement initial de TOUTES les données
  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);

      const productsData = productsResponse.success
        ? productsResponse.data || []
        : Array.isArray(productsResponse)
        ? productsResponse
        : [];

      const categoriesData = categoriesResponse.success
        ? categoriesResponse.data || []
        : Array.isArray(categoriesResponse)
        ? categoriesResponse
        : [];

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Erreur chargement:", err);
      setError(err.message);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Scroll vers une catégorie spécifique avec scrollIntoView
  const scrollToCategory = (category) => {
    // Mettre à jour immédiatement la catégorie active
    setActiveCategory(category);
    
    const element = categoryRefs.current[category];
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start", // Aligne le haut de l'élément avec le haut du viewport
      });
    }
  };

  // ✅ Grouper les produits par catégorie
  const getGroupedProducts = () => {
    const grouped = {};

    products.forEach((product) => {
      const cat = product.category?.toUpperCase() || "AUTRES";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(product);
    });

    return grouped;
  };

  const getCategoryOrder = () => {
    return ["SUSHI", "BOWL", "BAO", "SPRING", "MINI-BOWL", "TAPAS", "BOISSONS", "AUTRES"];
  };

  const getSortedCategories = () => {
    const order = getCategoryOrder();
    const uniqueCategories = [...new Set(categories.map((cat) => cat.toUpperCase()))];

    return uniqueCategories.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  // Compte les produits par catégorie
  const getProductCountByCategory = (category) => {
    return products.filter(
      (p) => p.category?.toUpperCase() === category.toUpperCase()
    ).length;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Chargement du menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <p>❌ Erreur: {error}</p>
          <button onClick={loadInitialData} className="btn btn--primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const groupedProducts = getGroupedProducts();

  return (
    <main className="home">
      <Hero />
      <ServiceStatus showHoursButton={true} />

      <div className="container__home" id="menu">
        <img
          src="/images/coriande.png"
          alt="Décoration"
          className="menu__overlay-image"
        />

        <h1>La carte</h1>

        {/* ✅ Filtres avec Scroll Spy */}
        <div className="home__filters">
          

          {getSortedCategories().map((cat) => {
            const count = getProductCountByCategory(cat);
            if (count === 0) return null;

            return (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`home__filter-btn ${
                  activeCategory === cat ? "home__filter-btn--active" : ""
                }`}
              >
                <span className="filter-btn__label">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* ✅ Affichage par catégories avec refs pour Scroll Spy */}
        <div className="home__results">
          {Object.keys(groupedProducts).length > 0 ? (
            getCategoryOrder()
              .filter((cat) => groupedProducts[cat])
              .map((category) => (
                <div
                  key={category}
                  className="home__category-section"
                  data-category={category}
                  ref={(el) => (categoryRefs.current[category] = el)}
                >
                  <div className="home__category-header">
                    <h2 className="home__category-title">{category}</h2>
                    <span className="home__category-count">
                      {groupedProducts[category].length} produit
                      {groupedProducts[category].length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="home__products">
                    {groupedProducts[category].map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <div className="home__empty">
              <p>🍜 Aucun produit disponible pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;