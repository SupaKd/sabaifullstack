import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBarsStaggered,
  faXmark,
  faBasketShopping,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faInstagram } from "@fortawesome/free-brands-svg-icons";

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
            <Link to="/cart" className="navbar__cart-link">
              <FontAwesomeIcon
                icon={faBasketShopping}
                className="navbar__cart-icon"
              />
              {getItemCount() > 0 && (
                <span className="navbar__cart-badge">{getItemCount()}</span>
              )}
            </Link>

            <button
              className={`navbar__burger ${
                isMenuOpen ? "navbar__burger--open" : ""
              }`}
              onClick={toggleMenu}
              aria-label="Menu"
            >
              <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBarsStaggered} />
            </button>
          </div>

          {/* Menu */}
          <div
            className={`navbar__menu ${isMenuOpen ? "navbar__menu--open" : ""}`}
          >
            
            <div className="navbar__social">
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="navbar__link"
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faInstagram} className="navbar__icon" />
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="navbar__link"
                onClick={closeMenu}
              >
                <FontAwesomeIcon icon={faFacebook} className="navbar__icon" />
              </a>
            </div>

            
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
