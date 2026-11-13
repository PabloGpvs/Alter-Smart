# 0002. Arquitetura em camadas: routes → controllers → services → repositories

- **Status:** Aceito
- **Data:** 2026-11-13

## Contexto
Todo o back-end ficava no `server.js` (~275 linhas): conexão com o banco, criação das tabelas,
seed, autenticação, regras de negócio, SQL e definição das rotas, tudo junto. Isso dificultava
entender, testar e alterar qualquer parte sem afetar as outras (baixa coesão, alto acoplamento).

## Decisão
Separar o back-end em camadas, cada uma com uma única responsabilidade:

| Camada | Responsabilidade |
|---|---|
| **Routes** | Definem os endpoints (método + URL) e qual função do controller atende cada um. |
| **Controllers** | Tratam a requisição e a resposta HTTP: leem `req`, chamam o service, devolvem status + JSON. |
| **Services** | Regras de negócio: validações, fluxo de status do pedido, cálculos, histórico, transações. |
| **Repositories** | Acesso a dados: todo o SQL fica aqui. |
| **Database** | Conexão, schema e seed (`src/database`). |

A dependência é sempre de cima para baixo. Services lançam `AppError` e não conhecem `req`/`res`;
repositories não têm regra de negócio.

## Consequências
- Cada arquivo é pequeno e tem um motivo só para mudar (Princípio da Responsabilidade Única).
- Regras de negócio podem ser lidas sem ruído de HTTP ou SQL.
- Trocar o banco afetaria só repositories e `database/`.
- Há mais arquivos, e uma operação simples passa por quatro deles.

## Alternativas consideradas
- **Manter tudo no `server.js`:** mais rápido de escrever, mas é exatamente o problema apontado.
- **Só routes + controllers (SQL no controller):** reduz arquivos, mas mistura HTTP, regra e dados.
- **Usar um ORM (Sequelize/Prisma):** acrescentaria dependência pesada para um banco pequeno;
  o padrão Repository já isola o SQL.
