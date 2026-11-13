# 0003. Organizar o back-end por módulos de domínio

- **Status:** Aceito
- **Data:** 2026-11-13

## Contexto
Com as camadas separadas (ADR 0002), seria possível ter pastas por tipo
(`controllers/`, `services/`…). Nesse modelo, alterar "pedidos" exige abrir quatro pastas diferentes,
e não fica claro quais arquivos pertencem a qual funcionalidade.

## Decisão
Organizar por **módulo de domínio** (*package by feature*): `src/modules/<modulo>/`, cada um com
`routes`, `controller`, `service` e `repository`. Módulos: `auth`, `enderecos`, `ambientes`,
`servicos`, `pedidos`, `produtos`, `dispositivos`, `rotinas`, `laboratorio` e `historico`.

Regra de comunicação: um módulo usa dados de outro **apenas pelo service** do outro
(ex.: `pedidos` → `servicos.service`, `rotinas` → `dispositivos.service`,
`laboratorio` → `produtos.service` e `pedidos.service`). Nunca importa o repository alheio.
Todos os módulos registram ações por meio de `historico.service`.

## Consequências
- Tudo de uma funcionalidade fica junto; fica fácil achar, revisar e apresentar.
- Um módulo novo é uma pasta nova + uma linha em `src/routes.js`.
- As dependências entre módulos ficam explícitas nos `require` dos services.
- É preciso cuidado para não criar dependência circular entre services.

## Alternativas consideradas
- **Pastas por camada técnica:** comum em tutoriais, mas espalha cada funcionalidade.
- **Microsserviços:** complexidade operacional desproporcional para o projeto.
