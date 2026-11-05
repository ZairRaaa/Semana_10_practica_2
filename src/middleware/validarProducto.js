function validarProducto(req, res, next) {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Envía un objeto JSON con los datos del producto' });
  }

  const allowed = ['nombre', 'descripcion', 'precio', 'stock'];
  if (Object.keys(body).some((key) => !allowed.includes(key))) {
    return res.status(400).json({ error: 'Solo se permiten nombre, descripcion, precio y stock' });
  }
  if (typeof body.nombre !== 'string' || !body.nombre.trim() || [...body.nombre.trim()].length > 100) {
    return res.status(400).json({ error: 'El nombre es obligatorio y debe tener entre 1 y 100 caracteres' });
  }
  if (typeof body.precio !== 'number' || !Number.isFinite(body.precio)
      || !/^\d{1,8}(\.\d{1,2})?$/.test(String(body.precio))) {
    return res.status(400).json({ error: 'El precio debe ser un número entre 0 y 99999999.99 con hasta dos decimales' });
  }
  if (!Number.isInteger(body.stock) || body.stock < 0 || body.stock > 2147483647) {
    return res.status(400).json({ error: 'El stock debe ser un entero entre 0 y 2147483647' });
  }
  if (body.descripcion !== undefined && body.descripcion !== null
      && (typeof body.descripcion !== 'string' || Buffer.byteLength(body.descripcion, 'utf8') > 65535)) {
    return res.status(400).json({ error: 'La descripción debe ser texto de hasta 65535 bytes o null' });
  }

  req.producto = {
    nombre: body.nombre.trim(),
    descripcion: body.descripcion ?? null,
    precio: body.precio,
    stock: body.stock,
  };
  next();
}

module.exports = validarProducto;
