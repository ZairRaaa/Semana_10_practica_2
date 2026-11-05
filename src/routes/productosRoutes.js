const express = require('express');
const controller = require('../controllers/productosController');
const validarProducto = require('../middleware/validarProducto');

const router = express.Router();

router.get('/', controller.listarProductos);
router.post('/', validarProducto, controller.crearProducto);

module.exports = router;
