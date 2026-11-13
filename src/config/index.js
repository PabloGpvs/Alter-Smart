/**
 * Configuração central da aplicação.
 * Tudo que muda entre ambientes (porta, arquivo do banco) é lido aqui, e só aqui.
 */
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  // ':memory:' é aceito (usado nos testes automatizados)
  DB_PATH: process.env.DB_PATH || path.join(RAIZ, 'database.sqlite'),
  PASTAS: {
    publica: path.join(RAIZ, 'public'),   // front-end (HTML, CSS, JS)
    compartilhada: path.join(RAIZ, 'shared'), // código usado pelo front e pelo back (núcleo de física)
    logisim: path.join(RAIZ, 'logisim'),  // circuitos .circ para download
  },
};
