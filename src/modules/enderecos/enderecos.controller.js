const { criarControllerCrud } = require('../../core/crud/crud.controller');
const service = require('./enderecos.service');

module.exports = criarControllerCrud(service);
