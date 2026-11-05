const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ mensaje: 'API de productos en funcionamiento' });
});

module.exports = app;
