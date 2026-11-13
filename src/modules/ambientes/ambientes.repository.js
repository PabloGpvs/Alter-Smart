const { criarRepositorioCrud } = require('../../core/crud/crud.repository');

module.exports = criarRepositorioCrud({
  tabela: 'ambientes',
  colunas: ['nome'],
  porUsuario: false,
});
