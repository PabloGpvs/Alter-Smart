/*
 * Alter Smart — núcleo de Física e Eletrônica.
 * O MESMO arquivo roda no navegador (window.Fisica) e no servidor (require('./shared/fisica')),
 * então o resultado mostrado na tela é exatamente o que fica salvo no banco.
 * Unidades SI em todas as contas; as entradas da interface são convertidas antes.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.Fisica = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const K = 8.9875517923e9;      // constante eletrostática (N·m²/C²)
  const EPS0 = 8.8541878128e-12; // permissividade do vácuo (F/m)
  const MU0 = 4 * Math.PI * 1e-7; // permeabilidade do vácuo (T·m/A)
  const AR = { rho: 1.2, c: 1005 }; // ar: densidade (kg/m³) e calor específico (J/kg·K)
  const BTU_H = 0.29307107;       // 1 BTU/h em W

  const num = (v, nome, { min = -Infinity, max = Infinity } = {}) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) throw new Error(`Parâmetro inválido: ${nome}`);
    return n;
  };

  // ======================= CAMPO ELÉTRICO =======================
  // Princípio da superposição: E = Σ k·q·r̂ / r²   |   V = Σ k·q / r
  function campoEm(cargas, x, y) {
    let Ex = 0, Ey = 0, V = 0;
    for (const c of cargas) {
      const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy;
      if (r2 < 1e-6) continue;
      const r = Math.sqrt(r2), e = K * c.q / r2;
      Ex += e * dx / r; Ey += e * dy / r; V += K * c.q / r;
    }
    return { Ex, Ey, E: Math.hypot(Ex, Ey), V };
  }

  // Lei de Coulomb entre duas cargas (q em C, r em m). F > 0 = repulsão.
  function coulomb(q1, q2, r) {
    return K * q1 * q2 / (r * r);
  }

  function campoEletrico(p) {
    const cargas = (p.cargas || []).map((c, i) => ({
      q: num(c.q, `carga ${i + 1}`) * 1e-6, x: num(c.x, `x${i + 1}`), y: num(c.y, `y${i + 1}`)
    }));
    if (!cargas.length) throw new Error('Adicione ao menos uma carga.');
    const pt = { x: num(p.px ?? 0, 'ponto x'), y: num(p.py ?? 0, 'ponto y') };
    const r = campoEm(cargas, pt.x, pt.y);
    const out = { E_N_por_C: r.E, Ex: r.Ex, Ey: r.Ey, V_volts: r.V, n_cargas: cargas.length };
    if (cargas.length >= 2) {
      const d = Math.hypot(cargas[0].x - cargas[1].x, cargas[0].y - cargas[1].y);
      out.F12_N = coulomb(cargas[0].q, cargas[1].q, d);
      out.interacao = out.F12_N > 0 ? 'repulsão' : 'atração';
    }
    // força sobre uma carga de prova de 1 nC no ponto (F = qE)
    out.F_prova_1nC_N = 1e-9 * r.E;
    return out;
  }

  // ======================= ELETROSTÁTICA =======================
  // Sensor capacitivo do painel touch: capacitor de placas paralelas.
  // C = ε0·εr·A/d ;  Q = C·V ;  U = ½·C·V² ;  E = V/d
  // O dedo acrescenta uma capacidade em paralelo (C_dedo) → o circuito detecta o aumento.
  function eletrostatica(p) {
    const A = num(p.area_cm2, 'área', { min: 0.01 }) * 1e-4;
    const d = num(p.dist_mm, 'distância', { min: 0.001 }) * 1e-3;
    const er = num(p.er ?? 4.5, 'εr', { min: 1 });
    const V = num(p.tensao, 'tensão', { min: 0 });
    const Cdedo = num(p.c_dedo_pF ?? 5, 'C do dedo', { min: 0 }) * 1e-12;
    const limiar = num(p.limiar_pct ?? 10, 'limiar', { min: 0 });
    const C = EPS0 * er * A / d;
    const Ctoque = C + Cdedo;
    const variacao = (Ctoque - C) / C * 100;
    return {
      C_pF: C * 1e12, C_toque_pF: Ctoque * 1e12, Q_nC: C * V * 1e9, U_nJ: 0.5 * C * V * V * 1e9,
      E_V_por_m: V / d, sigma_uC_m2: (C * V / A) * 1e6, variacao_pct: variacao,
      toque_detectado: variacao >= limiar
    };
  }

  // ======================= MAGNETISMO =======================
  // Relé que liga as lâmpadas/ar: bobina (solenoide) com núcleo de ferro.
  // B = μ0·μr·N·I / L ;  F = B²·A / (2·μ0) (força na armadura) ;  fio reto: B = μ0·I / (2πr)
  // Sensor de porta (ímã + bobina): fem induzida ε = −N·ΔΦ/Δt (Lei de Faraday)
  function magnetismo(p) {
    const N = num(p.espiras, 'espiras', { min: 1 });
    const L = num(p.comprimento_cm, 'comprimento', { min: 0.01 }) * 1e-2;
    const I = num(p.corrente_mA, 'corrente', { min: 0 }) * 1e-3;
    const mur = num(p.mu_r ?? 50, 'μr', { min: 1 });
    const A = num(p.area_nucleo_cm2 ?? 1, 'área do núcleo', { min: 0.001 }) * 1e-4;
    const Fmola = num(p.forca_mola_N ?? 0.3, 'força da mola', { min: 0 });
    const r = num(p.dist_fio_cm ?? 1, 'distância ao fio', { min: 0.01 }) * 1e-2;
    const Ifio = num(p.corrente_fio_A ?? 10, 'corrente no fio', { min: 0 });
    const Bima = num(p.B_ima_mT ?? 40, 'B do ímã', { min: 0 }) * 1e-3;
    const Nsens = num(p.espiras_sensor ?? 200, 'espiras do sensor', { min: 1 });
    const dt = num(p.tempo_abertura_ms ?? 100, 'tempo de abertura', { min: 0.1 }) * 1e-3;
    const Vb = num(p.tensao_bobina_V ?? 5, 'tensão da bobina', { min: 0 });
    const B = MU0 * mur * N * I / L;
    const F = B * B * A / (2 * MU0);
    const fluxo = Bima * A;
    return {
      B_bobina_mT: B * 1e3, F_armadura_N: F, rele_fecha: F > Fmola,
      B_fio_uT: MU0 * Ifio / (2 * Math.PI * r) * 1e6,
      fluxo_ima_uWb: fluxo * 1e6, fem_sensor_mV: Nsens * fluxo / dt * 1e3,
      potencia_bobina_mW: Vb * I * 1e3, resistencia_bobina_ohm: I > 0 ? Vb / I : null
    };
  }

  // ======================= TERMODINÂMICA =======================
  // Balanço de energia do ambiente (1ª lei):  C·dT/dt = UA·(Text − T) + Q_int − Q_ar
  // Termostato = circuito 04 do Logisim: COMPRESSOR = (T_sensor > SET) · PRESENCA,
  // com T_sensor = temperatura inteira lida a cada minuto (sensor de 5 bits).
  // Ar-condicionado como máquina térmica reversa: Qq = Qf + W ;  COP = Qf/W ≤ COP_Carnot = Tf/(Tq − Tf)
  function termodinamica(p) {
    const area = num(p.area_m2, 'área', { min: 1, max: 500 });
    const h = num(p.altura_m ?? 2.7, 'pé-direito', { min: 2, max: 10 });
    const Text = num(p.t_externa, 'temperatura externa', { min: -10, max: 50 });
    const T0 = num(p.t_inicial ?? Text, 'temperatura inicial', { min: -10, max: 50 });
    const SET = Math.round(num(p.setpoint, 'setpoint', { min: 16, max: 30 }));
    const U = num(p.u_parede ?? 2.5, 'U das paredes', { min: 0.1, max: 10 });
    const pessoas = num(p.pessoas ?? 2, 'pessoas', { min: 0, max: 50 });
    const equip = num(p.equipamentos_W ?? 150, 'equipamentos', { min: 0 });
    const btu = num(p.btu, 'capacidade do ar', { min: 0, max: 60000 });
    const cop = num(p.cop ?? 3.2, 'COP', { min: 0.5, max: 10 });
    const horas = num(p.horas ?? 3, 'duração', { min: 0.1, max: 24 });
    const tarifa = num(p.tarifa ?? 0.9, 'tarifa', { min: 0 });
    const presenca = p.presenca === undefined ? true : !!p.presenca && p.presenca !== 'false';
    const inercia = num(p.inercia ?? 5, 'inércia térmica', { min: 1, max: 50 });

    const vol = area * h;
    const envoltoria = 4 * Math.sqrt(area) * h + area; // paredes + teto
    const UA = U * envoltoria;                         // W/K
    const Qint = pessoas * 100 + equip;                // W (cada pessoa ≈ 100 W)
    const Cter = AR.rho * vol * AR.c * inercia;         // J/K (ar × fator de móveis/paredes)
    const Qar = btu * BTU_H;                            // W de calor retirado
    const Wel = Qar / cop;                              // W elétricos

    const carga = UA * (Text - SET) + Qint;            // W necessários em regime permanente
    const btuRecomendado = Math.max(0, carga / BTU_H);

    const dt = 10, passos = Math.round(horas * 3600 / dt);
    let T = T0, ligado = false, energia = 0, tLigado = 0, Tmin = T0, Tmax = T0;
    const serie = [];
    for (let i = 0; i <= passos; i++) {
      if (i % 6 === 0) { // a cada 60 s o "circuito" lê o sensor e decide
        const sensor = Math.max(0, Math.min(31, Math.floor(T)));
        ligado = sensor > SET && presenca;
        serie.push({ min: i * dt / 60, T: +T.toFixed(2), on: ligado ? 1 : 0 });
      }
      const Qfrio = ligado ? Qar : 0;
      T += (UA * (Text - T) + Qint - Qfrio) * dt / Cter;
      if (ligado) { energia += Wel * dt; tLigado += dt; }
      Tmin = Math.min(Tmin, T); Tmax = Math.max(Tmax, T);
    }
    const Tf = SET + 273.15, Tq = Text + 273.15;
    const copCarnot = Tq > Tf ? Tf / (Tq - Tf) : Infinity;
    const kwh = energia / 3.6e6;
    return {
      volume_m3: vol, UA_W_por_K: UA, ganhos_internos_W: Qint, capacidade_termica_kJ_por_K: Cter / 1e3,
      constante_tempo_min: Cter / UA / 60,
      carga_termica_W: carga, btu_recomendado: btuRecomendado,
      Q_frio_W: Qar, W_eletrico_W: Wel, Q_quente_W: Qar + Wel,
      cop, cop_carnot: copCarnot, rendimento_vs_carnot_pct: Number.isFinite(copCarnot) ? cop / copCarnot * 100 : 0,
      calor_para_resfriar_ar_kJ: AR.rho * vol * AR.c * Math.max(0, T0 - SET) / 1e3,
      t_final: T, t_min: Tmin, t_max: Tmax, tempo_ligado_min: tLigado / 60,
      ciclo_trabalho_pct: tLigado / (horas * 3600) * 100,
      energia_kWh: kwh, custo_R$: kwh * tarifa,
      ar_suficiente: Qar >= carga, setpoint: SET, serie
    };
  }

  // ======================= ELETRÔNICA (espelho dos .circ) =======================
  const b = v => (v ? 1 : 0);
  const circuitos = {
    luz_automatica: { arquivo: '01_luz_automatica.circ', entradas: ['PRESENCA', 'ESCURO', 'MANUAL'],
      expr: 'LUZ = (PRESENCA · ESCURO) + MANUAL',
      f: v => ({ LUZ: b((v.PRESENCA && v.ESCURO) || v.MANUAL) }) },
    alarme_seguranca: { arquivo: '02_alarme_seguranca.circ', entradas: ['ARMADO', 'PORTA', 'JANELA', 'MOVIMENTO'],
      expr: 'SIRENE = ARMADO · (PORTA + JANELA + MOVIMENTO);  AVISO_ABERTA = ¬ARMADO · (PORTA + JANELA)',
      f: v => ({ SIRENE: b(v.ARMADO && (v.PORTA || v.JANELA || v.MOVIMENTO)),
                 AVISO_ABERTA: b(!v.ARMADO && (v.PORTA || v.JANELA)) }) },
    alerta_estoque: { arquivo: '03_alerta_estoque.circ', entradas: ['QTD:4', 'MIN:4'],
      expr: 'BAIXO = (QTD < MIN) + (QTD = MIN);  OK = QTD > MIN',
      f: v => ({ BAIXO: b(v.QTD <= v.MIN), OK: b(v.QTD > v.MIN) }) },
    termostato: { arquivo: '04_termostato.circ', entradas: ['T:5', 'SET:5', 'PRESENCA'],
      expr: 'COMPRESSOR = (T > SET) · PRESENCA;  NO_ALVO = (T = SET)',
      f: v => ({ COMPRESSOR: b(v.T > v.SET && v.PRESENCA), NO_ALVO: b(v.T === v.SET) }) },
    status_pedido: { arquivo: '05_status_pedido.circ', entradas: ['S1', 'S0', 'AVANCAR'],
      expr: 'INC = AVANCAR · ¬(S1·S0);  N0 = S0 ⊕ INC;  N1 = S1 ⊕ (S0·INC)',
      f: v => {
        const inc = b(v.AVANCAR && !(v.S1 && v.S0));
        const s = v.S1 * 2 + v.S0;
        return { N1: v.S1 ^ (v.S0 & inc), N0: v.S0 ^ inc,
                 SOLICITADO: b(s === 0), ACEITO: b(s === 1), ANDAMENTO: b(s === 2), CONCLUIDO: b(s === 3) };
      } }
  };
  function eletronica(p) {
    const c = circuitos[p.circuito];
    if (!c) throw new Error('Circuito desconhecido.');
    const v = {};
    for (const e of c.entradas) {
      const [nome, bits = 1] = e.split(':');
      v[nome] = num(p.entradas?.[nome] ?? 0, nome, { min: 0, max: 2 ** bits - 1 }) | 0;
    }
    return { circuito: p.circuito, arquivo: c.arquivo, expressao: c.expr, entradas: v, saidas: c.f(v) };
  }
  function tabelaVerdade(nome) {
    const c = circuitos[nome], specs = c.entradas.map(e => { const [n, bits = 1] = e.split(':'); return [n, +bits]; });
    const total = specs.reduce((t, [, bits]) => t * 2 ** bits, 1), linhas = [];
    for (let i = 0; i < total && i < 64; i++) {
      let r = i; const v = {};
      for (let k = specs.length - 1; k >= 0; k--) { const m = 2 ** specs[k][1]; v[specs[k][0]] = r % m; r = Math.floor(r / m); }
      linhas.push({ ...v, ...c.f(v) });
    }
    return { linhas, total };
  }

  const AREAS = { campo_eletrico: campoEletrico, eletrostatica, magnetismo, termodinamica, eletronica };
  function calcular(area, p) {
    const f = AREAS[area];
    if (!f) throw new Error('Área de física inválida.');
    return f(p || {});
  }

  return { K, EPS0, MU0, BTU_H, campoEm, coulomb, calcular, circuitos, tabelaVerdade, AREAS: Object.keys(AREAS) };
});
