/** Regras de cadastro, login e sessão. */
const AppError = require('../../core/AppError');
const repo = require('./auth.repository');
const senha = require('./senha');
const historicoService = require('../historico/historico.service');

const SENHA_MINIMA = 4;

function abrirSessao(uid) {
  const token = senha.novoToken();
  repo.inserirSessao(token, uid);
  return token;
}

module.exports = {
  registrar({ nome, email, senha: s } = {}) {
    if (!nome || !email || !s || s.length < SENHA_MINIMA)
      throw AppError.invalido(`Informe nome, e-mail e senha (mín. ${SENHA_MINIMA} caracteres).`);
    if (repo.buscarUsuarioPorEmail(email)) throw AppError.conflito('E-mail já cadastrado.');
    const id = repo.inserirUsuario(nome, email, senha.gerarHash(s));
    historicoService.registrar(id, 'CONTA', 'Conta criada');
    return { token: abrirSessao(id), nome };
  },

  login({ email, senha: s } = {}) {
    const u = repo.buscarUsuarioPorEmail(email || '');
    if (!u || !senha.conferir(s || '', u.senha)) throw AppError.naoAutorizado('Credenciais inválidas.');
    return { token: abrirSessao(u.id), nome: u.nome };
  },

  /** Retorna o id do usuário dono do token, ou lança 401. */
  usuarioDoToken(token) {
    const sessao = repo.buscarSessao(token);
    if (!sessao) throw AppError.naoAutorizado('Sessão inválida. Faça login.');
    return sessao.usuario_id;
  },

  logout(token) {
    repo.removerSessao(token);
    return { ok: true };
  },
};
