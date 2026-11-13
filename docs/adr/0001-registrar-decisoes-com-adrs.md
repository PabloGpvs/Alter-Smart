# 0001. Registrar decisões de arquitetura com ADRs

- **Status:** Aceito
- **Data:** 2026-11-13

## Contexto
O projeto cresceu (autenticação, pedidos, estoque, automação, laboratório de física) e as
decisões de estrutura ficavam só no código ou na memória de quem escreveu. Na revisão da
disciplina de Software Architecture & Design Patterns foi pedido documentar essas decisões.

## Decisão
Toda decisão que afete a estrutura do sistema (camadas, organização de pastas, banco,
dependências, padrões) será registrada como um ADR em `docs/adr/`, numerado em sequência,
seguindo o `template.md`.

## Consequências
- Quem chega ao projeto entende o *porquê* da estrutura, não só o *como*.
- Mudar uma decisão exige um ADR novo, o que deixa o histórico rastreável.
- Custo pequeno: um arquivo Markdown curto por decisão.

## Alternativas consideradas
- **Só um README grande:** mistura instruções de uso com decisões e perde o histórico.
- **Comentários no código:** ficam espalhados e não explicam alternativas descartadas.
