const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const path = require('path');
const Fisica = require('./public/fisica'); // mesmo núcleo de cálculo usado no navegador

const db = new DatabaseSync(path.join(__dirname, 'database.sqlite'));
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessoes (token TEXT PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS enderecos (id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE, rua TEXT NOT NULL, numero TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ambientes (id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS servicos (id INTEGER PRIMARY KEY, titulo TEXT NOT NULL, descricao TEXT, preco_estimado REAL DEFAULT 0);
CREATE TABLE IF NOT EXISTS pedidos_servicos (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  servico_id INTEGER NOT NULL REFERENCES servicos(id),
  ambiente_id INTEGER REFERENCES ambientes(id),
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'Solicitado' CHECK (status IN ('Solicitado','Aceito','Em andamento','Concluído')),
  data_criacao TEXT NOT NULL DEFAULT (datetime('now','localtime')));
-- produtos + estoque na mesma tabela (quantidade atual e mínima)
CREATE TABLE IF NOT EXISTS produtos (id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, quantidade INTEGER NOT NULL DEFAULT 0, quantidade_minima INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS dispositivos (id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ambiente_id INTEGER REFERENCES ambientes(id), nome TEXT NOT NULL, tipo TEXT NOT NULL DEFAULT 'luz', estado TEXT NOT NULL DEFAULT 'desligado');
CREATE TABLE IF NOT EXISTS rotinas (id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, descricao TEXT);
CREATE TABLE IF NOT EXISTS rotina_acoes (id INTEGER PRIMARY KEY, rotina_id INTEGER NOT NULL REFERENCES rotinas(id) ON DELETE CASCADE,
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE, acao TEXT NOT NULL);
-- Laboratório: cada cálculo de física/eletrônica salvo pelo usuário (parâmetros e resultado em JSON)
CREATE TABLE IF NOT EXISTS experimentos (id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('campo_eletrico','eletrostatica','magnetismo','termodinamica','eletronica')),
  titulo TEXT NOT NULL, ambiente_id INTEGER REFERENCES ambientes(id) ON DELETE SET NULL,
  dispositivo_id INTEGER REFERENCES dispositivos(id) ON DELETE SET NULL,
  parametros TEXT NOT NULL, resultado TEXT NOT NULL, data TEXT NOT NULL DEFAULT (datetime('now','localtime')));
CREATE TABLE IF NOT EXISTS historico_transacoes (id INTEGER PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, descricao TEXT NOT NULL, data TEXT NOT NULL DEFAULT (datetime('now','localtime')));
`);

// Seed de catálogo (global)
if (!db.prepare('SELECT COUNT(*) c FROM servicos').get().c) {
  const s = db.prepare('INSERT INTO servicos(titulo,descricao,preco_estimado) VALUES(?,?,?)');
  [['Limpeza geral', 'Limpeza completa do ambiente', 120],
   ['Trocar lâmpada', 'Troca de lâmpadas e reatores', 40],
   ['Manutenção do ar-condicionado', 'Limpeza e revisão do split', 180],
   ['Chamar técnico', 'Visita técnica para automação/rede', 150],
   ['Reparo hidráulico', 'Vazamentos e torneiras', 90]].forEach(r => s.run(...r));
  ['Sala', 'Quarto', 'Cozinha', 'Banheiro', 'Garagem', 'Área externa'].forEach(n => db.prepare('INSERT INTO ambientes(nome) VALUES(?)').run(n));
}

const FLUXO = ['Solicitado', 'Aceito', 'Em andamento', 'Concluído'];
const log = (uid, tipo, desc) => db.prepare('INSERT INTO historico_transacoes(usuario_id,tipo,descricao) VALUES(?,?,?)').run(uid, tipo, desc);
const erro = (s, code, msg) => s.status(code).json({ erro: msg });

const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
const checkPw = (pw, stored) => {
  const [salt, h] = stored.split(':');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), crypto.scryptSync(pw, salt, 32));
};
const novaSessao = uid => {
  const t = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessoes(token,usuario_id) VALUES(?,?)').run(t, uid);
  return t;
};

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/logisim', express.static(path.join(__dirname, 'logisim'))); // download dos .circ
const api = express.Router();
app.use('/api', api);

// ---------- Autenticação ----------
api.post('/auth/register', (q, s) => {
  const { nome, email, senha } = q.body;
  if (!nome || !email || !senha || senha.length < 4) return erro(s, 400, 'Informe nome, e-mail e senha (mín. 4 caracteres).');
  if (db.prepare('SELECT 1 FROM usuarios WHERE email=?').get(email)) return erro(s, 409, 'E-mail já cadastrado.');
  const id = db.prepare('INSERT INTO usuarios(nome,email,senha) VALUES(?,?,?)').run(nome, email, hash(senha)).lastInsertRowid;
  log(id, 'CONTA', 'Conta criada');
  s.status(201).json({ token: novaSessao(id), nome });
});
api.post('/auth/login', (q, s) => {
  const u = db.prepare('SELECT * FROM usuarios WHERE email=?').get(q.body.email || '');
  if (!u || !checkPw(q.body.senha || '', u.senha)) return erro(s, 401, 'Credenciais inválidas.');
  s.json({ token: novaSessao(u.id), nome: u.nome });
});

api.use((q, s, n) => {
  const t = (q.headers.authorization || '').replace('Bearer ', '');
  const r = db.prepare('SELECT usuario_id FROM sessoes WHERE token=?').get(t);
  if (!r) return erro(s, 401, 'Sessão inválida. Faça login.');
  q.uid = r.usuario_id; q.token = t; n();
});
api.post('/auth/logout', (q, s) => { db.prepare('DELETE FROM sessoes WHERE token=?').run(q.token); s.json({ ok: true }); });

// ---------- CRUD genérico ----------
function crud(name, table, cols, { scoped = true, sel, logTipo, noGet } = {}) {
  const own = scoped ? ' AND usuario_id=?' : '';
  if (!noGet) api.get('/' + name, (q, s) => {
    const sql = (sel || `SELECT * FROM ${table}`) + (scoped ? ' WHERE usuario_id=?' : '') + ' ORDER BY id DESC';
    s.json(db.prepare(sql).all(...(scoped ? [q.uid] : [])));
  });
  api.post('/' + name, (q, s) => {
    const c = cols.filter(k => q.body[k] !== undefined && q.body[k] !== '');
    if (scoped) c.push('usuario_id');
    const r = db.prepare(`INSERT INTO ${table}(${c.join()}) VALUES(${c.map(() => '?').join()})`)
      .run(...c.map(k => (k === 'usuario_id' ? q.uid : q.body[k])));
    if (logTipo) log(q.uid, logTipo, `Criado em ${name}: ${q.body.nome || q.body.titulo || '#' + r.lastInsertRowid}`);
    s.status(201).json({ id: r.lastInsertRowid });
  });
  api.put('/' + name + '/:id', (q, s) => {
    const c = cols.filter(k => q.body[k] !== undefined);
    if (!c.length) return erro(s, 400, 'Nada para atualizar.');
    const r = db.prepare(`UPDATE ${table} SET ${c.map(k => k + '=?').join()} WHERE id=?${own}`)
      .run(...c.map(k => q.body[k]), q.params.id, ...(scoped ? [q.uid] : []));
    if (!r.changes) return erro(s, 404, 'Registro não encontrado.');
    if (logTipo) log(q.uid, logTipo, `Atualizado em ${name} #${q.params.id}`);
    s.json({ ok: true });
  });
  api.delete('/' + name + '/:id', (q, s) => {
    const r = db.prepare(`DELETE FROM ${table} WHERE id=?${own}`).run(q.params.id, ...(scoped ? [q.uid] : []));
    if (!r.changes) return erro(s, 404, 'Registro não encontrado.');
    if (logTipo) log(q.uid, logTipo, `Removido de ${name} #${q.params.id}`);
    s.json({ ok: true });
  });
}
crud('enderecos', 'enderecos', ['rua', 'numero']);
crud('ambientes', 'ambientes', ['nome'], { scoped: false });
crud('servicos', 'servicos', ['titulo', 'descricao', 'preco_estimado'], { scoped: false });
crud('dispositivos', 'dispositivos', ['ambiente_id', 'nome', 'tipo', 'estado'], {
  sel: 'SELECT d.*, (SELECT nome FROM ambientes WHERE id=d.ambiente_id) ambiente FROM dispositivos d' });
crud('produtos', 'produtos', ['nome', 'quantidade', 'quantidade_minima'], {
  sel: 'SELECT *, (quantidade<=quantidade_minima) AS baixo FROM produtos', logTipo: 'ESTOQUE' });
crud('rotinas', 'rotinas', ['nome', 'descricao'], { logTipo: 'AUTOMACAO', noGet: true });

// Rotinas: lista com ações embutidas (sobrescreve o GET genérico)
api.get('/rotinas', (q, s) => {
  const rs = db.prepare('SELECT * FROM rotinas WHERE usuario_id=? ORDER BY id DESC').all(q.uid);
  const ac = db.prepare(`SELECT a.*, d.nome dispositivo FROM rotina_acoes a JOIN dispositivos d ON d.id=a.dispositivo_id WHERE a.rotina_id=?`);
  s.json(rs.map(r => ({ ...r, acoes: ac.all(r.id) })));
});
api.post('/rotinas/:id/acoes', (q, s) => {
  const r = db.prepare('SELECT 1 FROM rotinas WHERE id=? AND usuario_id=?').get(q.params.id, q.uid);
  const d = db.prepare('SELECT 1 FROM dispositivos WHERE id=? AND usuario_id=?').get(q.body.dispositivo_id, q.uid);
  if (!r || !d || !q.body.acao) return erro(s, 400, 'Rotina, dispositivo ou ação inválidos.');
  db.prepare('INSERT INTO rotina_acoes(rotina_id,dispositivo_id,acao) VALUES(?,?,?)').run(q.params.id, q.body.dispositivo_id, q.body.acao);
  s.status(201).json({ ok: true });
});
api.delete('/acoes/:id', (q, s) => {
  db.prepare(`DELETE FROM rotina_acoes WHERE id=? AND rotina_id IN (SELECT id FROM rotinas WHERE usuario_id=?)`).run(q.params.id, q.uid);
  s.json({ ok: true });
});
api.post('/rotinas/:id/executar', (q, s) => {
  const r = db.prepare('SELECT * FROM rotinas WHERE id=? AND usuario_id=?').get(q.params.id, q.uid);
  if (!r) return erro(s, 404, 'Rotina não encontrada.');
  const acoes = db.prepare(`SELECT a.acao, a.dispositivo_id, d.nome FROM rotina_acoes a JOIN dispositivos d ON d.id=a.dispositivo_id WHERE a.rotina_id=?`).all(r.id);
  db.exec('BEGIN');
  try {
    acoes.forEach(a => db.prepare('UPDATE dispositivos SET estado=? WHERE id=?').run(a.acao, a.dispositivo_id));
    log(q.uid, 'AUTOMACAO', `Rotina "${r.nome}" executada: ` + (acoes.map(a => `${a.nome}→${a.acao}`).join(', ') || 'sem ações'));
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  s.json({ executadas: acoes.length });
});

// ---------- Estoque: reposição ----------
api.post('/produtos/:id/repor', (q, s) => {
  const n = parseInt(q.body.quantidade, 10);
  const p = db.prepare('SELECT * FROM produtos WHERE id=? AND usuario_id=?').get(q.params.id, q.uid);
  if (!p || !(n > 0)) return erro(s, 400, 'Produto ou quantidade inválidos.');
  db.prepare('UPDATE produtos SET quantidade=quantidade+? WHERE id=?').run(n, p.id);
  log(q.uid, 'COMPRA', `Reposição de ${n}x ${p.nome}`);
  s.json({ ok: true });
});

// ---------- Pedidos de serviço ----------
api.get('/pedidos', (q, s) => s.json(db.prepare(`
  SELECT p.*, sv.titulo, sv.preco_estimado, a.nome ambiente FROM pedidos_servicos p
  JOIN servicos sv ON sv.id=p.servico_id LEFT JOIN ambientes a ON a.id=p.ambiente_id
  WHERE p.usuario_id=? ORDER BY p.id DESC`).all(q.uid)));
api.post('/pedidos', (q, s) => {
  const sv = db.prepare('SELECT * FROM servicos WHERE id=?').get(q.body.servico_id);
  if (!sv) return erro(s, 400, 'Serviço inválido.');
  const id = db.prepare('INSERT INTO pedidos_servicos(usuario_id,servico_id,ambiente_id,observacao) VALUES(?,?,?,?)')
    .run(q.uid, sv.id, q.body.ambiente_id || null, q.body.observacao || null).lastInsertRowid;
  log(q.uid, 'SERVICO', `Pedido #${id} solicitado: ${sv.titulo}`);
  s.status(201).json({ id });
});
api.put('/pedidos/:id', (q, s) => {
  const p = db.prepare('SELECT * FROM pedidos_servicos WHERE id=? AND usuario_id=?').get(q.params.id, q.uid);
  if (!p) return erro(s, 404, 'Pedido não encontrado.');
  const { status, observacao } = q.body;
  if (status && !FLUXO.includes(status)) return erro(s, 400, 'Status inválido.');
  if (status && FLUXO.indexOf(status) < FLUXO.indexOf(p.status)) return erro(s, 400, 'O status só pode avançar.');
  db.prepare('UPDATE pedidos_servicos SET status=?, observacao=? WHERE id=?').run(status || p.status, observacao ?? p.observacao, p.id);
  if (status && status !== p.status) log(q.uid, 'SERVICO', `Pedido #${p.id}: ${p.status} → ${status}`);
  s.json({ ok: true });
});
api.delete('/pedidos/:id', (q, s) => {
  const r = db.prepare('DELETE FROM pedidos_servicos WHERE id=? AND usuario_id=?').run(q.params.id, q.uid);
  if (!r.changes) return erro(s, 404, 'Pedido não encontrado.');
  log(q.uid, 'SERVICO', `Pedido #${q.params.id} cancelado`);
  s.json({ ok: true });
});

// ---------- Laboratório de Física e Eletrônica ----------
const NOME_AREA = { campo_eletrico: 'Campo elétrico', eletrostatica: 'Eletrostática', magnetismo: 'Magnetismo',
  termodinamica: 'Termodinâmica', eletronica: 'Eletrônica' };
// Só calcula (não salva) — útil para conferir valores
api.post('/fisica/:area/calcular', (q, s) => s.json(Fisica.calcular(q.params.area, q.body.parametros || q.body)));
// Calcula no servidor e grava o experimento (o resultado salvo nunca vem do cliente)
api.post('/fisica/:area', (q, s) => {
  const { area } = q.params, { titulo, parametros = {}, ambiente_id, dispositivo_id } = q.body;
  if (!NOME_AREA[area]) return erro(s, 400, 'Área de física inválida.');
  if (dispositivo_id && !db.prepare('SELECT 1 FROM dispositivos WHERE id=? AND usuario_id=?').get(dispositivo_id, q.uid))
    return erro(s, 400, 'Dispositivo inválido.');
  const resultado = Fisica.calcular(area, parametros);
  const resumo = { ...resultado }; delete resumo.serie; // série temporal não precisa ir para o banco
  const nome = (titulo || NOME_AREA[area]).slice(0, 80);
  const id = db.prepare(`INSERT INTO experimentos(usuario_id,area,titulo,ambiente_id,dispositivo_id,parametros,resultado)
    VALUES(?,?,?,?,?,?,?)`).run(q.uid, area, nome, ambiente_id || null, dispositivo_id || null,
    JSON.stringify(parametros), JSON.stringify(resumo)).lastInsertRowid;
  log(q.uid, 'FISICA', `${NOME_AREA[area]}: experimento "${nome}" salvo`);
  s.status(201).json({ id, resultado });
});
api.get('/experimentos', (q, s) => s.json(db.prepare(`
  SELECT e.*, a.nome ambiente, d.nome dispositivo FROM experimentos e
  LEFT JOIN ambientes a ON a.id=e.ambiente_id LEFT JOIN dispositivos d ON d.id=e.dispositivo_id
  WHERE e.usuario_id=? ORDER BY e.id DESC`).all(q.uid)
  .map(e => ({ ...e, parametros: JSON.parse(e.parametros), resultado: JSON.parse(e.resultado) }))));
api.delete('/experimentos/:id', (q, s) => {
  const r = db.prepare('DELETE FROM experimentos WHERE id=? AND usuario_id=?').run(q.params.id, q.uid);
  if (!r.changes) return erro(s, 404, 'Experimento não encontrado.');
  s.json({ ok: true });
});

// Termostato: aplica o setpoint calculado ao ar-condicionado (mesma regra do circuito 04 do Logisim)
api.post('/dispositivos/:id/termostato', (q, s) => {
  const d = db.prepare('SELECT * FROM dispositivos WHERE id=? AND usuario_id=?').get(q.params.id, q.uid);
  if (!d) return erro(s, 404, 'Dispositivo não encontrado.');
  if (d.tipo !== 'ar-condicionado') return erro(s, 400, 'O termostato só vale para dispositivos do tipo ar-condicionado.');
  const r = Fisica.calcular('eletronica', { circuito: 'termostato',
    entradas: { T: q.body.temperatura, SET: q.body.setpoint, PRESENCA: q.body.presenca ? 1 : 0 } });
  const estado = r.saidas.COMPRESSOR ? `ligado ${r.entradas.SET}°C` : `standby ${r.entradas.SET}°C`;
  db.prepare('UPDATE dispositivos SET estado=? WHERE id=?').run(estado, d.id);
  log(q.uid, 'AUTOMACAO', `Termostato ${d.nome}: T=${r.entradas.T}°C, SET=${r.entradas.SET}°C → ${estado}`);
  s.json({ estado, ...r });
});

// Eletrônica com os dados reais da casa: entradas dos circuitos lidas do banco
api.get('/eletronica/casa', (q, s) => {
  const prods = db.prepare('SELECT id,nome,quantidade,quantidade_minima FROM produtos WHERE usuario_id=? ORDER BY id DESC').all(q.uid)
    .map(p => ({ ...p, cabe_em_4_bits: p.quantidade <= 15 && p.quantidade_minima <= 15,
      ...Fisica.calcular('eletronica', { circuito: 'alerta_estoque',
        entradas: { QTD: Math.min(15, p.quantidade), MIN: Math.min(15, p.quantidade_minima) } }).saidas }));
  const peds = db.prepare(`SELECT p.id, p.status, sv.titulo FROM pedidos_servicos p JOIN servicos sv ON sv.id=p.servico_id
    WHERE p.usuario_id=? ORDER BY p.id DESC`).all(q.uid).map(p => {
      const k = FLUXO.indexOf(p.status);
      return { ...p, S1: k >> 1, S0: k & 1 };
    });
  s.json({ produtos: prods, pedidos: peds });
});

// ---------- Histórico ----------
api.get('/historico', (q, s) => s.json(db.prepare('SELECT * FROM historico_transacoes WHERE usuario_id=? ORDER BY id DESC LIMIT 200').all(q.uid)));
api.delete('/historico', (q, s) => { db.prepare('DELETE FROM historico_transacoes WHERE usuario_id=?').run(q.uid); s.json({ ok: true }); });

api.use((q, s) => erro(s, 404, 'Rota não encontrada.'));
app.use((e, q, s, n) => erro(s, 400, e.message));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`▶ Alter Smart online em http://localhost:${PORT}`));
