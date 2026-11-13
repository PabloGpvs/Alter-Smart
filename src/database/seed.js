/**
 * Dados iniciais do catálogo (globais).
 * Só são inseridos quando o banco ainda está vazio, então rodar de novo não duplica nada.
 */
const SERVICOS = [
  ['Limpeza geral', 'Limpeza completa do ambiente', 120],
  ['Trocar lâmpada', 'Troca de lâmpadas e reatores', 40],
  ['Manutenção do ar-condicionado', 'Limpeza e revisão do split', 180],
  ['Chamar técnico', 'Visita técnica para automação/rede', 150],
  ['Reparo hidráulico', 'Vazamentos e torneiras', 90],
];

const AMBIENTES = ['Sala', 'Quarto', 'Cozinha', 'Banheiro', 'Garagem', 'Área externa'];

function aplicarSeed(db) {
  if (db.prepare('SELECT COUNT(*) c FROM servicos').get().c) return false;
  const insServico = db.prepare('INSERT INTO servicos(titulo,descricao,preco_estimado) VALUES(?,?,?)');
  const insAmbiente = db.prepare('INSERT INTO ambientes(nome) VALUES(?)');
  SERVICOS.forEach(s => insServico.run(...s));
  AMBIENTES.forEach(n => insAmbiente.run(n));
  return true;
}

module.exports = { aplicarSeed, SERVICOS, AMBIENTES };
