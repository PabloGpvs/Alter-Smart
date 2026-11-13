/**
 * Monta a aplicação Express (sem abrir porta).
 * Separar o app do server.js permite testar a API sem subir o servidor de verdade.
 */
const express = require('express');
const { PASTAS } = require('./config');
const rotasApi = require('./routes');
const tratarErros = require('./middlewares/tratarErros');

const app = express();

app.use(express.json());

// Arquivos estáticos
app.use(express.static(PASTAS.publica));                  // front-end
app.use('/shared', express.static(PASTAS.compartilhada)); // núcleo de física usado pelo navegador
app.use('/logisim', express.static(PASTAS.logisim));      // download dos .circ

// API REST
app.use('/api', rotasApi);

// Erros (sempre por último)
app.use(tratarErros);

module.exports = app;
