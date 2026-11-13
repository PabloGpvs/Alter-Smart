# 0004. Núcleo de física em `shared/`, fora de `public/`

- **Status:** Aceito
- **Data:** 2026-11-13

## Contexto
Os cálculos de física e eletrônica precisam rodar nos dois lados: no navegador (resposta imediata
nos simuladores) e no servidor (que recalcula antes de salvar o experimento, para que o resultado
gravado nunca venha do cliente). O arquivo ficava em `public/fisica.js` e o `server.js` fazia
`require('./public/fisica')` — o back-end dependia diretamente de um arquivo do front-end.
Qualquer reorganização do front podia quebrar o servidor.

## Decisão
Mover o núcleo para `shared/fisica.js` (formato UMD: funciona com `require` e como `window.Fisica`).
- O back-end importa `shared/fisica` nos services (`laboratorio`, `dispositivos`).
- O `app.js` serve a pasta em `/shared`, e o `index.html` carrega `/shared/fisica.js`.
- O back-end não importa nada de `public/`.

## Consequências
- Front e back continuam usando **exatamente o mesmo** cálculo (uma única fonte de verdade).
- `public/` pode ser reorganizado livremente (já foi: `css/` e `js/`).
- `shared/` só pode conter código que roda nos dois ambientes (sem `fs`, sem DOM).

## Alternativas consideradas
- **Duplicar o cálculo no front e no back:** risco de os resultados divergirem.
- **Calcular só no servidor:** cada mudança num controle deslizante faria uma requisição.
- **Bundler (webpack/vite):** resolveria, mas adiciona etapa de build ao projeto.
