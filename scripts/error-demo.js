require('dotenv').config({ quiet: true });

// Instancia local de demostración: fuerza una conexión no disponible.
// No modifica .env, no detiene MySQL y no añade rutas especiales al servidor.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.PORT = '3001';

console.log('Demostración de error 500 en http://127.0.0.1:3001/api/productos');
require('../src/server');
