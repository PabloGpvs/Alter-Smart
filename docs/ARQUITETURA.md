# Arquitetura do Alter Smart

Este documento explica como o código está organizado e por quê.
As decisões em detalhe estão nos ADRs da pasta [`docs/adr/`](adr/).

## Visão geral

```
Navegador (public/)  ──HTTP/JSON──▶  Express (src/app.js)
                                      │
                                      ├─ /api ─▶ src/routes.js ─▶ módulos (src/modules/*)
                                      │                             routes → controller → service → repository
                                      │                                                                   │
                                      │                                                     src/database (SQLite)
                                      │
                                      └─ /shared/fisica.js ◀── mesmo núcleo usado pelos services do laboratório
```

## Estrutura de pastas

```
alter-smart/
├── server.js                  # só inicia: prepara o banco e abre a porta
├── src/
│   ├── app.js                 # monta o Express (middlewares, estáticos, /api, erros) — sem listen
│   ├── routes.js              # registra os routers de todos os módulos em /api
│   ├── config/                # porta, caminho do banco, pastas (tudo que muda por ambiente)
│   ├── database/
│   │   ├── connection.js      # conexão única com o SQLite + helper de transação
│   │   ├── schema.sql         # estrutura das tabelas
│   │   ├── seed.js            # catálogo inicial (serviços e cômodos)
│   │   └── index.js           # iniciarBanco(): aplica schema + seed  (npm run db:setup)
│   ├── core/
│   │   ├── AppError.js        # erro de negócio com status HTTP
│   │   └── crud/              # fábricas de repository/service/controller para CRUD simples
│   ├── middlewares/           # autenticar, rotaNaoEncontrada, tratarErros
│   └── modules/               # um módulo por assunto do domínio
│       ├── auth/              # cadastro, login, logout, sessão
│       ├── enderecos/
│       ├── ambientes/         # cômodos (catálogo global)
│       ├── servicos/          # catálogo de serviços (global)
│       ├── pedidos/           # pedidos de serviço e fluxo de status
│       ├── produtos/          # estoque e reposição
│       ├── dispositivos/      # aparelhos + termostato
│       ├── rotinas/           # automações (ações em lote)
│       ├── laboratorio/       # física/eletrônica e experimentos salvos
│       └── historico/         # registro das ações do usuário
├── shared/
│   └── fisica.js              # núcleo de cálculo usado pelo navegador E pelo servidor
├── public/                    # front-end estático
│   ├── index.html
│   ├── css/style.css
│   └── js/ (script.js, lab.js, como.js)
├── tests/api.test.js          # testes de integração (npm test)
├── logisim/                   # circuitos .circ do Logisim-evolution
└── docs/                      # documentação, ADRs e guia de Física/Eletrônica
```

## As camadas de cada módulo

Cada pasta em `src/modules/<modulo>/` tem os mesmos arquivos:

| Arquivo | Responsabilidade | Pode usar | Não pode |
|---|---|---|---|
| `<modulo>.routes.js` | Define os endpoints (método + URL) e liga cada um a uma função do controller | controller, middlewares | regra de negócio, SQL |
| `<modulo>.controller.js` | Lê `req` (params, body, usuário logado), chama o service e escreve `res` (status + JSON) | service | SQL, regra de negócio |
| `<modulo>.service.js` | Regras de negócio: validações, fluxo de status, cálculos, histórico, transações | repository do próprio módulo, services de outros módulos, `shared/fisica` | `req`/`res`, SQL |
| `<modulo>.repository.js` | Acesso a dados: SQL do próprio módulo | `database/connection` | regras de negócio, HTTP |

Regras de dependência:

1. As setas só vão para baixo: routes → controller → service → repository → database.
2. Um módulo só lê as tabelas de **outro** módulo através do **service** desse outro módulo
   (ex.: `pedidos.service` usa `servicos.service.buscar`, e `rotinas.service` usa
   `dispositivos.service.alterarEstado`). Nunca importa o repository alheio.
3. Erros de negócio são lançados como `AppError` pelo service; o middleware `tratarErros`
   transforma em `{ erro: "mensagem" }` com o status certo. Controllers não fazem `try/catch`.

### Exemplo: o caminho de "repor estoque"

```
POST /api/produtos/7/repor  { "quantidade": 5 }
  → produtos.routes.js       router.post('/produtos/:id/repor', controller.repor)
  → produtos.controller.js   service.repor(req.usuarioId, req.params.id, req.body)
  → produtos.service.js      valida quantidade > 0 e se o produto é do usuário,
                              soma a quantidade e registra "COMPRA" no histórico
  → produtos.repository.js   UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?
```

## CRUD genérico (src/core/crud)

Endereços, cômodos, serviços, dispositivos, produtos e rotinas têm as mesmas 4 operações
(listar, criar, atualizar, apagar). Em vez de repetir o mesmo código seis vezes, `core/crud`
tem fábricas para cada camada. Cada módulo continua tendo os seus 4 arquivos — e é neles
que entram as regras específicas (ex.: `produtos.service.repor`, `dispositivos.service.aplicarTermostato`).

## Front-end e código compartilhado

- O back-end **não** importa nada de `public/`. O núcleo de cálculo saiu de `public/fisica.js`
  para `shared/fisica.js`, que o servidor importa com `require` e o navegador baixa em
  `/shared/fisica.js`. Veja o [ADR 0004](adr/0004-nucleo-de-fisica-compartilhado.md).
- O front-end conversa com o back-end apenas pela API REST em `/api`.

## Como adicionar um módulo novo

1. Crie `src/modules/<novo>/` com `routes`, `controller`, `service` e `repository`.
2. Se precisar de tabela nova, acrescente em `src/database/schema.sql`.
3. Registre o router em `src/routes.js`.
4. Escreva um teste em `tests/`.
