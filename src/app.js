const express = require('express');
const cors = require('cors');
const path = require('node:path');
const productosRoutes = require('./routes/productosRoutes');
const manejarErrores = require('./middleware/errores');

const app = express();
app.disable('x-powered-by');

app.use(cors());
app.use(express.json());

app.use('/assets', express.static(path.join(__dirname, '..', 'public')));
app.get('/productos', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'API de productos en funcionamiento' });
});

app.use('/api/productos', (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'Usa Content-Type: application/json' });
  }
  next();
}, productosRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(manejarErrores);

module.exports = app;
