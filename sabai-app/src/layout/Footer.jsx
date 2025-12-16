import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faPhone,
  faEnvelope,
  faClock,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram } from "@fortawesome/free-brands-svg-icons";

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
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="footer__icon"
                />
                <span>42 Chem. de la Praille, 01710 Thoiry</span>
              </div>
              <div className="footer__contact-item">
                <FontAwesomeIcon icon={faPhone} className="footer__icon" />
                <span>+33 6 78 35 71 98</span>
              </div>
              <div className="footer__contact-item">
                <FontAwesomeIcon icon={faEnvelope} className="footer__icon" />
                <span>contact@sabai-thoiry.com</span>
              </div>
            </div>
          </div>

          {/* HORAIRES */}
          <div className="footer__section">
            <h4 className="footer__title">
              <FontAwesomeIcon icon={faClock} className="footer__title-icon" />
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
              <a href="#" className="footer__social-link" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>

              <a
                href="#"
                className="footer__social-link"
                aria-label="Instagram"
              >
                <FontAwesomeIcon icon={faInstagram} />
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
              <FontAwesomeIcon icon={faHeart} className="footer__heart" /> à
              Thoiry.
            </p>
            <p>
              Powered by{" "}
              <a href="https://supaco-digital.com" className="supaco">Supaco</a>
            </p>

            <div className="footer__legal">
              <Link to="/mention">Mentions légales</Link>
              <span>•</span>
              <Link to="/politique">Politique de confidentialité</Link>
              <span>•</span>
              <Link to="/cgv">CGV</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
