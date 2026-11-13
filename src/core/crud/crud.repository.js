/**
 * Fábrica de repositório CRUD (camada de acesso a dados).
 * Só monta e executa SQL — nenhuma regra de negócio aqui.
 *
 * @param {object} opcoes
 * @param {string}   opcoes.tabela        nome da tabela
 * @param {string[]} opcoes.colunas       colunas que podem ser gravadas pelo usuário
 * @param {boolean}  [opcoes.porUsuario]  true = cada linha pertence a um usuário (coluna usuario_id)
 * @param {string}   [opcoes.consultaLista] SELECT usado na listagem (para trazer colunas calculadas/joins)
 */
const { db } = require('../../database/connection');

function criarRepositorioCrud({ tabela, colunas, porUsuario = true, consultaLista }) {
  const filtroDono = porUsuario ? ' AND usuario_id=?' : '';
  const dono = uid => (porUsuario ? [uid] : []);

  return {
    colunas,

    listar(uid) {
      const sql = (consultaLista || `SELECT * FROM ${tabela}`) + (porUsuario ? ' WHERE usuario_id=?' : '') + ' ORDER BY id DESC';
      return db.prepare(sql).all(...dono(uid));
    },

    buscarPorId(uid, id) {
      return db.prepare(`SELECT * FROM ${tabela} WHERE id=?${filtroDono}`).get(id, ...dono(uid));
    },

    /** @param {object} dados apenas colunas permitidas → retorna o id criado */
    inserir(uid, dados) {
      const cols = Object.keys(dados);
      const valores = cols.map(c => dados[c]);
      if (porUsuario) { cols.push('usuario_id'); valores.push(uid); }
      return db.prepare(`INSERT INTO ${tabela}(${cols.join()}) VALUES(${cols.map(() => '?').join()})`)
        .run(...valores).lastInsertRowid;
    },

    /** → quantidade de linhas alteradas (0 = não existe ou não é do usuário) */
    atualizar(uid, id, dados) {
      const cols = Object.keys(dados);
      return db.prepare(`UPDATE ${tabela} SET ${cols.map(c => c + '=?').join()} WHERE id=?${filtroDono}`)
        .run(...cols.map(c => dados[c]), id, ...dono(uid)).changes;
    },

    remover(uid, id) {
      return db.prepare(`DELETE FROM ${tabela} WHERE id=?${filtroDono}`).run(id, ...dono(uid)).changes;
    },
  };
}

module.exports = { criarRepositorioCrud };
