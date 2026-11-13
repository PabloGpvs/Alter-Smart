/** Catálogo de serviços que podem ser pedidos (global). */
const { criarServicoCrud } = require('../../core/crud/crud.service');
const repo = require('./servicos.repository');

module.exports = criarServicoCrud({ repo, recurso: 'servicos' });
