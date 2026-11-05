require('dotenv').config({ quiet: true });

const mysql = require('mysql2/promise');

// IA: índice dañado en mysql.proxies_priv → Solución manual: respaldar la tabla,
// reconstruir con USE_FRM y verificar CHECK TABLE antes de conectar.

if (!process.env.DB_USER || !process.env.DB_NAME) {
  throw new Error('Completa DB_USER y DB_NAME en el archivo .env');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
});

module.exports = pool;
