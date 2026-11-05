const express = require('express');
const controller = require('../controllers/productosController');
const validarProducto = require('../middleware/validarProducto');
const validarId = require('../middleware/validarId');

const router = express.Router();

router.get('/', controller.listarProductos);
router.post('/', validarProducto, controller.crearProducto);
router.get('/:id', validarId, controller.obtenerProducto);
router.put('/:id', validarId, validarProducto, controller.actualizarProducto);
router.delete('/:id', validarId, controller.eliminarProducto);

module.exports = router;
