const { db } = require('../../database/connection');

module.exports = {
  inserir: (uid, tipo, descricao) =>
    db.prepare('INSERT INTO historico_transacoes(usuario_id,tipo,descricao) VALUES(?,?,?)').run(uid, tipo, descricao),

  listar: (uid, limite = 200) =>
    db.prepare('SELECT * FROM historico_transacoes WHERE usuario_id=? ORDER BY id DESC LIMIT ?').all(uid, limite),

  limpar: uid => db.prepare('DELETE FROM historico_transacoes WHERE usuario_id=?').run(uid),
};
