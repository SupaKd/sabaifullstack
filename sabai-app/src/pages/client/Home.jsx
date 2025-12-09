// ===== src/pages/client/Home.jsx ===== (VERSION CORRIGÉE)
import { useState, useEffect } from "react";
import api from "../../services/api";
import ProductCard from "../../components/ProductCard";
import Hero from "../../components/Hero";
import ServiceStatus from "../../components/ServiceStatus";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  // ✅ FONCTION CORRIGÉE
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [productsResponse, categoriesResponse] = await Promise.all([
        api.getProducts(selectedCategory),
        selectedCategory === null
          ? api.getCategories()
          : Promise.resolve(categories),
      ]);

      // ✅ Gérer le format { success: true, data: [...] } ou [...]
      const productsData = productsResponse.success 
        ? (productsResponse.data || [])
        : (Array.isArray(productsResponse) ? productsResponse : []);
      
      const categoriesData = categoriesResponse.success
        ? (categoriesResponse.data || [])
        : (Array.isArray(categoriesResponse) ? categoriesResponse : []);

      setProducts(productsData);
      if (selectedCategory === null) {
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError(err.message);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les produits par catégorie
  const getGroupedProducts = () => {
    const grouped = {};

    products.forEach((product) => {
      const cat = product.category || "Autres";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(product);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Erreur: {error}</div>
      </div>
    );
  }

  const groupedProducts = getGroupedProducts();
  const showByCategory = selectedCategory === null;

  return (
    <main className="home">
      <Hero />

      {/* Service Status */}
      <ServiceStatus showHoursButton={true} />

      <div className="container__home" id="menu">
        {/* Image décorative */}
        <img
          src="/images/coriande.png"
          alt="Décoration"
          className="menu__overlay-image"
        />
        
        <div className="title">
          <h1>Notre carte</h1>
        </div>

        {/* Filtres de catégories */}
        <div className="home__filters">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`home__filter-btn ${
              selectedCategory === null ? "home__filter-btn--active" : ""
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`home__filter-btn ${
                selectedCategory === cat ? "home__filter-btn--active" : ""
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Liste des produits */}
        {showByCategory ? (
          // Afficher par catégories quand "Tous" est sélectionné
          Object.keys(groupedProducts).length > 0 ? (
            Object.keys(groupedProducts).map((category) => (
              <div key={category} className="home__category-section">
                <h2 className="home__category-title">{category}</h2>
                <div className="home__products">
                  {groupedProducts[category].map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="home__empty">Aucun produit disponible</p>
          )
        ) : (
          // Afficher sans titre de catégorie quand une catégorie spécifique est sélectionnée
          products.length > 0 ? (
            <div className="home__products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="home__empty">
              Aucun produit disponible dans cette catégorie
            </p>
          )
        )}
      </div>
    </main>
  );
};

export default Home;