/**
 * Ponto único de tratamento de erros: todo erro vira { erro: mensagem }.
 * - AppError (regra de negócio) → usa o status definido pelo service
 * - Qualquer outro erro (JSON malformado, restrição do banco, parâmetro de física) → 400
 */
const AppError = require('../core/AppError');

// eslint-disable-next-line no-unused-vars
module.exports = function tratarErros(err, req, res, next) {
  const status = err instanceof AppError ? err.status : 400;
  res.status(status).json({ erro: err.message });
};
