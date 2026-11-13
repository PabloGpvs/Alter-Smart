/** Endereços do usuário. */
const { criarServicoCrud } = require('../../core/crud/crud.service');
const repo = require('./enderecos.repository');

module.exports = criarServicoCrud({ repo, recurso: 'enderecos' });
