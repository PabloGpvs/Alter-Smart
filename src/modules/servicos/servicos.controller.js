const { criarControllerCrud } = require('../../core/crud/crud.controller');
const service = require('./servicos.service');

module.exports = criarControllerCrud(service);
