/**
 * Ponto de entrada: prepara o banco e abre a porta.
 * A montagem da aplicação fica em src/app.js; as rotas, em src/modules/*.
 */
const { iniciarBanco } = require('./src/database');
const app = require('./src/app');
const { PORT } = require('./src/config');

iniciarBanco();
app.listen(PORT, () => console.log(`▶ Alter Smart online em http://localhost:${PORT}`));
