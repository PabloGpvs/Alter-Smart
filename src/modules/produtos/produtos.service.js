/** Estoque da casa: produtos com quantidade atual e mínima, e reposição. */
const AppError = require('../../core/AppError');
const { criarServicoCrud } = require('../../core/crud/crud.service');
const historicoService = require('../historico/historico.service');
const repo = require('./produtos.repository');

module.exports = {
  ...criarServicoCrud({ repo, recurso: 'produtos', tipoHistorico: 'ESTOQUE' }),

  repor(uid, id, { quantidade } = {}) {
    const n = parseInt(quantidade, 10);
    const p = repo.buscarPorId(uid, id);
    if (!p || !(n > 0)) throw AppError.invalido('Produto ou quantidade inválidos.');
    repo.somarQuantidade(p.id, n);
    historicoService.registrar(uid, 'COMPRA', `Reposição de ${n}x ${p.nome}`);
    return { ok: true };
  },
};
