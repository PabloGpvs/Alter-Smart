/**
 * Fluxo de status de um pedido de serviço. O status só anda para a frente.
 * O índice (0..3) é o mesmo código de 2 bits (S1 S0) usado no circuito 05/06 do Logisim.
 */
const FLUXO = ['Solicitado', 'Aceito', 'Em andamento', 'Concluído'];

module.exports = { FLUXO };
