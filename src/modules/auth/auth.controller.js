const service = require('./auth.service');

module.exports = {
  registrar: (req, res) => res.status(201).json(service.registrar(req.body)),
  login: (req, res) => res.json(service.login(req.body)),
  logout: (req, res) => res.json(service.logout(req.token)),
};
