const { db } = require('../../database/connection');

module.exports = {
  buscarUsuarioPorEmail: email => db.prepare('SELECT * FROM usuarios WHERE email=?').get(email),

  inserirUsuario: (nome, email, senhaHash) =>
    db.prepare('INSERT INTO usuarios(nome,email,senha) VALUES(?,?,?)').run(nome, email, senhaHash).lastInsertRowid,

  inserirSessao: (token, uid) => db.prepare('INSERT INTO sessoes(token,usuario_id) VALUES(?,?)').run(token, uid),

  buscarSessao: token => db.prepare('SELECT usuario_id FROM sessoes WHERE token=?').get(token),

  removerSessao: token => db.prepare('DELETE FROM sessoes WHERE token=?').run(token),
};
