const { Router } = require('express');
const controller = require('./auth.controller');
const autenticar = require('../../middlewares/autenticar');

const router = Router();
// públicas
router.post('/auth/register', controller.registrar);
router.post('/auth/login', controller.login);
// exige sessão
router.post('/auth/logout', autenticar, controller.logout);

module.exports = router;
