# Alter Smart — Física e Eletrônica

O Alter Smart controla uma casa: luzes, ar-condicionado, alarme, estoque e pedidos de serviço.
A aba **Laboratório** mostra a física que faz cada um desses dispositivos funcionar. A pasta
**`logisim/`** traz os circuitos digitais que tomam as decisões da casa, feitos para o
**Logisim-evolution v4.1.0**.

O cálculo vale igual no site e no banco: `public/fisica.js` é **um único arquivo** que roda no
navegador (para mostrar os resultados na hora) e no servidor (que recalcula tudo antes de gravar na
tabela `experimentos`).

---

## 1. Onde cada conteúdo de Física aparece

| Conteúdo | Dispositivo da casa | Onde no sistema | Fórmulas usadas |
|---|---|---|---|
| **Campo elétrico** | Purificador de ar eletrostático (as placas carregadas prendem a poeira) | Laboratório → *Campo elétrico* | E = k·q/r² (com superposição Σ), V = k·q/r, F = q·E, desenho das linhas de campo e das equipotenciais |
| **Eletrostática** | Botão touch do painel (sensor capacitivo) | Laboratório → *Eletrostática* | Lei de Coulomb F = k·q₁q₂/r², C = ε₀εᵣA/d, Q = C·V, U = ½CV², E = V/d, σ = Q/A |
| **Magnetismo** | Relé que liga a luz ou o ar + fio da tomada + sensor de porta com ímã | Laboratório → *Magnetismo* | B = μ₀μᵣNI/L (solenoide), F = B²A/2μ₀ (força que puxa a armadura), B = μ₀I/2πr (fio reto, regra da mão direita), Φ = B·A, ε = N·ΔΦ/Δt (Faraday) |
| **Termodinâmica** | Ar-condicionado de cada ambiente | Laboratório → *Termodinâmica* | 1ª lei: C·dT/dt = UA(Tₑₓₜ−T) + Q_int − Q_ar · Q = m·c·ΔT · máquina térmica reversa: Q_q = Q_f + W, COP = Q_f/W · 2ª lei: COP ≤ COP_Carnot = T_f/(T_q−T_f) · energia (kWh) e custo (R$) |

### Como cada simulador conversa com a casa
- **Eletrostática:** escolha uma luz e clique em *Tocar no painel*. Se a variação de capacitância
  passar do limiar, a luz muda de estado de verdade (tabela `dispositivos`).
- **Magnetismo:** escolha um dispositivo e clique em *Energizar bobina*. Ele só liga se a força
  magnética vencer a força da mola (`rele_fecha`). Diminua a corrente para ver o relé falhar.
- **Termodinâmica:** escolha o ambiente e o ar-condicionado. O gráfico mostra a temperatura minuto
  a minuto. O compressor liga e desliga com **a mesma regra do circuito 04 do Logisim**
  (`COMPRESSOR = (T > SET) · PRESENCA`, com o sensor lendo graus inteiros a cada minuto).
  *Aplicar setpoint* grava o novo estado no ar-condicionado.
- **Experimentos salvos:** cada cálculo pode ser salvo (tabela `experimentos`, com ambiente e
  dispositivo opcionais), reaberto depois e aparece no Histórico como `[FISICA]`.

### Números de exemplo (os valores que já vêm preenchidos)
- Quarto de 12 m², 2,7 m de pé-direito, 32 °C lá fora, setpoint de 23 °C: a carga térmica dá
  ≈ 1 460 W ≈ **5 000 BTU/h**. Um aparelho de 9 000 BTU/h com COP 3,2 consome ≈ **1,3 kWh** em
  3 h (≈ R$ 1,19). O COP de Carnot nessas temperaturas é ≈ 32,9, então o aparelho real chega a
  ≈ 10 % do limite teórico.
- Relé com 500 espiras, 2 cm de comprimento, 70 mA e μᵣ = 50: B ≈ 110 mT e F ≈ 0,48 N, maior que
  a mola de 0,3 N, então o contato fecha.
- Botão touch de 1 cm² sob 1 mm de vidro (εᵣ = 4,5): C ≈ 4 pF. O dedo acrescenta ≈ 5 pF
  (+125 %), então o toque é detectado.

---

## 2. Eletrônica digital — Logisim-evolution v4.1.0

Abra os arquivos em **Arquivo → Abrir** no Logisim-evolution 4.1.0. Para mexer nas entradas, use a
ferramenta **Cutucar** (a mãozinha). Cada circuito é a versão em portas lógicas de uma regra que o
sistema já usa em software:

| Arquivo | Regra da casa | Expressão | Componentes |
|---|---|---|---|
| `01_luz_automatica.circ` | Luz acende com presença no escuro ou no interruptor do app | LUZ = PRESENCA·ESCURO + MANUAL | AND, OR, LED |
| `02_alarme_seguranca.circ` | Alarme armado dispara com porta, janela ou movimento; aviso se alguma estiver aberta antes de armar | SIRENE = ARMADO·(PORTA+JANELA+MOVIMENTO) · AVISO = ¬ARMADO·(PORTA+JANELA) | OR de 3 entradas, AND, NOT |
| `03_alerta_estoque.circ` | Mesma regra do SQL `quantidade <= quantidade_minima` | BAIXO = (QTD<MIN)+(QTD=MIN) | Comparador de 4 bits, OR |
| `04_termostato.circ` | Termostato do ar (ligado à termodinâmica) | COMPRESSOR = (T>SET)·PRESENCA · NO_ALVO = (T=SET) | Comparador de 5 bits (0–31 °C), AND |
| `05_status_pedido.circ` | Fluxo do pedido 00 Solicitado → 01 Aceito → 10 Em andamento → 11 Concluído (só avança, igual à API) | INC = AVANCAR·¬(S1·S0) · N0 = S0⊕INC · N1 = S1⊕(S0·INC) + decodificador 2→4 | AND, NOT, XOR, decodificador com portas |

| `06_maquina_pedido.circ` | O mesmo fluxo do pedido, agora **sequencial**: cada pulso de clock avança um passo | 2 **D Flip-Flops** guardam S1 e S0; próximo estado: INC = ¬(S1·S0), N0 = S0⊕INC, N1 = S1⊕(S0·INC); RESET volta para 00 | Flip-flop D, AND, NOT, XOR, decodificador |
| **`00_ALTER_SMART_COMPLETO.circ`** | **O projeto inteiro em um arquivo**: um painel (`main`) com os circuitos 01 a 04 e 06 como **subcircuitos (blocos)**, chaves de entrada, LEDs e os botões **AVANCAR** e **RESET** | Hierarquia de subcircuitos com aparência própria | Subcircuitos, Button, LED |

### Como apresentar no Logisim
1. Abra o **`00_ALTER_SMART_COMPLETO.circ`** (Arquivo → Abrir).
2. Selecione a ferramenta **Cutucar** (a mãozinha, primeiro ícone da barra).
3. Clique nas chaves da esquerda (0 → 1) e veja os LEDs da direita mudarem:
   - **Luz:** PRESENCA=1 e ESCURO=1 acendem a LUZ. Com MANUAL=1 ela acende sempre.
   - **Alarme:** ARMADO=1 e PORTA=1 disparam a SIRENE. Com ARMADO=0 e uma janela aberta, acende AVISO_ABERTA.
   - **Estoque:** QTD e MIN ficam em binário (clique em cada bit). Com QTD ≤ MIN, acende BAIXO.
   - **Termostato:** T e SET ficam em binário (°C). Com T > SET e PRESENCA_AR=1, liga o COMPRESSOR.
4. No bloco do pedido, aperte **AVANCAR**. O LED passa de SOLICITADO para ACEITO, depois EM ANDAMENTO e CONCLUÍDO, e para no último. **RESET** volta ao início.
5. Para mostrar um circuito por dentro, dê dois cliques no bloco (ou escolha o circuito na lista da esquerda). Para voltar, clique em `main`.
6. Em **Projeto → Analisar circuito**, o Logisim mostra a tabela-verdade e a expressão de cada bloco combinacional.

Na aba **Laboratório → Eletrônica**:
- Cada cartão simula o mesmo circuito, com tabela-verdade e link para baixar o `.circ`.
- *Aplicar na luz / no alarme / no ar* grava o resultado do circuito no dispositivo real.
- *Dados reais da casa* passa os produtos do estoque pelo circuito 03 (em binário) e mostra os
  pedidos como S1S0. O botão **Avançar pelo circuito** usa N1N0 para mudar o status do pedido.

### Conferência automática
Os `.circ` são gerados por `logisim/gerar_circuitos.py`. O script `logisim/verificar_circuitos.py`
roda cada arquivo no próprio Logisim-evolution 4.1.0, em modo texto (`-t table`), e compara **todas**
as combinações de entrada com a regra esperada:

```
python3 logisim/gerar_circuitos.py
xvfb-run python3 logisim/verificar_circuitos.py caminho/logisim-evolution-4.1.0-all.jar
OK   01_luz_automatica.circ: 8 combinações, 0 divergências
OK   02_alarme_seguranca.circ: 16 combinações, 0 divergências
OK   03_alerta_estoque.circ: 256 combinações, 0 divergências
OK   04_termostato.circ: 2048 combinações, 0 divergências
OK   05_status_pedido.circ: 8 combinações, 0 divergências
OK   00_ALTER_SMART_COMPLETO.circ [cada bloco]: as mesmas combinações, 0 divergências
OK   06_maquina_pedido.circ (sequência de clock): 12 vetores — Passed: 12, Failed: 0
OK   00_ALTER_SMART_COMPLETO.circ [maquina_pedido]: 12 vetores — Passed: 12, Failed: 0
OK   00_ALTER_SMART_COMPLETO.circ [painel main]: 400 vetores — Passed: 400, Failed: 0
```
O botão AVANCAR do painel também foi testado clicando nele dentro do próprio Logisim.

---

## 3. O que mudou no código

- `public/fisica.js` — núcleo de cálculo (campo elétrico, eletrostática, magnetismo, termodinâmica e
  o espelho lógico dos 5 circuitos). Funciona no navegador e no Node.
- `public/lab.js` — aba Laboratório: desenhos em canvas, gráfico da temperatura, cartões dos
  circuitos e integração com os dispositivos.
- `server.js` — nova tabela `experimentos` e novas rotas:
  - `POST /api/fisica/:area` — calcula no servidor e salva o experimento
  - `POST /api/fisica/:area/calcular` — só calcula, sem salvar
  - `GET /api/experimentos` e `DELETE /api/experimentos/:id`
  - `POST /api/dispositivos/:id/termostato` — aplica o circuito 04 ao ar-condicionado
  - `GET /api/eletronica/casa` — passa estoque e pedidos pelos circuitos 03 e 05
  - `/logisim/*.circ` — download dos circuitos
- `docs/FISICA_E_ELETRONICA.md` — este guia.

> Modelos simplificados, para fins didáticos: o ar do ambiente é tratado como um único volume com
> temperatura uniforme ("inércia térmica" = quantas vezes a capacidade térmica do ar, para contar
> móveis e paredes). O sensor touch é modelado como um capacitor de placas paralelas com o vidro
> como dielétrico.
