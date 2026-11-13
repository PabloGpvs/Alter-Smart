const { db } = require('../../database/connection');
const { criarRepositorioCrud } = require('../../core/crud/crud.repository');

const crud = criarRepositorioCrud({
  tabela: 'produtos',
  colunas: ['nome', 'quantidade', 'quantidade_minima'],
  // "baixo" = 1 quando chegou no mínimo (mesma regra do circuito 03 do Logisim)
  consultaLista: 'SELECT *, (quantidade<=quantidade_minima) AS baixo FROM produtos',
});

module.exports = {
  ...crud,
  somarQuantidade: (id, n) => db.prepare('UPDATE produtos SET quantidade=quantidade+? WHERE id=?').run(n, id),
};
