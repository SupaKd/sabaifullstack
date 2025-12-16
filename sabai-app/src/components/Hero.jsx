import { useState } from "react";

function Hero() {
  const [ready, setReady] = useState(false);

  return (
    <section className="hero">
      <div className="home__hero">
        <div className={`hero__video ${ready ? "ready" : ""}`}>
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onCanPlayThrough={() => setReady(true)}
          >
            <source src="/video/bamboo.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="container__hero">
          <div className="hero__logo-wrapper">
            <img
              src="/images/logonoel.png"
              alt="Logo Sabai"
              className="hero__logo"
            />
          </div>

          <p className="home__hero-subtitle">
            Des plats authentiques préparés avec passion, pour un voyage culinaire unique.
          </p>

          <a href="#menu" className="hero__cta">
            COMMANDER
          </a>
        </div>
      </div>
    </section>
  );
}

export default Hero;
