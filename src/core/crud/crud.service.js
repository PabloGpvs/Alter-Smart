/**
 * Fábrica de service CRUD (camada de regras de negócio).
 * Decide QUAIS campos podem ser gravados, o que é erro e o que vai para o histórico.
 * Não conhece HTTP (req/res) nem SQL.
 */
const AppError = require('../AppError');
const historicoService = require('../../modules/historico/historico.service');

/** Mantém só as colunas permitidas que vieram preenchidas. */
function selecionarCampos(corpo, colunas, { ignorarVazios }) {
  const dados = {};
  for (const c of colunas) {
    const v = corpo[c];
    if (v === undefined || (ignorarVazios && v === '')) continue;
    dados[c] = v;
  }
  return dados;
}

/**
 * @param {object} repo       repositório criado por criarRepositorioCrud
 * @param {string} recurso    nome do recurso, usado nas mensagens do histórico (ex.: 'produtos')
 * @param {string} [tipoHistorico] se informado, cada alteração é registrada no histórico com esse tipo
 */
function criarServicoCrud({ repo, recurso, tipoHistorico }) {
  const registrar = (uid, texto) => { if (tipoHistorico) historicoService.registrar(uid, tipoHistorico, texto); };

  return {
    listar: uid => repo.listar(uid),

    /** Retorna o registro (ou undefined) — usado por outros módulos. */
    buscar: (uid, id) => repo.buscarPorId(uid, id),

    criar(uid, corpo) {
      const id = repo.inserir(uid, selecionarCampos(corpo, repo.colunas, { ignorarVazios: true }));
      registrar(uid, `Criado em ${recurso}: ${corpo.nome || corpo.titulo || '#' + id}`);
      return { id };
    },

    atualizar(uid, id, corpo) {
      const dados = selecionarCampos(corpo, repo.colunas, { ignorarVazios: false });
      if (!Object.keys(dados).length) throw AppError.invalido('Nada para atualizar.');
      if (!repo.atualizar(uid, id, dados)) throw AppError.naoEncontrado('Registro não encontrado.');
      registrar(uid, `Atualizado em ${recurso} #${id}`);
      return { ok: true };
    },

    remover(uid, id) {
      if (!repo.remover(uid, id)) throw AppError.naoEncontrado('Registro não encontrado.');
      registrar(uid, `Removido de ${recurso} #${id}`);
      return { ok: true };
    },
  };
}

module.exports = { criarServicoCrud, selecionarCampos };
