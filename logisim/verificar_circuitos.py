#!/usr/bin/env python3
"""
Confere cada .circ no próprio Logisim-evolution 4.1.0 contra a regra esperada.
Uso:  python3 verificar_circuitos.py caminho/para/logisim-evolution-4.1.0-all.jar

- Circuitos combinacionais (01 a 05 e os blocos do projeto completo): modo texto "-t table",
  TODAS as combinações de entrada.
- Máquina de estados (06) e painel completo: vetores de teste do Logisim ("-w"), com sequência
  de pulsos de clock. O modo "-w" precisa de uma tela (no Linux sem tela, rode com xvfb-run).
"""
import os
import random
import subprocess
import sys
import tempfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
COMPLETO = "00_ALTER_SMART_COMPLETO.circ"

luz = lambda v: {"LUZ": (v["PRESENCA"] & v["ESCURO"]) | v["MANUAL"]}
alarme = lambda v: {"SIRENE": v["ARMADO"] & (v["PORTA"] | v["JANELA"] | v["MOVIMENTO"]),
                    "AVISO_ABERTA": (1 - v["ARMADO"]) & (v["PORTA"] | v["JANELA"])}
estoque = lambda v: {"BAIXO": int(v["QTD"] <= v["MIN"]), "OK": int(v["QTD"] > v["MIN"])}
termo = lambda v: {"COMPRESSOR": int(v["T"] > v["SET"]) & v["PRESENCA"], "NO_ALVO": int(v["T"] == v["SET"])}
def pedido(v):
    s, prox = v["S1"] * 2 + v["S0"], min(3, v["S1"] * 2 + v["S0"] + v["AVANCAR"])
    return {"N1": prox >> 1, "N0": prox & 1, "SOLICITADO": int(s == 0), "ACEITO": int(s == 1),
            "ANDAMENTO": int(s == 2), "CONCLUIDO": int(s == 3)}

TABELAS = [  # (arquivo, circuito de topo ou None, regra)
    ("01_luz_automatica.circ", None, luz), ("02_alarme_seguranca.circ", None, alarme),
    ("03_alerta_estoque.circ", None, estoque), ("04_termostato.circ", None, termo),
    ("05_status_pedido.circ", None, pedido),
    (COMPLETO, "luz_automatica", luz), (COMPLETO, "alarme", alarme), (COMPLETO, "alerta_estoque", estoque),
    (COMPLETO, "termostato", termo), (COMPLETO, "logica_pedido", pedido),
]

# Máquina de estados: (CLK, RESET) -> (S1, S0) esperado depois de cada passo
SEQ = [(0, 1, 0, 0), (0, 0, 0, 0), (1, 0, 0, 1), (0, 0, 0, 1), (1, 0, 1, 0), (0, 0, 1, 0),
       (1, 0, 1, 1), (0, 0, 1, 1), (1, 0, 1, 1), (0, 0, 1, 1), (0, 1, 0, 0), (1, 0, 0, 1)]


def java(jar, *args):
    return subprocess.run(["java", "-jar", jar, *args], capture_output=True, text=True, timeout=300).stdout


def tabela(jar, arquivo, topo, regra):
    args = [str(AQUI / arquivo), "-t", "table"] + (["--toplevel-circuit", topo] if topo else [])
    out = java(jar, *args).strip().splitlines()
    cab, linhas = out[0].split(), [l.split() for l in out[1:]]
    saidas = set(regra({k: 0 for k in cab}).keys())
    erros = 0
    for l in linhas:
        v = {k: int(x, 2) if set(x) <= {"0", "1"} else None for k, x in zip(cab, l)}
        esp = regra({k: v[k] for k in cab if k not in saidas})
        erros += any(v[k] != esp[k] for k in saidas)
    nome = arquivo + (f" [{topo}]" if topo else "")
    print(f"{'OK ' if not erros and linhas else 'ERRO'}  {nome}: {len(linhas)} combinações, {erros} divergências")
    return not erros and linhas


def vetor(jar, arquivo, circuito, cab, linhas, rotulo):
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
        largura = {"QTD": 4, "MIN": 4, "T": 5, "SET": 5}
        f.write(" ".join(f"{k}[{largura[k]}]" if k in largura else k for k in cab) + "\n" + "\n".join(" ".join(map(str, l)) for l in linhas) + "\n")
    out = java(jar, "-w", circuito, f.name, str(AQUI / arquivo))
    ok = f"Passed: {len(linhas)}, Failed: 0" in out
    print(f"{'OK ' if ok else 'ERRO'}  {rotulo}: {len(linhas)} vetores — {out.strip().splitlines()[-1] if out.strip() else 'sem saída (precisa de tela: use xvfb-run)'}")
    return ok


def main(jar):
    ok = all([tabela(jar, *t) for t in TABELAS])
    # máquina de estados (arquivo 06 e bloco dentro do projeto completo)
    cab = ["CLK", "RESET", "<set>", "<seq>", "S1", "S0", "SOLICITADO", "ACEITO", "ANDAMENTO", "CONCLUIDO"]
    lin = [[clk, rst, 1, i + 1, s1, s0, *[int(s1 * 2 + s0 == k) for k in range(4)]] for i, (clk, rst, s1, s0) in enumerate(SEQ)]
    ok &= vetor(jar, "06_maquina_pedido.circ", "main", cab, lin, "06_maquina_pedido.circ (sequência de clock)")
    ok &= vetor(jar, COMPLETO, "maquina_pedido", cab, lin, COMPLETO + " [maquina_pedido]")
    # painel completo: 400 combinações aleatórias de todas as chaves (pedido parado em Solicitado)
    random.seed(4)
    cab = ["PRESENCA", "ESCURO", "MANUAL", "ARMADO", "PORTA", "JANELA", "MOVIMENTO", "QTD", "MIN", "T", "SET", "PRESENCA_AR",
           "LUZ", "SIRENE", "AVISO_ABERTA", "BAIXO", "OK", "COMPRESSOR", "NO_ALVO", "SOLICITADO", "ACEITO", "ANDAMENTO", "CONCLUIDO"]
    lin = []
    for _ in range(400):
        v = {k: random.randint(0, 1) for k in ["PRESENCA", "ESCURO", "MANUAL", "ARMADO", "PORTA", "JANELA", "MOVIMENTO"]}
        v.update(QTD=random.randint(0, 15), MIN=random.randint(0, 15), T=random.randint(0, 31), SET=random.randint(0, 31), PRESENCA_AR=random.randint(0, 1))
        e = {**luz(v), **alarme(v), **estoque(v), **termo({**v, "PRESENCA": v["PRESENCA_AR"]}), "SOLICITADO": 1, "ACEITO": 0, "ANDAMENTO": 0, "CONCLUIDO": 0}
        fmt = {"QTD": 4, "MIN": 4, "T": 5, "SET": 5}
        lin.append([format(v[k], f"0{fmt[k]}b") if k in fmt else v.get(k, e.get(k)) for k in cab])
    ok &= vetor(jar, COMPLETO, "main", cab, lin, COMPLETO + " [painel main]")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "logisim-evolution-4.1.0-all.jar")
