const service = require('./pedidos.service');

module.exports = {
  listar: (req, res) => res.json(service.listar(req.usuarioId)),
  criar: (req, res) => res.status(201).json(service.criar(req.usuarioId, req.body)),
  atualizar: (req, res) => res.json(service.atualizar(req.usuarioId, req.params.id, req.body)),
  cancelar: (req, res) => res.json(service.cancelar(req.usuarioId, req.params.id)),
};
