/**
 * Gerenciamento do banco: cria as tabelas (schema.sql) e aplica os dados iniciais (seed.js).
 * Também pode ser executado sozinho:  npm run db:setup
 */
const fs = require('fs');
const path = require('path');
const { db, transacao } = require('./connection');
const { aplicarSeed } = require('./seed');

function iniciarBanco() {
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  return aplicarSeed(db);
}

if (require.main === module) {
  const semeou = iniciarBanco();
  console.log(semeou ? '✔ Banco criado e catálogo inicial inserido.' : '✔ Banco já estava pronto.');
}

module.exports = { db, transacao, iniciarBanco };
