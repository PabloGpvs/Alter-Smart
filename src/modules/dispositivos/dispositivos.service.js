/** Aparelhos da casa (luz, ar-condicionado, alarme…) e o termostato do ar-condicionado. */
const AppError = require('../../core/AppError');
const { criarServicoCrud } = require('../../core/crud/crud.service');
const Fisica = require('../../../shared/fisica');
const historicoService = require('../historico/historico.service');
const repo = require('./dispositivos.repository');

const crud = criarServicoCrud({ repo, recurso: 'dispositivos' });

module.exports = {
  ...crud,

  pertenceAoUsuario: (uid, id) => Boolean(crud.buscar(uid, id)),

  alterarEstado: (uid, id, estado) => repo.alterarEstado(uid, id, estado),

  /**
   * Termostato: aplica a mesma regra do circuito 04 do Logisim
   * (COMPRESSOR = (T > SET) · PRESENCA) e grava o novo estado do ar-condicionado.
   */
  aplicarTermostato(uid, id, { temperatura, setpoint, presenca } = {}) {
    const d = repo.buscarPorId(uid, id);
    if (!d) throw AppError.naoEncontrado('Dispositivo não encontrado.');
    if (d.tipo !== 'ar-condicionado')
      throw AppError.invalido('O termostato só vale para dispositivos do tipo ar-condicionado.');

    const r = Fisica.calcular('eletronica', {
      circuito: 'termostato',
      entradas: { T: temperatura, SET: setpoint, PRESENCA: presenca ? 1 : 0 },
    });
    const estado = r.saidas.COMPRESSOR ? `ligado ${r.entradas.SET}°C` : `standby ${r.entradas.SET}°C`;
    repo.alterarEstado(uid, d.id, estado);
    historicoService.registrar(uid, 'AUTOMACAO', `Termostato ${d.nome}: T=${r.entradas.T}°C, SET=${r.entradas.SET}°C → ${estado}`);
    return { estado, ...r };
  },
};
