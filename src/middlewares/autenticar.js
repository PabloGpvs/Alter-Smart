/**
 * Exige o cabeçalho "Authorization: Bearer <token>".
 * Em caso de sucesso preenche req.usuarioId e req.token para as próximas camadas.
 */
const authService = require('../modules/auth/auth.service');

module.exports = function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  req.usuarioId = authService.usuarioDoToken(token); // lança 401 se inválido
  req.token = token;
  next();
};
