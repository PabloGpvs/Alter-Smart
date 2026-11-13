/** Hash de senha com scrypt + salt aleatório. Formato salvo: "salt:hash". */
const crypto = require('crypto');

function gerarHash(senha, salt = crypto.randomBytes(16).toString('hex')) {
  return salt + ':' + crypto.scryptSync(senha, salt, 32).toString('hex');
}

function conferir(senha, salvo) {
  const [salt, h] = salvo.split(':');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(senha, salt, 32));
}

const novoToken = () => crypto.randomBytes(24).toString('hex');

module.exports = { gerarHash, conferir, novoToken };
