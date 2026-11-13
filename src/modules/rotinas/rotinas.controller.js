const { criarControllerCrud } = require('../../core/crud/crud.controller');
const service = require('./rotinas.service');

module.exports = {
  ...criarControllerCrud(service),
  adicionarAcao: (req, res) => res.status(201).json(service.adicionarAcao(req.usuarioId, req.params.id, req.body)),
  removerAcao: (req, res) => res.json(service.removerAcao(req.usuarioId, req.params.id)),
  executar: (req, res) => res.json(service.executar(req.usuarioId, req.params.id)),
};
