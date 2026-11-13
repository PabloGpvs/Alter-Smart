-- =====================================================================
-- Alter Smart — estrutura do banco (SQLite)
-- Aplicado na inicialização por src/database/index.js (idempotente).
-- =====================================================================

-- ---------- Usuários e autenticação ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id    INTEGER PRIMARY KEY,
  nome  TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL                -- "salt:hash" (scrypt)
);

CREATE TABLE IF NOT EXISTS sessoes (
  token      TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enderecos (
  id         INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rua        TEXT NOT NULL,
  numero     TEXT NOT NULL
);

-- ---------- Catálogo (global, compartilhado por todos) ----------
CREATE TABLE IF NOT EXISTS ambientes (
  id   INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS servicos (
  id             INTEGER PRIMARY KEY,
  titulo         TEXT NOT NULL,
  descricao      TEXT,
  preco_estimado REAL DEFAULT 0
);

-- ---------- Pedidos de serviço ----------
CREATE TABLE IF NOT EXISTS pedidos_servicos (
  id           INTEGER PRIMARY KEY,
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  servico_id   INTEGER NOT NULL REFERENCES servicos(id),
  ambiente_id  INTEGER REFERENCES ambientes(id),
  observacao   TEXT,
  status       TEXT NOT NULL DEFAULT 'Solicitado'
               CHECK (status IN ('Solicitado','Aceito','Em andamento','Concluído')),
  data_criacao TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ---------- Estoque (produto + quantidade atual e mínima) ----------
CREATE TABLE IF NOT EXISTS produtos (
  id                INTEGER PRIMARY KEY,
  usuario_id        INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome              TEXT NOT NULL,
  quantidade        INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 1
);

-- ---------- Automação residencial ----------
CREATE TABLE IF NOT EXISTS dispositivos (
  id          INTEGER PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ambiente_id INTEGER REFERENCES ambientes(id),
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'luz',
  estado      TEXT NOT NULL DEFAULT 'desligado'
);

CREATE TABLE IF NOT EXISTS rotinas (
  id         INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  descricao  TEXT
);

CREATE TABLE IF NOT EXISTS rotina_acoes (
  id             INTEGER PRIMARY KEY,
  rotina_id      INTEGER NOT NULL REFERENCES rotinas(id) ON DELETE CASCADE,
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
  acao           TEXT NOT NULL
);

-- ---------- Laboratório de Física e Eletrônica ----------
-- Cada cálculo salvo pelo usuário (parâmetros e resultado em JSON)
CREATE TABLE IF NOT EXISTS experimentos (
  id             INTEGER PRIMARY KEY,
  usuario_id     INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  area           TEXT NOT NULL
                 CHECK (area IN ('campo_eletrico','eletrostatica','magnetismo','termodinamica','eletronica')),
  titulo         TEXT NOT NULL,
  ambiente_id    INTEGER REFERENCES ambientes(id) ON DELETE SET NULL,
  dispositivo_id INTEGER REFERENCES dispositivos(id) ON DELETE SET NULL,
  parametros     TEXT NOT NULL,
  resultado      TEXT NOT NULL,
  data           TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- ---------- Histórico (auditoria das ações do usuário) ----------
CREATE TABLE IF NOT EXISTS historico_transacoes (
  id         INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo       TEXT NOT NULL,
  descricao  TEXT NOT NULL,
  data       TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
