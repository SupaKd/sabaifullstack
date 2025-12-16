import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

// FontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBasketShopping } from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";

function Navbar() {
  const { getItemCount } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar__container">
        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          <img src="/images/logonoel.png" alt="logo" />
        </Link>

        {/* Actions */}
        <div className="navbar__actions">
          <div className="navbar__right">
            <a
              href="https://www.instagram.com/restaurantlesabai/?hl=fr"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar__instagram"
            >
              <FontAwesomeIcon icon={faInstagram} />
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

        {isMenuOpen && (
          <div className="navbar__overlay" onClick={closeMenu}></div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
