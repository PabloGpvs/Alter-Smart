const { db } = require('../../database/connection');
const { criarRepositorioCrud } = require('../../core/crud/crud.repository');

const crud = criarRepositorioCrud({ tabela: 'rotinas', colunas: ['nome', 'descricao'] });

const SQL_ACOES = `SELECT a.*, d.nome dispositivo FROM rotina_acoes a
  JOIN dispositivos d ON d.id=a.dispositivo_id WHERE a.rotina_id=?`;

module.exports = {
  ...crud,

  listarAcoes: rotinaId => db.prepare(SQL_ACOES).all(rotinaId),

  inserirAcao: (rotinaId, dispositivoId, acao) =>
    db.prepare('INSERT INTO rotina_acoes(rotina_id,dispositivo_id,acao) VALUES(?,?,?)').run(rotinaId, dispositivoId, acao),

  removerAcao: (uid, acaoId) =>
    db.prepare('DELETE FROM rotina_acoes WHERE id=? AND rotina_id IN (SELECT id FROM rotinas WHERE usuario_id=?)').run(acaoId, uid),
};
