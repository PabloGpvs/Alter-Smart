const { Router } = require('express');
const controller = require('./pedidos.controller');

const router = Router();
router.get('/pedidos', controller.listar);
router.post('/pedidos', controller.criar);
router.put('/pedidos/:id', controller.atualizar);
router.delete('/pedidos/:id', controller.cancelar);

module.exports = router;
