#!/usr/bin/env python3
"""
Gera os circuitos .circ do Alter Smart para o Logisim-evolution v4.1.0.

Cada circuito implementa em hardware (portas lógicas) uma regra que o
sistema web já executa em software. Rode:  python3 gerar_circuitos.py
Os arquivos .circ são escritos nesta mesma pasta.
"""
from pathlib import Path
from xml.sax.saxutils import quoteattr

AQUI = Path(__file__).resolve().parent

HEADER = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<project source="4.1.0" version="1.0">
  This file is intended to be loaded by Logisim-evolution v4.1.0(https://github.com/logisim-evolution/).

  <lib desc="#Wiring" name="0">
    <tool name="Pin">
      <a name="appearance" val="classic"/>
    </tool>
  </lib>
  <lib desc="#Gates" name="1"/>
  <lib desc="#Plexers" name="2"/>
  <lib desc="#Arithmetic" name="3"/>
  <lib desc="#Memory" name="4"/>
  <lib desc="#I/O" name="5"/>
  <lib desc="#TTL" name="6"/>
  <lib desc="#TCL" name="7"/>
  <lib desc="#Base" name="8"/>
  <lib desc="#BFH-Praktika" name="9"/>
  <lib desc="#Input/Output-Extra" name="10"/>
  <lib desc="#Soc" name="11"/>
  <main name="main"/>
  <options>
    <a name="gateUndefined" val="ignore"/>
    <a name="simlimit" val="1000"/>
    <a name="simrand" val="0"/>
  </options>
  <mappings>
    <tool lib="8" map="Button2" name="Poke Tool"/>
    <tool lib="8" map="Button3" name="Menu Tool"/>
    <tool lib="8" map="Ctrl Button1" name="Menu Tool"/>
  </mappings>
  <toolbar>
    <tool lib="8" name="Poke Tool"/>
    <tool lib="8" name="Edit Tool"/>
    <tool lib="8" name="Wiring Tool"/>
    <tool lib="8" name="Text Tool"/>
    <sep/>
    <tool lib="0" name="Pin"/>
    <tool lib="0" name="Pin">
      <a name="facing" val="west"/>
      <a name="output" val="true"/>
    </tool>
    <sep/>
    <tool lib="1" name="NOT Gate"/>
    <tool lib="1" name="AND Gate"/>
    <tool lib="1" name="OR Gate"/>
    <tool lib="1" name="XOR Gate"/>
    <tool lib="1" name="NAND Gate"/>
    <tool lib="1" name="NOR Gate"/>
    <sep/>
    <tool lib="4" name="D Flip-Flop"/>
    <tool lib="4" name="Register"/>
  </toolbar>
"""

COR = {"verde": "#00ff66", "rosa": "#ff007f", "ciano": "#00f0ff", "amarelo": "#ffd400", "vermelho": "#f00000"}


class Circuito:
    # DX: tudo que não é entrada/título é desenhado DX px à direita, deixando espaço
    # entre os túneis das entradas e os túneis que alimentam as portas.
    DX = 200

    def __init__(self, nome="main"):
        self.nome = nome
        self.comps = []      # (xml, [pontos de conexão])
        self.fios = []       # [(p1, p2)]

    # ---------- componentes ----------
    def _add(self, lib, loc, name, attrs, pontos):
        a = "".join(f'\n      <a name="{k}" val={quoteattr(str(v))}/>' for k, v in attrs.items())
        x, y = loc[0] + self.DX, loc[1]
        xml = f'    <comp lib="{lib}" loc="({x},{y})" name="{name}">{a}\n    </comp>' if a else \
              f'    <comp lib="{lib}" loc="({x},{y})" name="{name}"/>'
        self.comps.append((xml, pontos))

    def entrada(self, loc, rotulo, bits=1):
        at = {"appearance": "NewPins", "label": rotulo}
        if bits > 1:
            at["width"] = bits
        self._add(0, loc, "Pin", at, [loc])
        return loc

    def saida(self, loc, rotulo, bits=1):
        at = {"appearance": "NewPins", "facing": "west", "output": "true", "label": rotulo}
        if bits > 1:
            at["width"] = bits
        self._add(0, loc, "Pin", at, [loc])
        return loc

    def tunel(self, loc, rotulo, lado="west", bits=1):
        at = {"facing": lado, "label": rotulo}
        if bits > 1:
            at["width"] = bits
        self._add(0, loc, "Tunnel", at, [loc])
        return loc

    def porta(self, tipo, loc, n=2, rotulo=None):
        """AND/OR/XOR (tamanho 50). Retorna (lista_entradas, saida)."""
        x, y = loc
        dx = 60 if tipo == "XOR" else 50
        offs = {2: [-20, 20], 3: [-20, 0, 20]}[n]
        ins = [(x - dx, y + o) for o in offs]
        at = {}
        if n != 2:
            at["inputs"] = n
        if rotulo:
            at["label"] = rotulo
        self._add(1, loc, f"{tipo} Gate", at, ins + [loc])
        return ins, loc

    def nao(self, loc):
        x, y = loc
        self._add(1, loc, "NOT Gate", {}, [(x - 30, y), loc])
        return (x - 30, y), loc

    def comparador(self, loc, bits):
        """Retorna (A, B, maior, igual, menor)."""
        x, y = loc
        self._add(3, loc, "Comparator", {"width": bits, "mode": "unsigned"},
                  [(x - 40, y - 10), (x - 40, y + 10), (x, y - 10), loc, (x, y + 10)])
        return (x - 40, y - 10), (x - 40, y + 10), (x, y - 10), loc, (x, y + 10)

    def led(self, loc, rotulo, cor="verde"):
        # rótulo só aparece no Logisim ao passar o mouse/propriedades (o pino de saída ao lado já mostra o nome)
        self._add(5, loc, "LED", {"color": COR[cor], "label": rotulo, "labelvisible": "false"}, [loc])
        return loc

    def texto(self, loc, txt, tam=12, negrito=False):
        fonte = f"SansSerif {'bold' if negrito else 'plain'} {tam}"
        self._add(8, (loc[0] - self.DX + 60, loc[1]), "Text", {"text": txt, "font": fonte, "halign": "left"}, [])

    # ---------- fios ----------
    def fio(self, *pts):
        """Liga os pontos em sequência; segmentos não ortogonais viram um 'L' (horizontal, depois vertical)."""
        for a, b in zip(pts, pts[1:]):
            if a[0] != b[0] and a[1] != b[1]:
                m = (b[0], a[1])
                self.fios += [(a, m), (m, b)]
            elif a != b:
                self.fios.append((a, b))

    def _quebrar_fios(self):
        """Divide fios em todo ponto onde outro fio termina ou um componente se conecta (gera junções reais)."""
        pontos = {p for f in self.fios for p in f} | {p for _, ps in self.comps for p in ps}
        saida = []
        for a, b in self.fios:
            if a[1] == b[1]:
                xs = sorted({a[0], b[0]} | {p[0] for p in pontos if p[1] == a[1] and min(a[0], b[0]) < p[0] < max(a[0], b[0])})
                saida += [((x1, a[1]), (x2, a[1])) for x1, x2 in zip(xs, xs[1:])]
            else:
                ys = sorted({a[1], b[1]} | {p[1] for p in pontos if p[0] == a[0] and min(a[1], b[1]) < p[1] < max(a[1], b[1])})
                saida += [((a[0], y1), (a[0], y2)) for y1, y2 in zip(ys, ys[1:])]
        return sorted(set(saida))

    def xml(self):
        linhas = [f'  <circuit name="{self.nome}">',
                  '    <a name="appearance" val="logisim_evolution"/>',
                  f'    <a name="circuit" val="{self.nome}"/>']
        linhas += [c for c, _ in self.comps]
        d = self.DX
        linhas += [f'    <wire from="({a[0] + d},{a[1]})" to="({b[0] + d},{b[1]})"/>' for a, b in self._quebrar_fios()]
        linhas.append("  </circuit>")
        return "\n".join(linhas)


def salvar(nome_arquivo, circ):
    (AQUI / nome_arquivo).write_text(HEADER + circ.xml() + "\n</project>\n", encoding="utf-8")
    print("gerado:", nome_arquivo)


def entrada_com_tunel(c, y, rotulo, bits=1, x=170 - Circuito.DX):
    c.entrada((x, y), rotulo, bits)
    c.fio((x, y), (x + 40, y))
    c.tunel((x + 40, y), rotulo, "west", bits)


def tunel_para(c, ponto, rotulo, bits=1, recuo=40):
    """Túnel à esquerda de uma entrada de porta, ligado por fio."""
    t = (ponto[0] - recuo, ponto[1])
    c.tunel(t, rotulo, "east", bits)
    c.fio(t, ponto)


def saida_com_led(c, origem, y_saida, rotulo, cor="verde", x_led=560, x_pino=640):
    c.fio(origem, (x_led - 30, origem[1]), (x_led - 30, y_saida), (x_pino, y_saida))
    c.led((x_led, y_saida - 30), rotulo + "_LED", cor)
    c.fio((x_led, y_saida), (x_led, y_saida - 30))
    c.saida((x_pino, y_saida), rotulo)


# =====================================================================
# 01 — Luz automática:  LUZ = (PRESENCA · ESCURO) + MANUAL
#      (aba Automação → dispositivo do tipo "luz")
# =====================================================================
def luz_automatica():
    c = Circuito()
    c.texto((40, 30), "ALTER SMART // 01 - LUZ AUTOMATICA", 18, True)
    c.texto((40, 55), "LUZ = (PRESENCA . ESCURO) + MANUAL   |  sensor PIR + LDR + interruptor do app")
    for y, n in [(120, "PRESENCA"), (180, "ESCURO"), (240, "MANUAL")]:
        entrada_com_tunel(c, y, n)
    (a1, a2), sa = c.porta("AND", (330, 150))
    tunel_para(c, a1, "PRESENCA")
    tunel_para(c, a2, "ESCURO")
    (o1, o2), so = c.porta("OR", (460, 200))
    c.fio(sa, (380, 150), (380, 180), o1)
    tunel_para(c, o2, "MANUAL", recuo=120)
    saida_com_led(c, so, 200, "LUZ", "amarelo")
    salvar("01_luz_automatica.circ", c)


# =====================================================================
# 02 — Alarme:  SIRENE = ARMADO · (PORTA + JANELA + MOVIMENTO)
#      AVISO_ABERTA = NOT ARMADO · (PORTA + JANELA)   (lembrete p/ fechar antes de armar)
#      (dispositivo do tipo "seguranca")
# =====================================================================
def alarme():
    c = Circuito()
    c.texto((40, 30), "ALTER SMART // 02 - ALARME RESIDENCIAL", 18, True)
    c.texto((40, 55), "SIRENE = ARMADO . (PORTA + JANELA + MOVIMENTO)    AVISO = /ARMADO . (PORTA + JANELA)")
    for y, n in [(120, "ARMADO"), (170, "PORTA"), (220, "JANELA"), (270, "MOVIMENTO")]:
        entrada_com_tunel(c, y, n)
    (o1, o2, o3), so = c.porta("OR", (330, 180), 3)
    # entradas da OR de 3 vias ficam a 20 px; os túneis são espaçados e ligados em "L"
    c.tunel((220, 130), "PORTA", "east"); c.fio((220, 130), (260, 130), (260, 160), o1)
    c.tunel((220, 180), "JANELA", "east"); c.fio((220, 180), o2)
    c.tunel((220, 230), "MOVIMENTO", "east"); c.fio((220, 230), (260, 230), (260, 200), o3)
    (a1, a2), sa = c.porta("AND", (460, 160))
    c.tunel((330, 100), "ARMADO", "east"); c.fio((330, 100), (390, 100), (390, 140), a1)
    c.fio(so, (380, 180), a2)
    saida_com_led(c, sa, 160, "SIRENE", "vermelho")

    (o4, o5), so2 = c.porta("OR", (330, 330))
    tunel_para(c, o4, "PORTA")
    tunel_para(c, o5, "JANELA")
    ni, no = c.nao((330, 410))
    tunel_para(c, ni, "ARMADO", recuo=70)
    (a3, a4), sa2 = c.porta("AND", (460, 370))
    c.fio(so2, (380, 330), (380, 350), a3)
    c.fio(no, (380, 410), (380, 390), a4)
    saida_com_led(c, sa2, 370, "AVISO_ABERTA", "amarelo")
    salvar("02_alarme_seguranca.circ", c)


# =====================================================================
# 03 — Alerta de estoque: BAIXO = (QTD <= MIN)  — a mesma regra do SQL
#      "quantidade <= quantidade_minima" da aba Estoque (4 bits = 0..15 unidades)
# =====================================================================
def estoque():
    c = Circuito()
    c.texto((40, 30), "ALTER SMART // 03 - ALERTA DE ESTOQUE", 18, True)
    c.texto((40, 55), "BAIXO = (QTD < MIN) + (QTD = MIN)   ->  mesma regra do banco: quantidade <= quantidade_minima")
    entrada_com_tunel(c, 120, "QTD", 4)
    entrada_com_tunel(c, 180, "MIN", 4)
    A, B, gt, eq, lt = c.comparador((300, 160), 4)
    c.tunel((220, 120), "QTD", "east", 4); c.fio((220, 120), (240, 120), (240, 150), A)
    c.tunel((220, 200), "MIN", "east", 4); c.fio((220, 200), (240, 200), (240, 170), B)
    (o1, o2), so = c.porta("OR", (440, 200))
    c.fio(eq, (360, 160), (360, 180), o1)
    c.fio(lt, (340, 170), (340, 220), o2)
    saida_com_led(c, so, 200, "BAIXO", "rosa")
    c.fio(gt, (320, 150), (320, 100), (640, 100))
    c.led((560, 100), "OK_LED", "verde")
    c.saida((640, 100), "OK")
    salvar("03_alerta_estoque.circ", c)


# =====================================================================
# 04 — Termostato do ar-condicionado (liga com a termodinâmica)
#      RESFRIAR = (T > SET) · PRESENCA     NO_ALVO = (T = SET)    (5 bits = 0..31 °C)
# =====================================================================
def termostato():
    c = Circuito()
    c.texto((40, 30), "ALTER SMART // 04 - TERMOSTATO DO AR-CONDICIONADO", 18, True)
    c.texto((40, 55), "COMPRESSOR = (T > SET) . PRESENCA   |   NO_ALVO = (T = SET)   |   T e SET em graus C (0 a 31)")
    entrada_com_tunel(c, 120, "T", 5)
    entrada_com_tunel(c, 180, "SET", 5)
    entrada_com_tunel(c, 240, "PRESENCA")
    A, B, gt, eq, lt = c.comparador((300, 160), 5)
    c.tunel((220, 120), "T", "east", 5); c.fio((220, 120), (240, 120), (240, 150), A)
    c.tunel((220, 200), "SET", "east", 5); c.fio((220, 200), (240, 200), (240, 170), B)
    (a1, a2), sa = c.porta("AND", (440, 170))
    c.fio(gt, (320, 150), a1)
    c.tunel((370, 330), "PRESENCA", "east"); c.fio((370, 330), (390, 330), a2)
    saida_com_led(c, sa, 170, "COMPRESSOR", "ciano")
    c.fio(eq, (310, 160), (310, 280), (640, 280))
    c.led((560, 280), "NO_ALVO_LED", "verde")
    c.saida((640, 280), "NO_ALVO")
    salvar("04_termostato.circ", c)


# =====================================================================
# 05 — Status do pedido de serviço (máquina de estados de 2 bits)
#      00 Solicitado -> 01 Aceito -> 10 Em andamento -> 11 Concluído (satura)
#      INC = AVANCAR · /(S1·S0);  N0 = S0 xor INC;  N1 = S1 xor (S0·INC)
#      + decodificador 2->4 que acende o LED do status atual
# =====================================================================
def status_pedido():
    c = Circuito()
    c.texto((40, 30), "ALTER SMART // 05 - STATUS DO PEDIDO (logica de proximo estado + decodificador)", 18, True)
    c.texto((40, 55), "00 Solicitado -> 01 Aceito -> 10 Em andamento -> 11 Concluido.  So avanca (igual a API PUT /pedidos/:id)")
    for y, n in [(120, "S1"), (170, "S0"), (220, "AVANCAR")]:
        entrada_com_tunel(c, y, n)
    # INC
    (a1, a2), sa = c.porta("AND", (260, 300))
    tunel_para(c, a1, "S1")
    tunel_para(c, a2, "S0")
    ni, no = c.nao((330, 300))
    c.fio(sa, ni)
    (a3, a4), sa3 = c.porta("AND", (460, 320))
    c.fio(no, (380, 300), a3)
    tunel_para(c, a4, "AVANCAR", recuo=120)
    c.fio(sa3, (480, 320))
    c.tunel((480, 320), "INC", "west")
    # N0 = S0 xor INC
    (x1, x2), sx = c.porta("XOR", (900, 120))
    tunel_para(c, x1, "S0")
    tunel_para(c, x2, "INC")
    c.fio(sx, (960, 120)); c.saida((960, 120), "N0")
    # N1 = S1 xor (S0 . INC)
    (a5, a6), sa5 = c.porta("AND", (780, 270))
    tunel_para(c, a5, "S0")
    tunel_para(c, a6, "INC")
    (x3, x4), sx2 = c.porta("XOR", (900, 230))
    tunel_para(c, x3, "S1")
    c.fio(sa5, (820, 270), x4)
    c.fio(sx2, (960, 230)); c.saida((960, 230), "N1")
    # Decodificador 2 -> 4
    c.texto((760, 350), "Decodificador 2->4 (status atual)", 14, True)
    c.tunel((620, 380), "S1", "east"); c.fio((620, 380), (650, 380))
    i1, n1 = c.nao((680, 380)); c.fio(n1, (700, 380)); c.tunel((700, 380), "NS1", "west")
    c.tunel((620, 430), "S0", "east"); c.fio((620, 430), (650, 430))
    i0, n0 = c.nao((680, 430)); c.fio(n0, (700, 430)); c.tunel((700, 430), "NS0", "west")
    linhas = [("NS1", "NS0", "SOLICITADO", "amarelo"), ("NS1", "S0", "ACEITO", "ciano"),
              ("S1", "NS0", "ANDAMENTO", "rosa"), ("S1", "S0", "CONCLUIDO", "verde")]
    for k, (e1, e2, rot, cor) in enumerate(linhas):
        y = 500 + k * 80
        (p1, p2), s = c.porta("AND", (820, y))
        tunel_para(c, p1, e1)
        tunel_para(c, p2, e2)
        c.fio(s, (960, y))
        c.led((900, y), rot + "_LED", cor)
        c.saida((960, y), rot)
    salvar("05_status_pedido.circ", c)


if __name__ == "__main__":
    luz_automatica()
    alarme()
    estoque()
    termostato()
    status_pedido()
