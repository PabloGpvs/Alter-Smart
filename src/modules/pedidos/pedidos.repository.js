const { db } = require('../../database/connection');

module.exports = {
  listar: uid => db.prepare(`
    SELECT p.*, sv.titulo, sv.preco_estimado, a.nome ambiente FROM pedidos_servicos p
    JOIN servicos sv ON sv.id=p.servico_id LEFT JOIN ambientes a ON a.id=p.ambiente_id
    WHERE p.usuario_id=? ORDER BY p.id DESC`).all(uid),

  buscarPorId: (uid, id) => db.prepare('SELECT * FROM pedidos_servicos WHERE id=? AND usuario_id=?').get(id, uid),

  inserir: (uid, servicoId, ambienteId, observacao) =>
    db.prepare('INSERT INTO pedidos_servicos(usuario_id,servico_id,ambiente_id,observacao) VALUES(?,?,?,?)')
      .run(uid, servicoId, ambienteId, observacao).lastInsertRowid,

  atualizar: (id, status, observacao) =>
    db.prepare('UPDATE pedidos_servicos SET status=?, observacao=? WHERE id=?').run(status, observacao, id),

  remover: (uid, id) => db.prepare('DELETE FROM pedidos_servicos WHERE id=? AND usuario_id=?').run(id, uid).changes,
};
