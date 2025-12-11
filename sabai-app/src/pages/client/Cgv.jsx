import React from 'react';

const ConditionsGeneralesVente = () => {
  return (
    <div className="conditions-generales">
      <h1>Conditions Générales de Vente</h1>
      <p className="date-mise-a-jour">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </p>

      <section className="section">
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions définissent les règles applicables aux commandes
          effectuées sur le site du restaurant.
        </p>
      </section>

      <section className="section">
        <h2>2. Commandes</h2>
        <p>
          Toute commande passée en ligne vaut acceptation des prix, des produits
          et des présentes conditions. Une confirmation est envoyée au Client après paiement.
        </p>
      </section>

      <section className="section">
        <h2>3. Prix</h2>
        <p>
          Les prix sont affichés en euros TTC. Les frais de livraison, lorsqu’ils
          s’appliquent, sont indiqués avant validation de la commande.
        </p>
      </section>

      <section className="section">
        <h2>4. Livraison et retrait</h2>
        <p>
          La livraison est disponible dans la zone affichée sur le site.
          Les délais peuvent varier selon l’affluence.  
          Le retrait est possible au restaurant aux horaires indiqués.
        </p>
      </section>

      <section className="section">
        <h2>5. Paiement</h2>
        <p>
          Les paiements en ligne sont sécurisés. Aucun numéro de carte bancaire
          n’est stocké par le restaurant.
        </p>
      </section>

      <section className="section">
        <h2>6. Allergènes</h2>
        <p>
          Les plats peuvent contenir des allergènes. Le Client doit nous informer
          de toute allergie avant de passer commande.
        </p>
      </section>

      <section className="section">
        <h2>7. Réclamations</h2>
        <p>
          Toute réclamation concernant une commande doit être signalée rapidement
          par téléphone ou par email. Une solution sera proposée selon la situation.
        </p>
      </section>

      <section className="section">
        <h2>8. Annulation</h2>
        <p>
          Une commande peut être annulée uniquement si sa préparation n’a pas commencé.
          Après préparation ou expédition, aucune annulation n’est possible.
        </p>
      </section>

      <section className="section">
        <h2>9. Données personnelles</h2>
        <p>
          Les données collectées sont utilisées uniquement pour le traitement des commandes.
          En savoir plus dans notre Politique de Confidentialité.
        </p>
      </section>

      <section className="section">
        <h2>10. Rétractation</h2>
        <p>
          Le droit de rétractation ne s’applique pas aux repas préparés à la demande
          (Article L221-28 du Code de la consommation).
        </p>
      </section>

      <section className="section">
        <h2>11. Informations légales</h2>
        <ul>
          <li>Restaurant : [Nom]</li>
          <li>Adresse : [Adresse]</li>
          <li>SIRET : [Numéro]</li>
          <li>Email : contact@restaurant.com</li>
        </ul>
      </section>

      <div className="acceptation">
        <p>
          En validant votre commande, vous acceptez les présentes conditions générales de vente.
        </p>
      </div>
    </div>
  );
};

export default ConditionsGeneralesVente;
