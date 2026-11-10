# Alter Smart
Requisitos: Node.js 18+ (testado com 20/22).
```
npm install
npm start
```
Abra http://localhost:3000, crie uma conta e use o sistema. O banco `database.sqlite` é criado automaticamente.

## Física & Eletrônica
Tela **❓ Como funciona** (versão simples, para o morador) e **🔧 Área técnica** (no rodapé, para cuidadores e professores) com simuladores de **campo elétrico, eletrostática, magnetismo e termodinâmica** ligados aos dispositivos da casa, e circuitos digitais para o **Logisim-evolution v4.1.0** na pasta `logisim/` (luz automática, alarme, alerta de estoque, termostato e status do pedido).

Guia completo, com fórmulas e o roteiro de apresentação: [`docs/FISICA_E_ELETRONICA.md`](docs/FISICA_E_ELETRONICA.md).

## Feito para ser fácil de usar
O Alter Smart foi pensado para pessoas idosas e pessoas com deficiência ou comorbidades:
- Tela **Início** com botões grandes ("Ligar ou desligar aparelhos", "Pedir um serviço"…) e um resumo da casa
- **Explicação em todas as telas** (botão "❓ Ajuda na tela" mostra ou esconde)
- **Letra em 3 tamanhos** e modo **👓 Leitura fácil** (tira as linhas de TV e o brilho); a escolha fica salva
- Um botão grande por aparelho: **Acender/Apagar, Ligar/Desligar, Abrir/Fechar, Armar/Desarmar**
- Janelas próprias no lugar das caixinhas do navegador: confirmar exclusão, repor com botões − e +, e adicionar ação à rotina escolhendo da lista
- Botões de no mínimo 48 px, foco visível, navegação por teclado, link "Pular para o conteúdo", leitores de tela (ARIA) e mensagens que ficam mais tempo e podem ser fechadas

## Entrega: documentação + circuitos
- 📄 Documentação completa (Sistema, Física e Eletrônica): [docs/Alter_Smart_documentacao_completa.pdf](docs/Alter_Smart_documentacao_completa.pdf) · [Word](docs/Alter_Smart_documentacao_completa.docx)
- 🔌 Circuitos do Logisim-evolution 4.1.0 (pasta [`logisim/`](logisim/)):
  - **[00_ALTER_SMART_COMPLETO.circ](logisim/00_ALTER_SMART_COMPLETO.circ)**: projeto completo (abra este)
  - [01_luz_automatica.circ](logisim/01_luz_automatica.circ) · [02_alarme_seguranca.circ](logisim/02_alarme_seguranca.circ) · [03_alerta_estoque.circ](logisim/03_alerta_estoque.circ) · [04_termostato.circ](logisim/04_termostato.circ) · [05_status_pedido.circ](logisim/05_status_pedido.circ) · [06_maquina_pedido.circ](logisim/06_maquina_pedido.circ)

Para baixar um `.circ` pelo GitHub, abra o arquivo e clique em **Download raw file**. Para baixar tudo de uma vez, use **Code → Download ZIP**.
