const { db } = require('../../database/connection');

module.exports = {
  inserirExperimento: (uid, { area, titulo, ambiente_id, dispositivo_id, parametros, resultado }) =>
    db.prepare(`INSERT INTO experimentos(usuario_id,area,titulo,ambiente_id,dispositivo_id,parametros,resultado)
      VALUES(?,?,?,?,?,?,?)`).run(uid, area, titulo, ambiente_id, dispositivo_id, parametros, resultado).lastInsertRowid,

  listarExperimentos: uid => db.prepare(`
    SELECT e.*, a.nome ambiente, d.nome dispositivo FROM experimentos e
    LEFT JOIN ambientes a ON a.id=e.ambiente_id LEFT JOIN dispositivos d ON d.id=e.dispositivo_id
    WHERE e.usuario_id=? ORDER BY e.id DESC`).all(uid),

  removerExperimento: (uid, id) => db.prepare('DELETE FROM experimentos WHERE id=? AND usuario_id=?').run(id, uid).changes,
};
