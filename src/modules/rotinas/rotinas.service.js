/** Rotinas de automação: um nome + uma lista de ações (dispositivo → estado). */
const AppError = require('../../core/AppError');
const { transacao } = require('../../database/connection');
const { criarServicoCrud } = require('../../core/crud/crud.service');
const historicoService = require('../historico/historico.service');
const dispositivosService = require('../dispositivos/dispositivos.service');
const repo = require('./rotinas.repository');

const crud = criarServicoCrud({ repo, recurso: 'rotinas', tipoHistorico: 'AUTOMACAO' });

module.exports = {
  ...crud,

  /** Lista as rotinas já com as ações de cada uma. */
  listar: uid => repo.listar(uid).map(r => ({ ...r, acoes: repo.listarAcoes(r.id) })),

  adicionarAcao(uid, rotinaId, { dispositivo_id, acao } = {}) {
    const rotina = repo.buscarPorId(uid, rotinaId);
    const dispositivoOk = dispositivosService.pertenceAoUsuario(uid, dispositivo_id);
    if (!rotina || !dispositivoOk || !acao) throw AppError.invalido('Rotina, dispositivo ou ação inválidos.');
    repo.inserirAcao(rotinaId, dispositivo_id, acao);
    return { ok: true };
  },

  removerAcao(uid, acaoId) {
    repo.removerAcao(uid, acaoId);
    return { ok: true };
  },

  /** Aplica todas as ações de uma vez (transação: ou todas, ou nenhuma). */
  executar(uid, rotinaId) {
    const rotina = repo.buscarPorId(uid, rotinaId);
    if (!rotina) throw AppError.naoEncontrado('Rotina não encontrada.');
    const acoes = repo.listarAcoes(rotina.id);
    transacao(() => {
      acoes.forEach(a => dispositivosService.alterarEstado(uid, a.dispositivo_id, a.acao));
      const resumo = acoes.map(a => `${a.dispositivo}→${a.acao}`).join(', ') || 'sem ações';
      historicoService.registrar(uid, 'AUTOMACAO', `Rotina "${rotina.nome}" executada: ${resumo}`);
    });
    return { executadas: acoes.length };
  },
};
