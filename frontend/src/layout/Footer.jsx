import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Heart,
  Facebook,
  Instagram,
} from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        {/* SECTION CONTENU */}
        <div className="footer__main">
          {/* CONTACT */}
          <div className="footer__section">
            <div className="footer__logo">
              <img
                src="/images/logosabai.png"
                alt="Logo Sabai"
                className="footer__logo-image"
              />
              <span className="footer__logo-subtitle">Asian Cuisine</span>
            </div>

            <div className="footer__contact">
              <div className="footer__contact-item">
                <MapPin size={16} className="footer__icon" />
                <span>42 Chem. de la Praille, 01710 Thoiry</span>
              </div>
              <div className="footer__contact-item">
                <Phone size={16} className="footer__icon" />
                <span>+33 6 78 35 71 98</span>
              </div>
              <div className="footer__contact-item">
                <Mail size={16} className="footer__icon" />
                <span>contact@sabai-thoiry.com</span>
              </div>
            </div>
          </div>

          {/* HORAIRES */}
          <div className="footer__section">
            <h4 className="footer__title">
              <Clock size={16} className="footer__title-icon" />
              Nos Horaires
            </h4>

            <div className="footer__schedule">
              <div className="footer__schedule-item">
                <span className="footer__days">Lun - Sam</span>
                <span className="footer__hours">11h – 22h</span>
              </div>
            </div>
          </div>

          {/* RESEAUX */}
          <div className="footer__section">
            <h4 className="footer__title">Suivez-nous</h4>

            <div className="footer__social">
              <a href="https://www.facebook.com/people/Sabai/100064120840653/#" className="footer__social-link" aria-label="Facebook">
                <Facebook size={18} />
              </a>

              <a
                href="https://www.instagram.com/restaurantlesabai/?hl=fr"
                className="footer__social-link"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* BAS DE PAGE */}
        <div className="footer__bottom">
          <div className="footer__divider"></div>

          <div className="footer__copyright">
            <p>
              © 2025 SABAI. Fait avec
              <Heart size={14} className="footer__heart" fill="currentColor" /> à
              Thoiry.
            </p>
            <p>
              Powered by{" "}
              <a href="https://supaco-digital.com" className="supaco">Supaco</a>
            </p>

           {/* <div className="footer__legal">
              <Link to="/mention">Mentions légales</Link>
              <span>•</span>
              <Link to="/politique">Politique de confidentialité</Link>
              <span>•</span>
              <Link to="/cgv">CGV</Link>
            </div>
            */}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;