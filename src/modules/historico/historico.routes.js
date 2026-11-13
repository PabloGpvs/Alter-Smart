const { Router } = require('express');
const controller = require('./historico.controller');

const router = Router();
router.get('/historico', controller.listar);
router.delete('/historico', controller.limpar);

module.exports = router;
