# 0006. `app.js` separado do `server.js` e tratamento de erros centralizado

- **Status:** Aceito
- **Data:** 2026-11-13

## Contexto
O `server.js` montava o Express e chamava `listen` no mesmo arquivo, então não era possível
usar a aplicação em testes sem abrir a porta 3000. Além disso, cada rota montava sua resposta de
erro (`s.status(…).json({ erro })`) misturando HTTP com regra de negócio.

## Decisão
- `src/app.js` monta e exporta a aplicação (middlewares, estáticos, `/api`, erros), sem `listen`.
- `server.js` apenas chama `iniciarBanco()` e `app.listen(PORT)`.
- `src/routes.js` registra os routers dos módulos; rotas públicas (cadastro/login) vêm antes do
  middleware `autenticar`.
- Services lançam `AppError(status, mensagem)`; o middleware `tratarErros` converte em
  `{ erro: mensagem }`. Erros que não são `AppError` (JSON malformado, restrições do banco,
  parâmetro de física inválido) continuam respondendo 400, como antes.

## Consequências
- Os testes (`npm test`) sobem o app numa porta aleatória com banco em memória.
- Controllers ficam com uma linha cada, sem `try/catch`.
- O contrato da API não mudou: as mesmas URLs, status e mensagens de antes.

## Alternativas consideradas
- **Cada controller tratar seus erros:** repetitivo e fácil de esquecer um caso.
- **Usar uma biblioteca de erros HTTP (http-errors):** uma classe de 20 linhas resolve.
