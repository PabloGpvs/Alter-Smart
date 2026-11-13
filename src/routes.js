/**
 * Monta a API (/api): rotas públicas, autenticação e os módulos protegidos.
 * Para adicionar um módulo novo: crie a pasta em src/modules e registre o router aqui.
 */
const { Router } = require('express');
const autenticar = require('./middlewares/autenticar');
const rotaNaoEncontrada = require('./middlewares/rotaNaoEncontrada');

const api = Router();

// Públicas (cadastro e login) — o logout já exige sessão dentro do próprio router
api.use(require('./modules/auth/auth.routes'));

// Daqui para baixo, tudo exige sessão
api.use(autenticar);
api.use(require('./modules/enderecos/enderecos.routes'));
api.use(require('./modules/ambientes/ambientes.routes'));
api.use(require('./modules/servicos/servicos.routes'));
api.use(require('./modules/dispositivos/dispositivos.routes'));
api.use(require('./modules/produtos/produtos.routes'));
api.use(require('./modules/rotinas/rotinas.routes'));
api.use(require('./modules/pedidos/pedidos.routes'));
api.use(require('./modules/laboratorio/laboratorio.routes'));
api.use(require('./modules/historico/historico.routes'));

api.use(rotaNaoEncontrada);

module.exports = api;
