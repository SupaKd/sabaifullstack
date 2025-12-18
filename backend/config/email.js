// ===== config/email.js ===== (VERSION AMÉLIORÉE)
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuration du transporter avec pool de connexions
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true, // ✨ Utilise un pool de connexions
  maxConnections: 5,
  maxMessages: 100,
  rateLimit: 10 // Max 10 emails par seconde
});

// Vérifier la connexion au démarrage
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Configuration email invalide:', error.message);
    console.warn('⚠️  Les emails ne pourront pas être envoyés');
  } else {
    console.log('✓ Service email prêt');
  }
});

/**
 * ✨ Fonction de retry pour gérer les échecs temporaires
 */
async function sendEmailWithRetry(mailOptions, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✓ Email envoyé (tentative ${attempt}/${retries}):`, mailOptions.to);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`✗ Erreur envoi email (tentative ${attempt}/${retries}):`, error.message);
      
      // Si c'est la dernière tentative, on abandonne
      if (attempt === retries) {
        return { success: false, error: error.message };
      }
      
      // Attendre avant de réessayer (backoff exponentiel)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

/**
 * Email de confirmation de commande
 */
async function sendConfirmationEmail(
  email, 
  name, 
  orderId, 
  total, 
  items, 
  delivery_date, 
  delivery_time, 
  order_type = 'delivery'
) {
  // Validation des paramètres
  if (!email || !name || !orderId || !delivery_date || !delivery_time) {
    console.error('✗ Paramètres manquants pour l\'email de confirmation');
    return { success: false, error: 'Paramètres manquants' };
  }

  // Texte dynamique selon le type de commande
  const orderTypeLabel = order_type === 'delivery' ? '🚚 Livraison' : '🛍️ À emporter';
  const actionText = order_type === 'delivery' ? 'livraison' : 'retrait';
  const deliveryMessage = order_type === 'delivery' 
    ? 'Nous préparons votre commande avec soin et vous livrerons à l\'heure indiquée.'
    : 'Nous préparons votre commande avec soin. Vous pourrez la retirer directement au restaurant à l\'heure indiquée.';

  const itemsHTML = items.map(item => 
    `<tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(item.price * item.quantity).toFixed(2)}€</td>
    </tr>`
  ).join('');

  const mailOptions = {
    from: `Restaurant Sabai <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `✓ Commande #${orderId} confirmée - Restaurant Sabai`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #2c5530; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Restaurant Sabai</h1>
          <p style="margin: 5px 0 0 0;">Cuisine asiatique authentique</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #2c5530; margin-top: 0;">Merci pour votre commande !</h2>
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>Votre commande <strong>#${orderId}</strong> a bien été reçue et confirmée.</p>
          
          <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff6b35; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 16px;"><strong>Type :</strong> ${orderTypeLabel}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>${actionText.charAt(0).toUpperCase() + actionText.slice(1)} prévu${actionText === 'livraison' ? 'e' : ''} :</strong> ${delivery_date} à ${delivery_time}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c5530;">Détails de la commande</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${itemsHTML}
              <tr>
                <td colspan="2" style="padding: 15px 10px 10px 10px; font-weight: bold; text-align: right;">Total :</td>
                <td style="padding: 15px 10px 10px 10px; font-weight: bold; text-align: right; font-size: 18px; color: #2c5530;">${total.toFixed(2)}€</td>
              </tr>
            </table>
          </div>
          
          <p>${deliveryMessage}</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Pour toute question, n'hésitez pas à nous contacter.</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">Restaurant Sabai - Cuisine asiatique</p>
          <p style="margin: 5px 0 0 0;">Cet email est envoyé automatiquement, merci de ne pas y répondre.</p>
        </div>
      </div>
    `
  };

  return await sendEmailWithRetry(mailOptions);
}

/**
 * Email de changement de statut
 */
async function sendOrderStatusEmail(email, name, orderId, status) {
  if (!email || !name || !orderId || !status) {
    console.error('✗ Paramètres manquants pour l\'email de statut');
    return { success: false, error: 'Paramètres manquants' };
  }

  const statusMessages = {
    confirmed: { 
      title: 'Commande confirmée', 
      emoji: '✅',
      message: 'Votre commande a été confirmée et est en cours de traitement.' 
    },
    preparing: { 
      title: 'En préparation', 
      emoji: '👨‍🍳',
      message: 'Nos chefs préparent votre commande avec soin.' 
    },
    delivering: { 
      title: 'En livraison', 
      emoji: '🚗',
      message: 'Votre commande est en route ! Le livreur arrivera bientôt.' 
    },
    ready: { 
      title: 'Prête à être retirée', 
      emoji: '✅',
      message: 'Votre commande est prête ! Vous pouvez venir la retirer au restaurant.' 
    },
    completed: { 
      title: 'Livrée', 
      emoji: '🎉',
      message: 'Votre commande a été livrée. Bon appétit !' 
    },
    cancelled: { 
      title: 'Annulée', 
      emoji: '❌',
      message: 'Votre commande a été annulée. Si vous avez des questions, contactez-nous.' 
    }
  };

  const statusInfo = statusMessages[status] || { 
    title: 'Mise à jour', 
    emoji: 'ℹ️',
    message: 'Le statut de votre commande a été mis à jour.' 
  };

  const mailOptions = {
    from: `Restaurant Sabai <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${statusInfo.emoji} ${statusInfo.title} - Commande #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #2c5530; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Restaurant Sabai</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #2c5530; margin-top: 0;">${statusInfo.emoji} ${statusInfo.title}</h2>
          <p>Bonjour <strong>${name}</strong>,</p>
          <p>${statusInfo.message}</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Numéro de commande :</strong> #${orderId}</p>
            <p style="margin: 10px 0 0 0;"><strong>Statut :</strong> ${statusInfo.title}</p>
          </div>
          
          <p>Cordialement,<br><strong>L'équipe Sabai</strong></p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">Restaurant Sabai - Cuisine asiatique</p>
        </div>
      </div>
    `
  };

  return await sendEmailWithRetry(mailOptions);
}

/**
 * ✨ NOUVEAU : Email de bienvenue admin (optionnel)
 */
async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: `Restaurant Sabai <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Bienvenue au Restaurant Sabai ! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5530;">Bienvenue ${name} ! 🎉</h2>
        <p>Merci de votre inscription au Restaurant Sabai.</p>
        <p>Nous sommes ravis de vous compter parmi nous !</p>
      </div>
    `
  };

  return await sendEmailWithRetry(mailOptions);
}

module.exports = { 
  sendConfirmationEmail, 
  sendOrderStatusEmail,
  sendWelcomeEmail 
};