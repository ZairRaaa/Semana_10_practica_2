const pool = require('../src/config/db');

async function checkDatabase() {
  try {
    const [connection] = await pool.execute('SELECT DATABASE() AS base');
    const [products] = await pool.execute('SELECT COUNT(*) AS total FROM productos');

    console.log(`Conexión correcta a ${connection[0].base}`);
    console.log(`Tabla productos disponible: ${products[0].total} registros`);
  } catch (error) {
    console.error(`No se pudo verificar la base de datos (${error.code || 'ERROR'}).`);
    console.error('Revisa MySQL en XAMPP, el archivo .env y la importación de database/schema.sql.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkDatabase();
