const { criarControllerCrud } = require('../../core/crud/crud.controller');
const service = require('./produtos.service');

module.exports = {
  ...criarControllerCrud(service),
  repor: (req, res) => res.json(service.repor(req.usuarioId, req.params.id, req.body)),
};
