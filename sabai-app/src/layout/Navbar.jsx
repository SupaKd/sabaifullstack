import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBasketShopping,
  faPhoneFlip,
} from "@fortawesome/free-solid-svg-icons";

function Navbar() {
  const { getItemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          <img src="/images/logosabai.png" alt="logo" />
        </Link>

        {/* Actions : Panier + Burger */}
        <div className="navbar__actions">
          <div className="navbar__right">
          <a href="tel:+33678357198" className="navbar__cart-link">
          <FontAwesomeIcon icon={faPhoneFlip} />
        </a>
            <Link to="/cart" className="navbar__cart-link">
              <FontAwesomeIcon
                icon={faBasketShopping}
                className="navbar__cart-icon"
              />
              {getItemCount() > 0 && (
                <span className="navbar__cart-badge">{getItemCount()}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Fond noir clickable quand menu ouvert */}
        {isMenuOpen && (
          <div className="navbar__overlay" onClick={closeMenu}></div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
