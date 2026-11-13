/**
 * Conexão única com o SQLite (módulo nativo node:sqlite).
 * Todos os repositórios importam esta mesma instância.
 */
const { DatabaseSync } = require('node:sqlite');
const { DB_PATH } = require('../config');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');

/** Executa `fn` dentro de uma transação: tudo é gravado, ou nada é. */
function transacao(fn) {
  db.exec('BEGIN');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { db, transacao };
