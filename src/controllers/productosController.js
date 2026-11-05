const pool = require('../config/db');

async function listarProductos(req, res, next) {
  try {
    const [productos] = await pool.execute('SELECT * FROM productos ORDER BY id');
    res.status(200).json(productos);
  } catch (error) {
    next(error);
  }
}

async function crearProducto(req, res, next) {
  const { nombre, descripcion, precio, stock } = req.producto;
  try {
    const [resultado] = await pool.execute(
      'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
      [nombre, descripcion, precio, stock],
    );
    res.location(`/api/productos/${resultado.insertId}`).status(201).json({
      id: resultado.insertId, nombre, descripcion, precio: precio.toFixed(2), stock,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { listarProductos, crearProducto };
