const service = require('./historico.service');

module.exports = {
  listar: (req, res) => res.json(service.listar(req.usuarioId)),
  limpar: (req, res) => res.json(service.limpar(req.usuarioId)),
};
