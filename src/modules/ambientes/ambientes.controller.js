const { criarControllerCrud } = require('../../core/crud/crud.controller');
const service = require('./ambientes.service');

module.exports = criarControllerCrud(service);
