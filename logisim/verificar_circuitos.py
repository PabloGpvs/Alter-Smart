#!/usr/bin/env python3
"""
Confere cada .circ no próprio Logisim-evolution (modo texto) contra a regra esperada.
Uso:  python3 verificar_circuitos.py caminho/para/logisim-evolution-4.1.0-all.jar
"""
import subprocess
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent

ESPERADO = {
    "01_luz_automatica.circ": lambda v: {"LUZ": (v["PRESENCA"] & v["ESCURO"]) | v["MANUAL"]},
    "02_alarme_seguranca.circ": lambda v: {
        "SIRENE": v["ARMADO"] & (v["PORTA"] | v["JANELA"] | v["MOVIMENTO"]),
        "AVISO_ABERTA": (1 - v["ARMADO"]) & (v["PORTA"] | v["JANELA"])},
    "03_alerta_estoque.circ": lambda v: {"BAIXO": int(v["QTD"] <= v["MIN"]), "OK": int(v["QTD"] > v["MIN"])},
    "04_termostato.circ": lambda v: {"COMPRESSOR": int(v["T"] > v["SET"]) & v["PRESENCA"], "NO_ALVO": int(v["T"] == v["SET"])},
    "05_status_pedido.circ": lambda v: (lambda s, prox: {
        "N1": prox >> 1, "N0": prox & 1,
        "SOLICITADO": int(s == 0), "ACEITO": int(s == 1), "ANDAMENTO": int(s == 2), "CONCLUIDO": int(s == 3)})(
        v["S1"] * 2 + v["S0"], min(3, v["S1"] * 2 + v["S0"] + v["AVANCAR"])),
}


def main(jar):
    falhas = 0
    for nome, regra in ESPERADO.items():
        out = subprocess.run(["java", "-Djava.awt.headless=true", "-jar", jar, str(AQUI / nome), "-t", "table"],
                             capture_output=True, text=True).stdout.strip().splitlines()
        cab, linhas = out[0].split(), [l.split() for l in out[1:]]
        saidas = set(regra({k: 0 for k in cab}).keys())
        erros = 0
        for l in linhas:
            v = {k: int(x, 2) if set(x) <= {"0", "1"} else None for k, x in zip(cab, l)}
            esp = regra({k: v[k] for k in cab if k not in saidas})
            erros += any(v[k] != esp[k] for k in saidas)
        print(f"{'OK ' if not erros and linhas else 'ERRO'}  {nome}: {len(linhas)} combinações testadas, {erros} divergências")
        falhas += erros or not linhas
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "logisim-evolution-4.1.0-all.jar")
