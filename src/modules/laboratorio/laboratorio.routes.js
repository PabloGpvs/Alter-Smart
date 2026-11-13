const { Router } = require('express');
const controller = require('./laboratorio.controller');

const router = Router();
router.post('/fisica/:area/calcular', controller.calcular);
router.post('/fisica/:area', controller.salvar);
router.get('/experimentos', controller.listarExperimentos);
router.delete('/experimentos/:id', controller.removerExperimento);
router.get('/eletronica/casa', controller.eletronicaDaCasa);

module.exports = router;
