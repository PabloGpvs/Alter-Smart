const { Router } = require('express');
const { registrarRotasCrud } = require('../../core/crud/crud.controller');
const controller = require('./rotinas.controller');

const router = registrarRotasCrud(Router(), '/rotinas', controller);
router.post('/rotinas/:id/acoes', controller.adicionarAcao);
router.post('/rotinas/:id/executar', controller.executar);
router.delete('/acoes/:id', controller.removerAcao);

module.exports = router;
