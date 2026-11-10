# Alter Smart
Requisitos: Node.js 18+ (testado com 20/22).
```
npm install
npm start
```
Abra http://localhost:3000, crie uma conta e use o sistema. O banco `database.sqlite` é criado automaticamente.

## Laboratório de Física & Eletrônica
Nova aba **Laboratório** com simuladores de **campo elétrico, eletrostática, magnetismo e termodinâmica** ligados aos dispositivos da casa, e circuitos digitais para o **Logisim-evolution v4.1.0** na pasta `logisim/` (luz automática, alarme, alerta de estoque, termostato e status do pedido).

Guia completo, com fórmulas e o roteiro de apresentação: [`docs/FISICA_E_ELETRONICA.md`](docs/FISICA_E_ELETRONICA.md).

## Feito para ser fácil de usar
O Alter Smart foi pensado para pessoas idosas e pessoas com deficiência ou comorbidades:
- Tela **Início** com botões grandes ("Ligar ou desligar aparelhos", "Pedir um serviço"…) e um resumo da casa
- **Explicação em todas as telas** (botão "❓ Ajuda na tela" mostra ou esconde)
- **Letra em 3 tamanhos** e modo **👓 Leitura fácil** (tira as linhas de TV e o brilho); a escolha fica salva
- Um botão grande por aparelho: **Acender/Apagar, Ligar/Desligar, Abrir/Fechar, Armar/Desarmar**
- Janelas próprias no lugar das caixinhas do navegador: confirmar exclusão, repor com botões − e +, e adicionar ação à rotina escolhendo da lista
- Botões de no mínimo 48 px, foco visível, navegação por teclado, link "Pular para o conteúdo", leitores de tela (ARIA) e mensagens que ficam mais tempo e podem ser fechadas
