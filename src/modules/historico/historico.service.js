/**
 * Histórico de transações: os outros módulos chamam `registrar` para deixar
 * rastro do que o usuário fez (CONTA, ESTOQUE, COMPRA, SERVICO, AUTOMACAO, FISICA).
 */
const repo = require('./historico.repository');

module.exports = {
  registrar: (uid, tipo, descricao) => { repo.inserir(uid, tipo, descricao); },
  listar: uid => repo.listar(uid),
  limpar: uid => { repo.limpar(uid); return { ok: true }; },
};
