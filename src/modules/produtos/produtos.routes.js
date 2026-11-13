const { Router } = require('express');
const { registrarRotasCrud } = require('../../core/crud/crud.controller');
const controller = require('./produtos.controller');

const router = registrarRotasCrud(Router(), '/produtos', controller);
router.post('/produtos/:id/repor', controller.repor);

module.exports = router;
