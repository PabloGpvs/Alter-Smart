/** Cômodos da casa (catálogo global, compartilhado entre usuários). */
const { criarServicoCrud } = require('../../core/crud/crud.service');
const repo = require('./ambientes.repository');

module.exports = criarServicoCrud({ repo, recurso: 'ambientes' });
