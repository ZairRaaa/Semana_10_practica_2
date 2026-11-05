function validarId(req, res, next) {
  const { id } = req.params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 4294967295) {
    return res.status(400).json({ error: 'El id debe ser un entero entre 1 y 4294967295' });
  }
  req.productoId = Number(id);
  next();
}

module.exports = validarId;
