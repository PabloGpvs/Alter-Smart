const { Router } = require('express');
const { registrarRotasCrud } = require('../../core/crud/crud.controller');
const controller = require('./ambientes.controller');

// GET/POST /ambientes   ·   PUT/DELETE /ambientes/:id
module.exports = registrarRotasCrud(Router(), '/ambientes', controller);
