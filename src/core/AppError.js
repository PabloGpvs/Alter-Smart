/**
 * Erro de regra de negócio com o código HTTP que deve ser devolvido.
 * Os services lançam AppError; o middleware tratarErros transforma em resposta JSON { erro }.
 * Assim nenhum service precisa conhecer o objeto `res` do Express.
 */
class AppError extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.name = 'AppError';
    this.status = status;
  }

  static invalido(msg) { return new AppError(400, msg); }
  static naoAutorizado(msg) { return new AppError(401, msg); }
  static naoEncontrado(msg) { return new AppError(404, msg); }
  static conflito(msg) { return new AppError(409, msg); }
}

module.exports = AppError;
