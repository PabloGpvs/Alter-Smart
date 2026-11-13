/**
 * Testes de integração da API (node:test, sem dependências extras).
 * Usam um banco em memória, então não mexem no database.sqlite.
 * Rodar: npm test
 */
process.env.DB_PATH = ':memory:';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciarBanco } = require('../src/database');
const app = require('../src/app');

let servidor, base, token;

async function api(caminho, metodo = 'GET', corpo, comToken = true) {
  const r = await fetch(base + '/api' + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(comToken && token ? { Authorization: 'Bearer ' + token } : {}) },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: r.status, corpo: await r.json() };
}

before(async () => {
  iniciarBanco();
  servidor = app.listen(0);
  await new Promise(ok => servidor.once('listening', ok));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => servidor.close());

test('rotas protegidas exigem login', async () => {
  const r = await api('/dispositivos', 'GET', undefined, false);
  assert.equal(r.status, 401);
});

test('cadastro, e-mail duplicado e login', async () => {
  const cad = await api('/auth/register', 'POST', { nome: 'Ana', email: 'ana@teste.com', senha: '1234' });
  assert.equal(cad.status, 201);
  assert.ok(cad.corpo.token);
  assert.equal((await api('/auth/register', 'POST', { nome: 'Ana', email: 'ana@teste.com', senha: '1234' })).status, 409);
  assert.equal((await api('/auth/login', 'POST', { email: 'ana@teste.com', senha: 'errada' })).status, 401);
  const login = await api('/auth/login', 'POST', { email: 'ana@teste.com', senha: '1234' });
  assert.equal(login.status, 200);
  token = login.corpo.token;
});

test('seed: catálogo inicial de serviços e ambientes', async () => {
  assert.equal((await api('/servicos')).corpo.length, 5);
  assert.equal((await api('/ambientes')).corpo.length, 6);
});

test('estoque: produto abaixo do mínimo e reposição', async () => {
  const { corpo: { id } } = await api('/produtos', 'POST', { nome: 'Arroz', quantidade: 1, quantidade_minima: 2 });
  assert.equal((await api('/produtos')).corpo[0].baixo, 1);
  assert.equal((await api(`/produtos/${id}/repor`, 'POST', { quantidade: 0 })).status, 400);
  await api(`/produtos/${id}/repor`, 'POST', { quantidade: 5 });
  const [p] = (await api('/produtos')).corpo;
  assert.equal(p.quantidade, 6);
  assert.equal(p.baixo, 0);
});

test('rotina executa as ações nos dispositivos', async () => {
  const luz = (await api('/dispositivos', 'POST', { nome: 'Luz sala', tipo: 'luz', estado: 'ligado' })).corpo.id;
  const rotina = (await api('/rotinas', 'POST', { nome: 'Boa noite' })).corpo.id;
  assert.equal((await api(`/rotinas/${rotina}/acoes`, 'POST', { dispositivo_id: 999, acao: 'desligado' })).status, 400);
  await api(`/rotinas/${rotina}/acoes`, 'POST', { dispositivo_id: luz, acao: 'desligado' });
  assert.deepEqual((await api(`/rotinas/${rotina}/executar`, 'POST')).corpo, { executadas: 1 });
  const d = (await api('/dispositivos')).corpo.find(x => x.id === luz);
  assert.equal(d.estado, 'desligado');
});

test('pedido: status só avança', async () => {
  const { corpo: { id } } = await api('/pedidos', 'POST', { servico_id: 1 });
  assert.equal((await api(`/pedidos/${id}`, 'PUT', { status: 'Em andamento' })).status, 200);
  const volta = await api(`/pedidos/${id}`, 'PUT', { status: 'Aceito' });
  assert.equal(volta.status, 400);
  assert.equal(volta.corpo.erro, 'O status só pode avançar.');
  const casa = (await api('/eletronica/casa')).corpo;
  assert.deepEqual(casa.pedidos.find(p => p.id === id), { id, status: 'Em andamento', titulo: 'Limpeza geral', S1: 1, S0: 0 });
});

test('termostato liga o compressor quando T > SET com presença', async () => {
  const ar = (await api('/dispositivos', 'POST', { nome: 'Ar quarto', tipo: 'ar-condicionado' })).corpo.id;
  const r = await api(`/dispositivos/${ar}/termostato`, 'POST', { temperatura: 28, setpoint: 23, presenca: true });
  assert.equal(r.corpo.estado, 'ligado 23°C');
  const r2 = await api(`/dispositivos/${ar}/termostato`, 'POST', { temperatura: 20, setpoint: 23, presenca: true });
  assert.equal(r2.corpo.estado, 'standby 23°C');
});

test('laboratório: servidor recalcula e salva o experimento', async () => {
  assert.equal((await api('/fisica/xyz', 'POST', {})).status, 400);
  const r = await api('/fisica/eletronica', 'POST', { titulo: 'Teste', parametros: { circuito: 'termostato', entradas: { T: 25, SET: 22, PRESENCA: 1 } } });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.resultado.saidas.COMPRESSOR, 1);
  const [e] = (await api('/experimentos')).corpo;
  assert.equal(e.titulo, 'Teste');
  assert.equal(e.resultado.saidas.COMPRESSOR, 1);
});

test('histórico registra as ações e pode ser limpo', async () => {
  const tipos = new Set((await api('/historico')).corpo.map(h => h.tipo));
  for (const t of ['CONTA', 'ESTOQUE', 'COMPRA', 'AUTOMACAO', 'SERVICO', 'FISICA']) assert.ok(tipos.has(t), t);
  await api('/historico', 'DELETE');
  assert.equal((await api('/historico')).corpo.length, 0);
});

test('rota inexistente e logout', async () => {
  assert.equal((await api('/xyz')).status, 404);
  await api('/auth/logout', 'POST');
  assert.equal((await api('/enderecos')).status, 401);
});
