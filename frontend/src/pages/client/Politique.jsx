import React from 'react';

const PolitiqueConfidentialite = () => {
  return (
    <div className="politique-confidentialite">
      <h1>Politique de Confidentialité</h1>
      <p className="date-mise-a-jour">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <section className="section">
        <h2>1. Données collectées</h2>
        <p>
          Nous collectons uniquement les informations nécessaires au traitement des commandes :
          nom, email, téléphone, adresse, et informations liées à la commande.
        </p>
      </section>

      <section className="section">
        <h2>2. Utilisation des données</h2>
        <p>
          Les données sont utilisées pour traiter les commandes, assurer le suivi, et améliorer le service.
        </p>
      </section>

      <section className="section">
        <h2>3. Partage</h2>
        <p>
          Les données ne sont jamais vendues. Elles peuvent être partagées uniquement avec nos prestataires
          (livraison, paiement) lorsque nécessaire.
        </p>
      </section>

      <section className="section">
        <h2>4. Durée de conservation</h2>
        <p>
          Les données sont conservées uniquement le temps nécessaire au service et aux obligations légales.
        </p>
      </section>

      <section className="section">
        <h2>5. Vos droits</h2>
        <p>
          Vous pouvez demander l’accès, la rectification ou la suppression de vos données
          en nous contactant à : confidentialite@restaurant.com.
        </p>
      </section>

      <section className="section">
        <h2>6. Cookies</h2>
        <p>
          Des cookies techniques peuvent être utilisés pour le bon fonctionnement du site.
        </p>
      </section>

      <section className="section">
        <h2>7. Contact</h2>
        <p>
          Pour toute demande liée à vos données : confidentialite@restaurant.com.
        </p>
      </section>

      <p className="consentement">
        En utilisant notre site, vous acceptez cette politique.
      </p>
    </div>
  );
};

export default PolitiqueConfidentialite;
