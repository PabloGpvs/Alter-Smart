const { Router } = require('express');
const { registrarRotasCrud } = require('../../core/crud/crud.controller');
const controller = require('./servicos.controller');

// GET/POST /servicos   ·   PUT/DELETE /servicos/:id
module.exports = registrarRotasCrud(Router(), '/servicos', controller);
