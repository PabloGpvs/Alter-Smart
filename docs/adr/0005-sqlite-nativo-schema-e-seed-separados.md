# 0005. SQLite nativo do Node, com schema e seed separados do código

- **Status:** Aceito
- **Data:** 2026-11-13

## Contexto
O projeto usa o módulo `node:sqlite` (Node 22.13+), que não precisa de compilação nem de
servidor de banco — importante para rodar no Windows dos colegas e do professor com dois cliques.
Porém o `CREATE TABLE` e o seed estavam como strings dentro do `server.js`.

## Decisão
- Manter o SQLite nativo (`DatabaseSync`), com uma conexão única em `src/database/connection.js`
  e `PRAGMA foreign_keys = ON`.
- Estrutura das tabelas em `src/database/schema.sql` (SQL puro, comentado, idempotente com
  `IF NOT EXISTS`).
- Dados iniciais em `src/database/seed.js`, aplicados só quando o catálogo está vazio.
- `src/database/index.js` expõe `iniciarBanco()`, chamado pelo `server.js` e pelos testes,
  e pode rodar sozinho com `npm run db:setup`.
- Caminho do banco configurável (`DB_PATH`), o que permite banco em memória nos testes.

## Consequências
- O schema pode ser lido, revisado e aberto em qualquer ferramenta de SQL.
- Inicializar o banco deixa de ser efeito colateral de importar o servidor.
- Bancos já existentes continuam funcionando (mesmas tabelas, mesmo arquivo `database.sqlite`).
- Ainda não há migrações versionadas; mudança de coluna em banco existente exige cuidado manual.

## Alternativas consideradas
- **better-sqlite3:** exige compilação nativa no Windows.
- **PostgreSQL/MySQL:** exigiria instalar e configurar um servidor.
- **Ferramenta de migração (knex, umzug):** útil no futuro, desnecessária para o tamanho atual.
