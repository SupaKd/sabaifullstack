function Hero() {
  return (
    <section className="hero">
      <div className="home__hero">
        <div className="hero__video">
          <video className="hero__video-file" autoPlay loop muted playsInline>
            <source src="/video/bamboo.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="container__hero">
          <div className="hero__logo-wrapper">
            <img
              src="/images/logosabai.png"
              alt="Logo Sabai"
              className="hero__logo"
            />
          </div>
          <p className="home__hero-subtitle">
          Des plats authentiques préparés avec passion, pour un voyage culinaire unique.
          </p>
          <a href="#menu" className="hero__cta" aria-label="Accéder au menu">
          COMMANDER
        </a>
        </div>

       
      </div>
    </section>
  );
}
export default Hero;