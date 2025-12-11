require('dotenv').config();
const { sendConfirmationEmail, sendOrderStatusEmail } = require('./config/email');

async function testEmails() {
  console.log('🧪 Test 1 : Email de confirmation...');
  const result1 = await sendConfirmationEmail(
    'ton-email-perso@gmail.com',  // ⚠️ Remplace par ton email
    'Jean Dupont',
    'TEST-001',
    34.50,
    [
      { name: 'Pad Thai Poulet', quantity: 2, price: 12.00 },
      { name: 'Soupe Tom Yum', quantity: 1, price: 5.50 }
    ],
    '2025-12-15',
    '19:30',
    'delivery'
  );
  console.log('Résultat 1:', result1);

  console.log('\n🧪 Test 2 : Email de changement de statut...');
  const result2 = await sendOrderStatusEmail(
    'supaco.digital@gmail.com',  // ⚠️ Remplace par ton email
    'Jean Dupont',
    'TEST-001',
    'preparing'
  );
  console.log('Résultat 2:', result2);
}

testEmails();