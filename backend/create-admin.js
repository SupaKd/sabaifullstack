const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createAdmin() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 8889,
      user: 'root',
      password: 'root',
      database: 'sabai_db2'
    });

    const username = 'admin';
    const password = 'admin123';
    
    // Générer le hash
    const hash = await bcrypt.hash(password, 10);
    
    console.log('=== CRÉATION ADMIN ===');
    console.log('Username:', username);
    console.log('Password:', password);
    console.log('Nouveau hash:', hash);
    
    // Supprimer l'ancien admin
    await connection.query('DELETE FROM admin_users WHERE username = ?', [username]);
    console.log('✓ Ancien admin supprimé');
    
    // Créer le nouveau
    await connection.query(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [username, hash]
    );
    console.log('✓ Nouvel admin créé');
    
    // Vérifier
    const [users] = await connection.query('SELECT * FROM admin_users WHERE username = ?', [username]);
    console.log('✓ Hash en BDD:', users[0].password_hash);
    
    // Tester
    const isValid = await bcrypt.compare(password, users[0].password_hash);
    console.log('✓ Test bcrypt.compare:', isValid);
    
    if (isValid) {
      console.log('✅ SUCCESS ! Vous pouvez maintenant vous connecter avec:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('❌ ERREUR : Le hash ne fonctionne pas');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createAdmin();