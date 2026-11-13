const { criarControllerCrud } = require('../../core/crud/crud.controller');
const service = require('./dispositivos.service');

module.exports = {
  ...criarControllerCrud(service),
  termostato: (req, res) => res.json(service.aplicarTermostato(req.usuarioId, req.params.id, req.body)),
};
