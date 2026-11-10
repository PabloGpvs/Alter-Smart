/* Alter Smart — aba Laboratório (Física + Eletrônica).
 * Usa o núcleo window.Fisica (fisica.js) e os helpers globais do script.js: $, $$, api, run, toast, esc, D, refresh, FLUXO. */
(() => {
  const F = window.Fisica;
  const COR = { verde: '#00ff66', rosa: '#ff007f', ciano: '#00f0ff', amarelo: '#ffd400', muted: '#5f8f78', texto: '#c9ffe0' };
  const MONO = '13px "Share Tech Mono", monospace';

  // ---------- formatação ----------
  const fmt = n => {
    if (n === null || n === undefined) return '—';
    if (typeof n === 'boolean') return n ? 'SIM' : 'NÃO';
    if (!Number.isFinite(n)) return '∞';
    const a = Math.abs(n);
    if (a !== 0 && (a < 1e-2 || a >= 1e6)) return n.toExponential(2).replace('e', '×10^').replace('+', '');
    return n.toLocaleString('pt-BR', { maximumFractionDigits: a < 10 ? 3 : a < 1000 ? 1 : 0 });
  };
  const ROTULO = {
    E_N_por_C: ['|E| no ponto', 'N/C'], Ex: ['Eₓ', 'N/C'], Ey: ['E_y', 'N/C'], V_volts: ['Potencial V', 'V'],
    n_cargas: ['Cargas', ''], F12_N: ['Força Coulomb q1↔q2', 'N'], interacao: ['Interação', ''], F_prova_1nC_N: ['Força numa carga de prova de 1 nC', 'N'],
    C_pF: ['Capacitância C = ε₀εᵣA/d', 'pF'], C_toque_pF: ['C com o dedo', 'pF'], Q_nC: ['Carga Q = C·V', 'nC'], U_nJ: ['Energia U = ½CV²', 'nJ'],
    E_V_por_m: ['Campo entre placas E = V/d', 'V/m'], sigma_uC_m2: ['Densidade σ = Q/A', 'µC/m²'], variacao_pct: ['Variação de C no toque', '%'], toque_detectado: ['Toque detectado', ''],
    B_bobina_mT: ['B na bobina = μ₀μᵣNI/L', 'mT'], F_armadura_N: ['Força na armadura = B²A/2μ₀', 'N'], rele_fecha: ['Relé fecha (F > mola)', ''],
    B_fio_uT: ['B do fio da tomada = μ₀I/2πr', 'µT'], fluxo_ima_uWb: ['Fluxo do ímã Φ = B·A', 'µWb'], fem_sensor_mV: ['fem no sensor ε = NΔΦ/Δt', 'mV'],
    potencia_bobina_mW: ['Potência da bobina P = V·I', 'mW'], resistencia_bobina_ohm: ['Resistência da bobina R = V/I', 'Ω'],
    volume_m3: ['Volume de ar', 'm³'], UA_W_por_K: ['Condutância das paredes UA', 'W/K'], ganhos_internos_W: ['Ganhos internos (pessoas+equip.)', 'W'],
    capacidade_termica_kJ_por_K: ['Capacidade térmica C', 'kJ/K'], constante_tempo_min: ['Constante de tempo τ = C/UA', 'min'],
    carga_termica_W: ['Carga térmica no setpoint', 'W'], btu_recomendado: ['Capacidade mínima recomendada', 'BTU/h'],
    Q_frio_W: ['Calor retirado Q_f', 'W'], W_eletrico_W: ['Trabalho elétrico W = Q_f/COP', 'W'], Q_quente_W: ['Calor rejeitado fora Q_q = Q_f+W', 'W'],
    cop: ['COP real', ''], cop_carnot: ['COP de Carnot T_f/(T_q−T_f)', ''], rendimento_vs_carnot_pct: ['COP real / COP Carnot', '%'],
    calor_para_resfriar_ar_kJ: ['Calor sensível só do ar Q = m·c·ΔT', 'kJ'], t_final: ['Temperatura final', '°C'], t_min: ['T mínima', '°C'], t_max: ['T máxima', '°C'],
    tempo_ligado_min: ['Compressor ligado', 'min'], ciclo_trabalho_pct: ['Ciclo de trabalho', '%'], energia_kWh: ['Energia elétrica', 'kWh'],
    'custo_R$': ['Custo', 'R$'], ar_suficiente: ['Aparelho dá conta da carga', ''], setpoint: ['Setpoint', '°C']
  };
  function mostrar(alvo, r, chaves) {
    $(alvo).innerHTML = (chaves || Object.keys(r)).filter(k => k in r && k !== 'serie' && ROTULO[k]).map(k => {
      const [l, u] = ROTULO[k], v = r[k];
      const cls = typeof v === 'boolean' ? (v ? 'sim' : 'nao') : '';
      return `<div class="${cls}"><dt>${l}</dt><dd>${typeof v === 'string' ? esc(v) : fmt(v)} <small>${u}</small></dd></div>`;
    }).join('');
  }

  // ---------- sub-abas ----------
  let atual = 'campo';
  $$('#labnav button').forEach(b => b.onclick = () => abrirLab(b.dataset.lab));
  function abrirLab(nome) {
    atual = nome;
    $$('#labnav button').forEach(x => x.classList.toggle('on', x.dataset.lab === nome));
    $$('.lab').forEach(d => d.hidden = d.id !== 'lab-' + nome);
    DESENHAR[nome] && DESENHAR[nome]();
    if (nome === 'eletronica') carregarCasa();
  }

  // ---------- selects ligados aos dados da casa ----------
  function preencherSelects() {
    if (!D.dispositivos) return;
    $$('#tab-lab select[data-tipo]').forEach(sel => {
      const cur = sel.value;
      const lista = D.dispositivos.filter(d => d.tipo === sel.dataset.tipo);
      sel.innerHTML = '<option value="">—</option>' + lista.map(d => `<option value="${d.id}">${esc(d.nome)} @ ${esc(d.ambiente || '—')} (${esc(d.estado)})</option>`).join('');
      if (cur) sel.value = cur;
    });
    for (const sel of [$('#mg-disp')]) {
      const cur = sel.value;
      sel.innerHTML = '<option value="">—</option>' + D.dispositivos.map(d => `<option value="${d.id}">${esc(d.nome)} [${esc(d.tipo)}] (${esc(d.estado)})</option>`).join('');
      if (cur) sel.value = cur;
    }
    const amb = $('#td-amb'), cur = amb.value;
    amb.innerHTML = '<option value="">—</option>' + D.ambientes.map(a => `<option value="${a.id}">${esc(a.nome)}</option>`).join('');
    if (cur) amb.value = cur;
  }
  const setEstado = (id, estado) => api('/dispositivos/' + id, 'PUT', { estado });

  // ---------- leitura de formulários ----------
  function lerForm(area) {
    const f = $(`form[data-area="${area}"]`), p = {};
    for (const el of f.elements) {
      if (!el.name) continue;
      p[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    }
    return p;
  }
  const canvasCtx = id => { const c = $(id); return [c, c.getContext('2d')]; };
  function fundo(ctx, c, passo = 50) {
    ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(0,255,102,.07)'; ctx.lineWidth = 1;
    for (let x = 0; x <= c.width; x += passo) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, c.height); ctx.stroke(); }
    for (let y = 0; y <= c.height; y += passo) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(c.width, y + .5); ctx.stroke(); }
  }
  function seta(ctx, x1, y1, x2, y2, cor, tam = 6) {
    ctx.strokeStyle = ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - tam * Math.cos(a - .45), y2 - tam * Math.sin(a - .45));
    ctx.lineTo(x2 - tam * Math.cos(a + .45), y2 - tam * Math.sin(a + .45)); ctx.fill();
  }

  // =================== CAMPO ELÉTRICO ===================
  const ESC = 100; // px por metro
  let cargas = [{ q: 2, x: 3, y: 2.1 }, { q: -2, x: 5.4, y: 2.1 }];
  let sonda = { x: 4.2, y: 1.2 };
  const PRESETS = {
    dipolo: () => [{ q: 2, x: 3, y: 2.1 }, { q: -2, x: 5.4, y: 2.1 }],
    iguais: () => [{ q: 2, x: 3, y: 2.1 }, { q: 2, x: 5.4, y: 2.1 }],
    placas: () => [...Array(7)].flatMap((_, i) => [{ q: 1, x: 2.4 + i * 0.6, y: 1.2 }, { q: -1, x: 2.4 + i * 0.6, y: 3 }]),
    limpar: () => []
  };
  $$('[data-preset]').forEach(b => b.onclick = () => { cargas = PRESETS[b.dataset.preset](); calcCampo(); });
  const cvC = $('#cv-campo');
  const posM = e => { const r = cvC.getBoundingClientRect(); return { x: (e.clientX - r.left) * cvC.width / r.width / ESC, y: (e.clientY - r.top) * cvC.height / r.height / ESC }; };
  cvC.addEventListener('click', e => {
    const p = posM(e);
    if (e.shiftKey) {
      if (!cargas.length) return;
      let k = 0; cargas.forEach((c, i) => { if (Math.hypot(c.x - p.x, c.y - p.y) < Math.hypot(cargas[k].x - p.x, cargas[k].y - p.y)) k = i; });
      cargas.splice(k, 1);
    } else {
      const q = Number($('#ce-q').value) || 1;
      cargas.push({ q, x: +p.x.toFixed(2), y: +p.y.toFixed(2) });
    }
    calcCampo();
  });
  cvC.addEventListener('contextmenu', e => { e.preventDefault(); const p = posM(e); sonda = { x: +p.x.toFixed(2), y: +p.y.toFixed(2) }; calcCampo(); });
  cvC.addEventListener('mousemove', e => {
    const p = posM(e), f = F.campoEm(cargas.map(c => ({ ...c, q: c.q * 1e-6 })), p.x, p.y);
    const ang = Math.atan2(-f.Ey, f.Ex) * 180 / Math.PI;
    $('#ce-hover').textContent = `> (${p.x.toFixed(2)} m, ${p.y.toFixed(2)} m)   |E| = ${fmt(f.E)} N/C   ângulo = ${ang.toFixed(0)}°   V = ${fmt(f.V)} V`;
  });
  ['#ce-linhas', '#ce-equi'].forEach(s => $(s).onchange = () => desenharCampo());

  function calcCampo() {
    try {
      const r = F.calcular('campo_eletrico', { cargas, px: sonda.x, py: sonda.y });
      mostrar('#res-campo', r);
    } catch (e) { $('#res-campo').innerHTML = `<div class="muted">&gt; ${esc(e.message)}</div>`; }
    desenharCampo();
  }
  function desenharCampo() {
    const [c, ctx] = canvasCtx('#cv-campo');
    fundo(ctx, c);
    const qs = cargas.map(k => ({ ...k, q: k.q * 1e-6 }));
    if (qs.length) {
      // equipotenciais (mudança de nível entre pixels vizinhos)
      if ($('#ce-equi').checked) {
        const passo = 4, nivel = v => Math.floor(Math.sign(v) * Math.log10(1 + Math.abs(v)) * 4);
        ctx.fillStyle = 'rgba(255,212,0,.55)';
        for (let x = 0; x < c.width; x += passo) for (let y = 0; y < c.height; y += passo) {
          const a = nivel(F.campoEm(qs, x / ESC, y / ESC).V), b = nivel(F.campoEm(qs, (x + passo) / ESC, y / ESC).V), d = nivel(F.campoEm(qs, x / ESC, (y + passo) / ESC).V);
          if (a !== b || a !== d) ctx.fillRect(x, y, 1.5, 1.5);
        }
      }
      // vetores do campo
      ctx.lineWidth = 1;
      for (let x = 15; x < c.width; x += 30) for (let y = 15; y < c.height; y += 30) {
        const f = F.campoEm(qs, x / ESC, y / ESC); if (!f.E) continue;
        const L = 11, ux = f.Ex / f.E * L, uy = f.Ey / f.E * L, a = Math.min(1, Math.log10(1 + f.E) / 5);
        seta(ctx, x - ux / 2, y - uy / 2, x + ux / 2, y + uy / 2, `rgba(0,240,255,${0.15 + a * 0.6})`, 4);
      }
      // linhas de campo: saem das cargas positivas (ou entram nas negativas se não houver positivas)
      if ($('#ce-linhas').checked) {
        const fontes = qs.filter(k => k.q > 0).length ? qs.filter(k => k.q > 0) : qs.filter(k => k.q < 0);
        ctx.strokeStyle = 'rgba(0,255,102,.55)'; ctx.lineWidth = 1.2;
        for (const s of fontes) {
          const n = Math.min(24, Math.max(8, Math.round(Math.abs(s.q) * 1e6 * 8))), sentido = Math.sign(s.q);
          for (let i = 0; i < n; i++) {
            let x = s.x + 0.12 * Math.cos(2 * Math.PI * i / n), y = s.y + 0.12 * Math.sin(2 * Math.PI * i / n);
            ctx.beginPath(); ctx.moveTo(x * ESC, y * ESC);
            for (let k = 0; k < 900; k++) {
              const f = F.campoEm(qs, x, y); if (!f.E) break;
              x += sentido * f.Ex / f.E * 0.02; y += sentido * f.Ey / f.E * 0.02;
              ctx.lineTo(x * ESC, y * ESC);
              if (x < 0 || y < 0 || x > c.width / ESC || y > c.height / ESC) break;
              if (qs.some(o => Math.sign(o.q) !== sentido && Math.hypot(o.x - x, o.y - y) < 0.1)) break;
            }
            ctx.stroke();
          }
        }
      }
    }
    // cargas
    for (const k of cargas) {
      const cor = k.q > 0 ? COR.rosa : COR.ciano;
      ctx.fillStyle = '#000'; ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.shadowColor = cor; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(k.x * ESC, k.y * ESC, 12, 0, 7); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = cor; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(k.q > 0 ? '+' : '−', k.x * ESC, k.y * ESC + 1);
      ctx.font = MONO; ctx.fillText(`${k.q} µC`, k.x * ESC, k.y * ESC + 24);
    }
    // ponto de medição
    ctx.strokeStyle = COR.amarelo; ctx.lineWidth = 1.5;
    const sx = sonda.x * ESC, sy = sonda.y * ESC;
    ctx.beginPath(); ctx.moveTo(sx - 9, sy); ctx.lineTo(sx + 9, sy); ctx.moveTo(sx, sy - 9); ctx.lineTo(sx, sy + 9); ctx.stroke();
    if (qs.length) {
      const f = F.campoEm(qs, sonda.x, sonda.y);
      if (f.E) seta(ctx, sx, sy, sx + f.Ex / f.E * 40, sy + f.Ey / f.E * 40, COR.amarelo, 8);
    }
    ctx.textAlign = 'left'; ctx.fillStyle = COR.muted; ctx.font = MONO; ctx.fillText('0,5 m', 8, c.height - 8);
  }

  // =================== ELETROSTÁTICA ===================
  let tocando = false;
  function calcEletro() {
    let r; try { r = F.calcular('eletrostatica', lerForm('eletrostatica')); } catch (e) { $('#res-eletrostatica').innerHTML = `<div class="muted">&gt; ${esc(e.message)}</div>`; return; }
    mostrar('#res-eletrostatica', r);
    desenharEletro(r);
    return r;
  }
  function desenharEletro(r) {
    const [c, ctx] = canvasCtx('#cv-eletro');
    fundo(ctx, c, 40);
    const x0 = 220, x1 = 620, yTop = 110, yBot = 190;
    // vidro (dielétrico)
    ctx.fillStyle = 'rgba(0,240,255,.08)'; ctx.fillRect(x0, yTop, x1 - x0, yBot - yTop);
    // placas
    ctx.fillStyle = COR.rosa; ctx.shadowColor = COR.rosa; ctx.shadowBlur = 10; ctx.fillRect(x0, yTop - 6, x1 - x0, 6);
    ctx.fillStyle = COR.ciano; ctx.shadowColor = COR.ciano; ctx.fillRect(x0, yBot, x1 - x0, 6); ctx.shadowBlur = 0;
    // linhas de campo (densidade ∝ σ)
    const n = Math.max(4, Math.min(28, Math.round(Math.log10(1 + (r?.sigma_uC_m2 || 0) * 1000) * 7)));
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) { const x = x0 + (i + .5) * (x1 - x0) / n; seta(ctx, x, yTop + 4, x, yBot - 4, 'rgba(0,255,102,.7)', 5); }
    ctx.font = MONO; ctx.fillStyle = COR.texto; ctx.textAlign = 'left';
    ctx.fillText('+Q  eletrodo (sob o vidro)', x1 + 16, yTop - 2);
    ctx.fillText('−Q  terra', x1 + 16, yBot + 8);
    ctx.fillText('vidro εr', x1 + 16, (yTop + yBot) / 2 + 4);
    ctx.fillText(`E = V/d = ${fmt(r?.E_V_por_m)} V/m`, 16, 30);
    ctx.fillText(`C = ${fmt(r?.C_pF)} pF`, 16, 50);
    // dedo
    const yDedo = tocando ? yTop - 52 : 8;
    ctx.fillStyle = tocando ? 'rgba(255,212,0,.25)' : 'rgba(95,143,120,.2)';
    ctx.strokeStyle = tocando ? COR.amarelo : COR.muted; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(400, yDedo, 44, 44, [20, 20, 6, 6]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = tocando ? COR.amarelo : COR.muted; ctx.textAlign = 'center';
    ctx.fillText(tocando ? `+${fmt(r?.C_toque_pF - r?.C_pF)} pF` : 'dedo', 422, yDedo + 27);
    if (tocando) {
      ctx.fillStyle = r?.toque_detectado ? COR.verde : COR.rosa;
      ctx.fillText(r?.toque_detectado ? '▶ TOQUE DETECTADO' : '✖ variação abaixo do limiar', 422, yBot + 46);
    }
  }
  $('#es-tocar').onclick = run(async () => {
    tocando = true; const r = calcEletro();
    setTimeout(() => { tocando = false; calcEletro(); }, 1600);
    if (!r?.toque_detectado) return toast('Variação de capacitância abaixo do limiar: nada acontece.', true);
    const id = $('#es-disp').value;
    if (!id) return toast('Toque detectado! Escolha uma luz para o painel controlar.');
    const d = D.dispositivos.find(x => x.id == id), novo = d.estado === 'ligado' ? 'desligado' : 'ligado';
    await setEstado(id, novo); toast(`Toque detectado → ${d.nome}: ${novo}`); refresh();
  });

  // =================== MAGNETISMO ===================
  let energizado = false;
  function calcMag() {
    let r; try { r = F.calcular('magnetismo', lerForm('magnetismo')); } catch (e) { $('#res-magnetismo').innerHTML = `<div class="muted">&gt; ${esc(e.message)}</div>`; return; }
    mostrar('#res-magnetismo', r); desenharMag(r); return r;
  }
  function desenharMag(r) {
    const [c, ctx] = canvasCtx('#cv-mag');
    fundo(ctx, c, 30);
    const ativo = energizado && r;
    // --- relé: núcleo + bobina + armadura
    const cx = 120, cy = 150;
    ctx.fillStyle = '#333a40'; ctx.fillRect(cx, cy - 22, 160, 44); // núcleo
    ctx.strokeStyle = ativo ? COR.amarelo : '#8a6d1a'; ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.ellipse(cx + 12 + i * 12.5, cy, 6, 30, 0, 0, 7); ctx.stroke(); }
    // linhas de campo (laços fechados passando pelo núcleo)
    if (ativo) {
      ctx.lineWidth = 1.2;
      // dentro do núcleo B aponta para a direita (polo N à direita); por fora, por cima e por baixo, as linhas voltam do N para o S
      for (let k = 1; k <= 3; k++) {
        ctx.strokeStyle = `rgba(0,240,255,${0.8 - k * 0.18})`;
        ctx.beginPath(); ctx.ellipse(cx + 80, cy, 80 + k * 18, 30 + k * 18, 0, 0, 7); ctx.stroke();
        seta(ctx, cx + 86, cy - 30 - k * 18, cx + 74, cy - 30 - k * 18, COR.ciano, 6);
        seta(ctx, cx + 86, cy + 30 + k * 18, cx + 74, cy + 30 + k * 18, COR.ciano, 6);
      }
      ctx.lineWidth = 2; seta(ctx, cx + 60, cy, cx + 110, cy, COR.ciano, 8);
    }
    const fecha = ativo && r.rele_fecha;
    const ax = cx + 172 + (fecha ? 0 : 16);
    ctx.fillStyle = '#9aa'; ctx.save(); ctx.translate(ax, cy + 40); ctx.rotate(fecha ? 0 : 0.18); ctx.fillRect(0, -70, 10, 80); ctx.restore();
    ctx.fillStyle = fecha ? COR.verde : COR.rosa; ctx.beginPath(); ctx.arc(cx + 200, cy - 50, 6, 0, 7); ctx.fill();
    ctx.font = MONO; ctx.fillStyle = COR.texto; ctx.textAlign = 'left';
    ctx.fillText('RELÉ', cx, 26);
    ctx.fillText(`B = ${fmt(r?.B_bobina_mT)} mT   F = ${fmt(r?.F_armadura_N)} N`, cx, 46);
    ctx.fillStyle = fecha ? COR.verde : COR.rosa;
    ctx.fillText(!energizado ? 'bobina desligada' : fecha ? '▶ contato FECHADO' : '✖ força < mola: contato aberto', cx, 280);
    // --- fio reto (corte transversal): corrente saindo da tela
    const wx = 640, wy = 150;
    for (let k = 1; k <= 5; k++) {
      ctx.strokeStyle = `rgba(255,0,127,${0.85 - k * 0.14})`; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(wx, wy, k * 22, 0, 7); ctx.stroke();
      seta(ctx, wx + 4, wy - k * 22, wx - 6, wy - k * 22, COR.rosa, 6); // sentido anti-horário (regra da mão direita)
    }
    ctx.fillStyle = '#000'; ctx.strokeStyle = COR.amarelo; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx, wy, 9, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COR.amarelo; ctx.beginPath(); ctx.arc(wx, wy, 2.5, 0, 7); ctx.fill();
    ctx.fillStyle = COR.texto; ctx.textAlign = 'center';
    ctx.fillText('FIO DA TOMADA (I saindo da tela ⊙)', wx, 26);
    ctx.fillText(`B(r) = μ₀I/2πr = ${fmt(r?.B_fio_uT)} µT`, wx, 280);
  }
  $('#mg-acionar').onclick = run(async () => {
    energizado = !energizado; $('#mg-acionar').textContent = energizado ? '⏻ Desenergizar bobina' : '⚡ Energizar bobina';
    const r = calcMag(), id = $('#mg-disp').value;
    if (!r || !id) return;
    if (energizado && !r.rele_fecha) return toast('A força magnética não vence a mola: o dispositivo não liga.', true);
    const d = D.dispositivos.find(x => x.id == id);
    await setEstado(id, energizado ? 'ligado' : 'desligado'); toast(`Relé → ${d.nome}: ${energizado ? 'ligado' : 'desligado'}`); refresh();
  });

  // =================== TERMODINÂMICA ===================
  let ultimoTermo = null;
  function calcTermo() {
    let r; try { r = F.calcular('termodinamica', lerForm('termodinamica')); } catch (e) { $('#res-termodinamica').innerHTML = `<div class="muted">&gt; ${esc(e.message)}</div>`; return; }
    ultimoTermo = r; mostrar('#res-termodinamica', r); desenharTermo(r); return r;
  }
  function desenharTermo(r) {
    const [c, ctx] = canvasCtx('#cv-termo');
    fundo(ctx, c, 30);
    const p = lerForm('termodinamica'), s = r.serie;
    const m = { l: 50, r: 20, t: 20, b: 40 }, W = c.width - m.l - m.r, H = c.height - m.t - m.b;
    const tMax = s[s.length - 1].min || 1;
    const vals = s.map(k => k.T).concat([+p.t_externa, r.setpoint]);
    const yMin = Math.floor(Math.min(...vals) - 1), yMax = Math.ceil(Math.max(...vals) + 1);
    const X = t => m.l + t / tMax * W, Y = v => m.t + (yMax - v) / (yMax - yMin) * H;
    // faixas com compressor ligado
    ctx.fillStyle = 'rgba(0,240,255,.12)';
    s.forEach((k, i) => { if (k.on && s[i + 1]) ctx.fillRect(X(k.min), m.t, X(s[i + 1].min) - X(k.min) + .5, H); });
    // eixos
    ctx.strokeStyle = COR.muted; ctx.lineWidth = 1; ctx.font = MONO; ctx.fillStyle = COR.muted; ctx.textAlign = 'right';
    for (let v = yMin; v <= yMax; v += Math.max(1, Math.round((yMax - yMin) / 6))) { ctx.fillText(v + '°', m.l - 6, Y(v) + 4); ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(m.l + 4, Y(v)); ctx.stroke(); }
    ctx.textAlign = 'center';
    for (let t = 0; t <= tMax; t += tMax > 240 ? 60 : 30) ctx.fillText(t + ' min', X(t), c.height - 14);
    ctx.beginPath(); ctx.moveTo(m.l, m.t); ctx.lineTo(m.l, m.t + H); ctx.lineTo(m.l + W, m.t + H); ctx.stroke();
    // referências
    const linha = (v, cor, txt) => { ctx.setLineDash([6, 5]); ctx.strokeStyle = cor; ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(m.l + W, Y(v)); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = cor; ctx.textAlign = 'right'; ctx.fillText(txt, m.l + W - 4, Y(v) - 5); };
    linha(+p.t_externa, COR.rosa, `externa ${p.t_externa}°C`);
    linha(r.setpoint, COR.amarelo, `SET ${r.setpoint}°C`);
    // curva T(t)
    ctx.strokeStyle = COR.verde; ctx.lineWidth = 2; ctx.shadowColor = COR.verde; ctx.shadowBlur = 6;
    ctx.beginPath(); s.forEach((k, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, X(k.min), Y(k.T))); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = COR.ciano; ctx.textAlign = 'left'; ctx.fillText('■ compressor ligado (circuito 04: T > SET · PRESENCA)', m.l + 8, m.t + 14);
  }
  $('#td-aplicar').onclick = run(async () => {
    const id = $('#td-disp').value, p = lerForm('termodinamica');
    if (!id) return toast('Escolha um dispositivo do tipo ar-condicionado (cadastre em Automação).', true);
    const r = await api(`/dispositivos/${id}/termostato`, 'POST', { temperatura: Math.floor(p.t_inicial), setpoint: Math.round(p.setpoint), presenca: p.presenca });
    toast(`Termostato: ${r.estado} (COMPRESSOR=${r.saidas.COMPRESSOR})`); refresh();
  });

  // ---------- formulários recalculam ao digitar ----------
  const CALC = { eletrostatica: calcEletro, magnetismo: calcMag, termodinamica: calcTermo };
  $$('form.lab-form').forEach(f => {
    f.addEventListener('input', () => CALC[f.dataset.area]());
    f.addEventListener('submit', e => e.preventDefault());
  });
  const DESENHAR = { campo: calcCampo, eletrostatica: calcEletro, magnetismo: calcMag, termodinamica: calcTermo, eletronica: () => {} };

  // =================== ELETRÔNICA ===================
  const estadoCirc = {};
  const ACAO_CASA = {
    luz_automatica: { tipo: 'luz', rot: 'Aplicar na luz', estado: s => (s.LUZ ? 'ligado' : 'desligado') },
    alarme_seguranca: { tipo: 'seguranca', rot: 'Aplicar no alarme', estado: (s, v) => (s.SIRENE ? 'DISPARADO' : v.ARMADO ? 'armado' : 'desarmado') },
    termostato: { tipo: 'ar-condicionado', rot: 'Aplicar no ar', termostato: true }
  };
  function montarCircuitos() {
    $('#el-circuitos').innerHTML = Object.entries(F.circuitos).map(([nome, c], i) => {
      estadoCirc[nome] = estadoCirc[nome] || Object.fromEntries(c.entradas.map(e => [e.split(':')[0], 0]));
      const ins = c.entradas.map(e => {
        const [n, bits = 1] = e.split(':');
        return +bits === 1
          ? `<button type="button" class="bit" data-c="${nome}" data-in="${n}">${n} <b>0</b></button>`
          : `<label class="inl">${n} (${bits} bits)<input type="number" min="0" max="${2 ** bits - 1}" value="0" data-c="${nome}" data-in="${n}" data-bits="${bits}"><code data-bin="${nome}-${n}"></code></label>`;
      }).join('');
      const a = ACAO_CASA[nome];
      return `<article class="card circ" style="--c:var(--${['yellow', 'pink', 'pink', 'cyan', 'green'][i]})">
        <h3>${String(i + 1).padStart(2, '0')} · ${esc(nome.replace(/_/g, ' '))}</h3>
        <code class="expr">${esc(c.expr)}</code>
        <div class="ins">${ins}</div>
        <div class="outs" id="out-${nome}"></div>
        <details><summary>Tabela-verdade</summary><div class="tv" id="tv-${nome}"></div></details>
        <div class="acts">
          <a class="btn sm" href="/logisim/${c.arquivo}" download>⬇ ${c.arquivo}</a>
          ${a ? `<select data-acao="${nome}"></select><button class="btn cyan sm" data-aplicar="${nome}">${a.rot}</button>` : ''}
          <button class="btn pink sm" data-salvar-circ="${nome}">Salvar</button>
        </div></article>`;
    }).join('');
    $$('#el-circuitos .bit').forEach(b => b.onclick = () => { const s = estadoCirc[b.dataset.c]; s[b.dataset.in] ^= 1; atualizarCirc(b.dataset.c); });
    $$('#el-circuitos input[data-c]').forEach(inp => inp.oninput = () => {
      const max = 2 ** inp.dataset.bits - 1; let v = Math.max(0, Math.min(max, parseInt(inp.value, 10) || 0));
      estadoCirc[inp.dataset.c][inp.dataset.in] = v; atualizarCirc(inp.dataset.c);
    });
    $$('[data-aplicar]').forEach(b => b.onclick = run(async () => {
      const nome = b.dataset.aplicar, a = ACAO_CASA[nome], id = $(`select[data-acao="${nome}"]`).value, v = estadoCirc[nome];
      if (!id) return toast(`Escolha um dispositivo do tipo "${a.tipo}" (cadastre em Automação).`, true);
      if (a.termostato) {
        const r = await api(`/dispositivos/${id}/termostato`, 'POST', { temperatura: v.T, setpoint: v.SET, presenca: !!v.PRESENCA });
        toast('Termostato → ' + r.estado);
      } else {
        const r = F.calcular('eletronica', { circuito: nome, entradas: v }), est = a.estado(r.saidas, v);
        await setEstado(id, est); toast('Dispositivo → ' + est);
      }
      refresh();
    }));
    $$('[data-salvar-circ]').forEach(b => b.onclick = run(async () => {
      const nome = b.dataset.salvarCirc;
      await api('/fisica/eletronica', 'POST', { titulo: 'Circuito ' + nome.replace(/_/g, ' '), parametros: { circuito: nome, entradas: estadoCirc[nome] } });
      toast('Experimento de eletrônica salvo.'); refresh();
    }));
    Object.keys(F.circuitos).forEach(n => { atualizarCirc(n); tabela(n); });
  }
  function atualizarCirc(nome) {
    const v = estadoCirc[nome], r = F.calcular('eletronica', { circuito: nome, entradas: v });
    $$(`#el-circuitos [data-c="${nome}"]`).forEach(el => {
      const val = v[el.dataset.in];
      if (el.classList.contains('bit')) { el.classList.toggle('on', !!val); el.querySelector('b').textContent = val; }
      else { if (+el.value !== val) el.value = val; $(`[data-bin="${nome}-${el.dataset.in}"]`).textContent = val.toString(2).padStart(+el.dataset.bits, '0') + 'b'; }
    });
    $('#out-' + nome).innerHTML = Object.entries(r.saidas).map(([k, s]) => `<span class="led ${s ? 'on' : ''}"><i></i>${k}</span>`).join('');
  }
  function tabela(nome) {
    const { linhas, total } = F.tabelaVerdade(nome), cols = Object.keys(linhas[0]);
    $('#tv-' + nome).innerHTML = `<table><tr>${cols.map(k => `<th>${k}</th>`).join('')}</tr>${linhas.map(l => `<tr>${cols.map(k => `<td>${l[k]}</td>`).join('')}</tr>`).join('')}</table>`
      + (total > linhas.length ? `<div class="muted">… ${total} combinações no total (o Logisim mostra todas em Projeto → Analisar circuito).</div>` : '');
  }
  function preencherAcoes() {
    $$('select[data-acao]').forEach(sel => {
      const cur = sel.value, tipo = ACAO_CASA[sel.dataset.acao].tipo;
      sel.innerHTML = '<option value="">— dispositivo —</option>' + (D.dispositivos || []).filter(d => d.tipo === tipo).map(d => `<option value="${d.id}">${esc(d.nome)} (${esc(d.estado)})</option>`).join('');
      if (cur) sel.value = cur;
    });
  }
  const bin = (n, b) => n.toString(2).padStart(b, '0');
  const carregarCasa = run(async () => {
    const r = await api('/eletronica/casa');
    const prods = r.produtos.map(p => `<article class="card ${p.BAIXO ? 'low' : ''}"><h3>${esc(p.nome)}</h3>
      <div>QTD = ${p.quantidade} → <code>${bin(Math.min(15, p.quantidade), 4)}b</code> · MIN = ${p.quantidade_minima} → <code>${bin(Math.min(15, p.quantidade_minima), 4)}b</code></div>
      <div class="outs"><span class="led ${p.BAIXO ? 'on' : ''}" style="--c:var(--pink)"><i></i>BAIXO</span><span class="led ${p.OK ? 'on' : ''}"><i></i>OK</span></div>
      ${p.cabe_em_4_bits ? '' : '<div class="muted">⚠ passa de 15: no Logisim aumente a largura dos pinos para 8 bits.</div>'}
      <small class="muted">Circuito 03 · igual ao SQL quantidade &lt;= quantidade_minima</small></article>`).join('');
    const peds = r.pedidos.map(p => {
      const s = F.calcular('eletronica', { circuito: 'status_pedido', entradas: { S1: p.S1, S0: p.S0, AVANCAR: 1 } }).saidas;
      const prox = s.N1 * 2 + s.N0;
      return `<article class="card s-${p.status.replace(' ', '-')}"><h3>#${p.id} ${esc(p.titulo)}</h3>
        <div>Status: ${esc(p.status)} → S1S0 = <code>${p.S1}${p.S0}</code></div>
        <div>Com AVANCAR=1: N1N0 = <code>${s.N1}${s.N0}</code> (${FLUXO[prox]})</div>
        <div class="acts">${prox !== p.S1 * 2 + p.S0 ? `<button class="btn sm" onclick="avancarCircuito(${p.id},'${FLUXO[prox]}')">▶ Avançar pelo circuito</button>` : '<span class="muted">estado final (o circuito satura em 11)</span>'}</div></article>`;
    }).join('');
    $('#el-casa').innerHTML = (prods + peds) || '<div class="empty">&gt; Cadastre produtos em Estoque e pedidos em Pedidos para ver os circuitos com dados reais.</div>';
  });
  window.avancarCircuito = run(async (id, status) => { await api('/pedidos/' + id, 'PUT', { status }); toast(`Pedido #${id} → ${status} (via circuito 05)`); refresh(); carregarCasa(); });

  // =================== SALVAR / REABRIR EXPERIMENTOS ===================
  const SALVAR = {
    campo_eletrico: () => ({ titulo: $('#ce-titulo').value, parametros: { cargas, px: sonda.x, py: sonda.y } }),
    eletrostatica: () => ({ titulo: $('#es-titulo').value, parametros: lerForm('eletrostatica'), dispositivo_id: $('#es-disp').value || null }),
    magnetismo: () => ({ titulo: $('#mg-titulo').value, parametros: lerForm('magnetismo'), dispositivo_id: $('#mg-disp').value || null }),
    termodinamica: () => {
      const p = lerForm('termodinamica'), { ambiente_id, dispositivo_id } = p;
      delete p.ambiente_id; delete p.dispositivo_id;
      return { titulo: $('#td-titulo').value, parametros: p, ambiente_id: ambiente_id || null, dispositivo_id: dispositivo_id || null };
    }
  };
  $$('[data-salvar]').forEach(b => b.onclick = run(async () => {
    const area = b.dataset.salvar, corpo = SALVAR[area]();
    await api('/fisica/' + area, 'POST', corpo); toast('Experimento salvo no banco.'); refresh();
  }));

  const ABA_DA_AREA = { campo_eletrico: 'campo', eletrostatica: 'eletrostatica', magnetismo: 'magnetismo', termodinamica: 'termodinamica', eletronica: 'eletronica' };
  window.abrirExp = id => {
    const e = D.experimentos.find(x => x.id === id); if (!e) return;
    const p = e.parametros;
    if (e.area === 'campo_eletrico') { cargas = p.cargas.map(c => ({ ...c, q: +c.q, x: +c.x, y: +c.y })); sonda = { x: +p.px, y: +p.py }; $('#ce-titulo').value = e.titulo; }
    else if (e.area === 'eletronica') { estadoCirc[p.circuito] = { ...p.entradas }; atualizarCirc(p.circuito); }
    else {
      const f = $(`form[data-area="${e.area}"]`);
      for (const el of f.elements) if (el.name && p[el.name] !== undefined) el.type === 'checkbox' ? (el.checked = !!p[el.name]) : (el.value = p[el.name]);
      if (e.area === 'termodinamica') { $('#td-amb').value = e.ambiente_id || ''; $('#td-disp').value = e.dispositivo_id || ''; $('#td-titulo').value = e.titulo; }
      if (e.area === 'eletrostatica') $('#es-titulo').value = e.titulo;
      if (e.area === 'magnetismo') $('#mg-titulo').value = e.titulo;
    }
    abrirLab(ABA_DA_AREA[e.area]);
    $('#tab-lab').scrollIntoView({ behavior: 'smooth' });
    toast('Experimento #' + id + ' reaberto.');
  };
  window.resumoLab = e => {
    const r = e.resultado, L = (k) => ROTULO[k] ? `${ROTULO[k][0].split(' =')[0]}: <b>${typeof r[k] === 'string' ? esc(r[k]) : fmt(r[k])}</b> ${ROTULO[k][1]}` : '';
    const sel = { campo_eletrico: ['E_N_por_C', 'V_volts', 'F12_N'], eletrostatica: ['C_pF', 'toque_detectado'], magnetismo: ['B_bobina_mT', 'F_armadura_N', 'rele_fecha'],
      termodinamica: ['carga_termica_W', 'btu_recomendado', 'energia_kWh', 'custo_R$'] }[e.area];
    if (e.area === 'eletronica') return `<code>${esc(r.arquivo)}</code><br>` + Object.entries(r.saidas).map(([k, v]) => `${k}=<b>${v}</b>`).join(' · ');
    return sel.filter(k => k in r).map(L).join('<br>');
  };

  // ---------- integração com o refresh (polling) do script.js ----------
  window.aoAtualizar = () => {
    preencherSelects(); preencherAcoes();
    if (!$('#tab-lab').hidden && atual === 'eletronica') carregarCasa();
  };
  $$('#nav button').forEach(b => b.addEventListener('click', () => { if (b.dataset.tab === 'lab') abrirLab(atual); }));

  montarCircuitos();
  calcCampo();
})();
