# Architecture Decision Records (ADRs)

Cada ADR registra **uma** decisão de arquitetura: o contexto, o que foi decidido, as
consequências e as alternativas descartadas. ADRs não são apagados: se uma decisão mudar,
cria-se um ADR novo que "substitui" o antigo.

| Nº | Decisão | Status |
|---|---|---|
| [0001](0001-registrar-decisoes-com-adrs.md) | Registrar decisões de arquitetura com ADRs | Aceito |
| [0002](0002-arquitetura-em-camadas.md) | Arquitetura em camadas: routes → controllers → services → repositories | Aceito |
| [0003](0003-organizacao-por-modulos.md) | Organizar o back-end por módulos de domínio | Aceito |
| [0004](0004-nucleo-de-fisica-compartilhado.md) | Núcleo de física em `shared/`, fora de `public/` | Aceito |
| [0005](0005-sqlite-nativo-schema-e-seed-separados.md) | SQLite nativo do Node, com schema e seed separados do código | Aceito |
| [0006](0006-app-separado-do-server-e-erros-centralizados.md) | `app.js` separado do `server.js` e tratamento de erros centralizado | Aceito |
| [0007](0007-fabricas-crud.md) | Fábricas genéricas para os CRUDs simples | Aceito |

Modelo para um ADR novo: copie [template.md](template.md).
