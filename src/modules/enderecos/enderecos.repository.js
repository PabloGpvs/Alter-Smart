const { criarRepositorioCrud } = require('../../core/crud/crud.repository');

module.exports = criarRepositorioCrud({
  tabela: 'enderecos',
  colunas: ['rua', 'numero'],
  porUsuario: true,
});
