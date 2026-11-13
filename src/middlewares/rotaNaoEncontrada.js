const AppError = require('../core/AppError');

module.exports = function rotaNaoEncontrada(req, res, next) {
  next(AppError.naoEncontrado('Rota não encontrada.'));
};
