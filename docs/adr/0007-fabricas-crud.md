# 0007. Fábricas genéricas para os CRUDs simples

- **Status:** Aceito
- **Data:** 2026-11-13

## Contexto
Seis recursos (endereços, cômodos, serviços, dispositivos, produtos e rotinas) têm as mesmas
quatro operações: listar, criar, atualizar e apagar, com as mesmas regras (só colunas permitidas,
"Nada para atualizar", "Registro não encontrado", registro opcional no histórico, filtro pelo
usuário dono). Escrever isso seis vezes em cada camada geraria muita repetição.

## Decisão
Criar em `src/core/crud/` uma fábrica por camada (padrão *Factory*):
`criarRepositorioCrud`, `criarServicoCrud`, `criarControllerCrud` e `registrarRotasCrud`.
Cada módulo **continua tendo seus próprios quatro arquivos**, que usam a fábrica e acrescentam
o que é específico (ex.: `produtos.service.repor`, `dispositivos.service.aplicarTermostato`,
`rotinas.service.executar`). Módulos com regras próprias demais (`pedidos`, `auth`,
`laboratorio`, `historico`) não usam a fábrica.

## Consequências
- Correção numa regra comum vale para todos os recursos de uma vez.
- Lista de colunas permitidas fica declarada em um só lugar por módulo (proteção contra
  gravação de campos indevidos, como `usuario_id`).
- Quem lê um módulo simples precisa abrir `core/crud` para ver o comportamento completo.

## Alternativas consideradas
- **Código explícito em cada módulo:** mais didático, porém ~6× mais código repetido.
- **Uma única função `crud()` registrando rotas direto no router (como antes):** misturava
  rotas, regras e SQL na mesma função, contrariando o ADR 0002.
