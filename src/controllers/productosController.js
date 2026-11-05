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

async function obtenerProducto(req, res, next) {
  try {
    const [productos] = await pool.execute('SELECT * FROM productos WHERE id = ?', [req.productoId]);
    if (!productos.length) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.status(200).json(productos[0]);
  } catch (error) {
    next(error);
  }
}

async function actualizarProducto(req, res, next) {
  const { nombre, descripcion, precio, stock } = req.producto;
  try {
    const [resultado] = await pool.execute(
      'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?',
      [nombre, descripcion, precio, stock, req.productoId],
    );
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.status(200).json({ id: req.productoId, nombre, descripcion, precio: precio.toFixed(2), stock });
  } catch (error) {
    next(error);
  }
}

async function eliminarProducto(req, res, next) {
  try {
    const [resultado] = await pool.execute('DELETE FROM productos WHERE id = ?', [req.productoId]);
    if (!resultado.affectedRows) return res.status(404).json({ error: 'Producto no encontrado' });
    return res.status(200).json({ mensaje: 'Producto eliminado', id: req.productoId });
  } catch (error) {
    next(error);
  }
}

module.exports = { listarProductos, crearProducto, obtenerProducto, actualizarProducto, eliminarProducto };
