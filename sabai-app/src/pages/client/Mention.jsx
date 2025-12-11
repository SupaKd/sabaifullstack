import React from 'react';

const MentionsLegales = () => {
  return (
    <div className="mentions-legales">
      <h1>Mentions légales</h1>
      <p>Mise à jour au {new Date().toLocaleDateString('fr-FR')}</p>

      <section>
        <h2>1. Éditeur du site</h2>
        <ul>
          <li><strong>Nom de l’entreprise :</strong> [Nom]</li>
          <li><strong>Forme juridique :</strong> [SARL / SAS...]</li>
          <li><strong>Adresse :</strong> [Adresse complète]</li>
          <li><strong>SIRET :</strong> [Numéro]</li>
          <li><strong>Email :</strong> contact@site.com</li>
          <li><strong>Téléphone :</strong> [Numéro]</li>
        </ul>
      </section>

      <section>
        <h2>2. Hébergement</h2>
        <ul>
          <li><strong>Hébergeur :</strong> [Nom]</li>
          <li><strong>Adresse :</strong> [Adresse]</li>
          <li><strong>Site web :</strong> <a href="#" target="_blank" rel="noopener noreferrer">[URL]</a></li>
        </ul>
      </section>

      <section>
        <h2>3. Propriété intellectuelle</h2>
        <p>
          Le contenu du site (textes, images, logo) est protégé et ne peut être reproduit sans autorisation.
        </p>
      </section>

      <section>
        <h2>4. Données personnelles</h2>
        <p>
          Les données collectées via le formulaire sont utilisées uniquement pour répondre aux demandes.  
          Vous pouvez demander la suppression de vos données à l’adresse : dpo@site.com.
        </p>
      </section>

      <section>
        <h2>5. Cookies</h2>
        <p>
          Le site peut utiliser des cookies nécessaires à son fonctionnement. Vous pouvez les désactiver via votre navigateur.
        </p>
      </section>

      <section>
        <h2>6. Responsabilité</h2>
        <p>
          L’éditeur ne garantit pas l'exactitude des informations présentes et décline toute responsabilité en cas d’erreur.
        </p>
      </section>

      <section>
        <h2>7. Contact</h2>
        <p>
          Pour toute question : legal@site.com
        </p>
      </section>
    </div>
  );
};

export default MentionsLegales;
