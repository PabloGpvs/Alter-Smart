const service = require('./laboratorio.service');

module.exports = {
  calcular: (req, res) => res.json(service.calcular(req.params.area, req.body.parametros || req.body)),
  salvar: (req, res) => res.status(201).json(service.salvarExperimento(req.usuarioId, req.params.area, req.body)),
  listarExperimentos: (req, res) => res.json(service.listarExperimentos(req.usuarioId)),
  removerExperimento: (req, res) => res.json(service.removerExperimento(req.usuarioId, req.params.id)),
  eletronicaDaCasa: (req, res) => res.json(service.eletronicaDaCasa(req.usuarioId)),
};
