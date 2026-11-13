/**
 * Laboratório de Física e Eletrônica.
 * Os cálculos vêm do núcleo compartilhado shared/fisica.js (o mesmo que roda no navegador),
 * mas o servidor SEMPRE recalcula antes de salvar: o resultado gravado nunca vem do cliente.
 */
const AppError = require('../../core/AppError');
const Fisica = require('../../../shared/fisica');
const historicoService = require('../historico/historico.service');
const dispositivosService = require('../dispositivos/dispositivos.service');
const produtosService = require('../produtos/produtos.service');
const pedidosService = require('../pedidos/pedidos.service');
const { FLUXO } = require('../pedidos/pedidos.constants');
const repo = require('./laboratorio.repository');

const NOME_AREA = {
  campo_eletrico: 'Campo elétrico',
  eletrostatica: 'Eletrostática',
  magnetismo: 'Magnetismo',
  termodinamica: 'Termodinâmica',
  eletronica: 'Eletrônica',
};

module.exports = {
  /** Só calcula (não salva) — útil para conferir valores. */
  calcular: (area, parametros) => Fisica.calcular(area, parametros),

  salvarExperimento(uid, area, { titulo, parametros = {}, ambiente_id, dispositivo_id } = {}) {
    if (!NOME_AREA[area]) throw AppError.invalido('Área de física inválida.');
    if (dispositivo_id && !dispositivosService.pertenceAoUsuario(uid, dispositivo_id))
      throw AppError.invalido('Dispositivo inválido.');

    const resultado = Fisica.calcular(area, parametros);
    const resumo = { ...resultado };
    delete resumo.serie; // a série temporal não precisa ir para o banco
    const nome = (titulo || NOME_AREA[area]).slice(0, 80);

    const id = repo.inserirExperimento(uid, {
      area, titulo: nome,
      ambiente_id: ambiente_id || null, dispositivo_id: dispositivo_id || null,
      parametros: JSON.stringify(parametros), resultado: JSON.stringify(resumo),
    });
    historicoService.registrar(uid, 'FISICA', `${NOME_AREA[area]}: experimento "${nome}" salvo`);
    return { id, resultado };
  },

  listarExperimentos: uid => repo.listarExperimentos(uid)
    .map(e => ({ ...e, parametros: JSON.parse(e.parametros), resultado: JSON.parse(e.resultado) })),

  removerExperimento(uid, id) {
    if (!repo.removerExperimento(uid, id)) throw AppError.naoEncontrado('Experimento não encontrado.');
    return { ok: true };
  },

  /** Entradas dos circuitos digitais lidas dos dados reais da casa (estoque e pedidos). */
  eletronicaDaCasa(uid) {
    const produtos = produtosService.listar(uid).map(({ id, nome, quantidade, quantidade_minima }) => ({
      id, nome, quantidade, quantidade_minima,
      cabe_em_4_bits: quantidade <= 15 && quantidade_minima <= 15, // o comparador do circuito 03 tem 4 bits
      ...Fisica.calcular('eletronica', {
        circuito: 'alerta_estoque',
        entradas: { QTD: Math.min(15, quantidade), MIN: Math.min(15, quantidade_minima) },
      }).saidas,
    }));
    const pedidos = pedidosService.listar(uid).map(({ id, status, titulo }) => {
      const k = FLUXO.indexOf(status);
      return { id, status, titulo, S1: k >> 1, S0: k & 1 };
    });
    return { produtos, pedidos };
  },
};
