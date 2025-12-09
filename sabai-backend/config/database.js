// ===== config/database.js =====
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 8889,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'sabai_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDB() {
  try {
    pool = mysql.createPool(dbConfig);
    const connection = await pool.getConnection();
    console.log('✓ Connexion à la base de données réussie');
    const [tables] = await connection.query("SHOW TABLES");
    console.log(`✓ ${tables.length} tables trouvées dans la base de données`);
    connection.release();
  } catch (error) {
    console.error('✗ Erreur de connexion à la base de données:', error.message);
    throw error;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Pool de connexions non initialisé');
  }
  return pool;
}

module.exports = { initDB, getPool };