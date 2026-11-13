/** Pedidos de serviço (delivery): solicitar, avançar o status e cancelar. */
const AppError = require('../../core/AppError');
const historicoService = require('../historico/historico.service');
const servicosService = require('../servicos/servicos.service');
const repo = require('./pedidos.repository');
const { FLUXO } = require('./pedidos.constants');

module.exports = {
  listar: uid => repo.listar(uid),

  criar(uid, { servico_id, ambiente_id, observacao } = {}) {
    const servico = servicosService.buscar(uid, servico_id);
    if (!servico) throw AppError.invalido('Serviço inválido.');
    const id = repo.inserir(uid, servico.id, ambiente_id || null, observacao || null);
    historicoService.registrar(uid, 'SERVICO', `Pedido #${id} solicitado: ${servico.titulo}`);
    return { id };
  },

  atualizar(uid, id, { status, observacao } = {}) {
    const p = repo.buscarPorId(uid, id);
    if (!p) throw AppError.naoEncontrado('Pedido não encontrado.');
    if (status && !FLUXO.includes(status)) throw AppError.invalido('Status inválido.');
    if (status && FLUXO.indexOf(status) < FLUXO.indexOf(p.status)) throw AppError.invalido('O status só pode avançar.');
    repo.atualizar(p.id, status || p.status, observacao ?? p.observacao);
    if (status && status !== p.status) historicoService.registrar(uid, 'SERVICO', `Pedido #${p.id}: ${p.status} → ${status}`);
    return { ok: true };
  },

  cancelar(uid, id) {
    if (!repo.remover(uid, id)) throw AppError.naoEncontrado('Pedido não encontrado.');
    historicoService.registrar(uid, 'SERVICO', `Pedido #${id} cancelado`);
    return { ok: true };
  },
};
