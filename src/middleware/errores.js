function manejarErrores(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud contiene JSON inválido' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la solicitud supera el límite de 100 KB' });
  }
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: 'No se pudo interpretar la solicitud' });
  }
  console.error(`Error interno: ${error.code || 'ERROR'}`);
  return res.status(500).json({ error: 'No se pudo completar la operación' });
}

module.exports = manejarErrores;
