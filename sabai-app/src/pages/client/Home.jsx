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

  // Animation lors de changement de catégorie
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  // Déclenchement animation
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 300);
    return () => clearTimeout(timer);
  }, [selectedCategory, products.length]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.getProducts(selectedCategory),
        selectedCategory === null
          ? api.getCategories()
          : Promise.resolve(categories),
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
      if (selectedCategory === null) {
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
      setError(err.message);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

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

  const getCategoryOrder = () => {
    return ["Entrées", "Sushi", "Bowl", "Banh Mi","Boissons"];
  };

  const getSortedCategories = () => {
    const order = getCategoryOrder();
    return categories.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
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
      <ServiceStatus showHoursButton={true} />

      <div className="container__home" id="menu">
        <img
          src="/images/coriande.png"
          alt="Décoration"
          className="menu__overlay-image"
        />

        <h1>La carte</h1>

        <div className="home__filters">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`home__filter-btn ${
              selectedCategory === null ? "home__filter-btn--active" : ""
            }`}
          >
            Tous
          </button>

          {getSortedCategories().map((cat) => (
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

        {/* Liste des produits avec FADE automatique */}
        {showByCategory ? (
          Object.keys(groupedProducts).length > 0 ? (
            getCategoryOrder()
              .filter((cat) => groupedProducts[cat])
              .map((category) => (
                <div key={category} className="home__category-section">
                  <h2 className="home__category-title">{category}</h2>

                  <div
                    className={`home__products ${
                      animate ? "fade" : ""
                    }`}
                  >
                    {groupedProducts[category].map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))
          ) : (
            <p className="home__empty">Aucun produit disponible</p>
          )
        ) : products.length > 0 ? (
          <div className={`home__products ${animate ? "fade" : ""}`}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="home__empty">
            Aucun produit disponible dans cette catégorie
          </p>
        )}
      </div>
    </main>
  );
};

export default Home;
