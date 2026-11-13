const { criarRepositorioCrud } = require('../../core/crud/crud.repository');

module.exports = criarRepositorioCrud({
  tabela: 'servicos',
  colunas: ['titulo', 'descricao', 'preco_estimado'],
  porUsuario: false,
});
