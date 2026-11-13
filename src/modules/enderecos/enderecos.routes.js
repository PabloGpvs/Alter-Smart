const { Router } = require('express');
const { registrarRotasCrud } = require('../../core/crud/crud.controller');
const controller = require('./enderecos.controller');

// GET/POST /enderecos   ·   PUT/DELETE /enderecos/:id
module.exports = registrarRotasCrud(Router(), '/enderecos', controller);
