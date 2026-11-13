const { db } = require('../../database/connection');
const { criarRepositorioCrud } = require('../../core/crud/crud.repository');

const crud = criarRepositorioCrud({
  tabela: 'dispositivos',
  colunas: ['ambiente_id', 'nome', 'tipo', 'estado'],
  // lista já com o nome do cômodo
  consultaLista: 'SELECT d.*, (SELECT nome FROM ambientes WHERE id=d.ambiente_id) ambiente FROM dispositivos d',
});

module.exports = {
  ...crud,
  alterarEstado: (uid, id, estado) =>
    db.prepare('UPDATE dispositivos SET estado=? WHERE id=? AND usuario_id=?').run(estado, id, uid).changes,
};
