const { Router } = require('express');
const { registrarRotasCrud } = require('../../core/crud/crud.controller');
const controller = require('./dispositivos.controller');

const router = registrarRotasCrud(Router(), '/dispositivos', controller);
router.post('/dispositivos/:id/termostato', controller.termostato);

module.exports = router;
