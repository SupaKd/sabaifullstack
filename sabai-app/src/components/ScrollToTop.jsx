import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // ✅ Ne pas remonter sur la page d'accueil (pour permettre le scroll spy)
    if (pathname === "/" || pathname === "/home") {
      return;
    }
    
    // Remonter en haut pour toutes les autres pages
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}