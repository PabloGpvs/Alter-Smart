const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const FLUXO = ['Solicitado', 'Aceito', 'Em andamento', 'Concluído'];
const ICON = { 'Solicitado': '🟡', 'Aceito': '🔵', 'Em andamento': '🟣', 'Concluído': '🟢' };
let token = localStorage.getItem('sh_token'), D = {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function toast(msg, err) {
  const t = $('#toast'); t.textContent = (err ? '✖ ' : '▶ ') + msg;
  t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast.h); toast.h = setTimeout(() => (t.className = ''), 2800);
}
async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) }
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && token) { logout(true); }
  if (!r.ok) throw new Error(j.erro || 'Falha na requisição');
  return j;
}
const run = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

// ---------- Autenticação ----------
$$('[data-auth]').forEach(b => b.onclick = () => {
  $$('[data-auth]').forEach(x => x.classList.toggle('on', x === b));
  $('#f-login').hidden = b.dataset.auth !== 'login';
  $('#f-register').hidden = b.dataset.auth !== 'register';
});
for (const [id, ep] of [['#f-login', 'login'], ['#f-register', 'register']]) {
  $(id).onsubmit = run(async e => {
    e.preventDefault();
    const r = await api('/auth/' + ep, 'POST', Object.fromEntries(new FormData(e.target)));
    token = r.token; localStorage.setItem('sh_token', token); localStorage.setItem('sh_nome', r.nome);
    enter();
  });
}
function logout(silent) {
  if (!silent) api('/auth/logout', 'POST').catch(() => {});
  token = null; localStorage.removeItem('sh_token');
  $('#app').hidden = true; $('#auth').hidden = false; clearInterval(enter.poll);
}
$('#logout').onclick = () => logout();
function enter() {
  $('#auth').hidden = true; $('#app').hidden = false;
  $('#who').textContent = '> ' + (localStorage.getItem('sh_nome') || 'USER');
  refresh();
  clearInterval(enter.poll); enter.poll = setInterval(() => !document.hidden && refresh(true), 5000); // "tempo real" por polling
}

// ---------- Abas ----------
$$('#nav button').forEach(b => b.onclick = () => {
  $$('#nav button').forEach(x => x.classList.toggle('on', x === b));
  $$('.tab').forEach(t => t.hidden = t.id !== 'tab-' + b.dataset.tab);
});

// ---------- Carga e renderização ----------
const empty = '<div class="empty">&gt; Nenhum registro. Use o formulário acima.</div>';
const acts = (ep, id, extra = '') => `<div class="acts">${extra}<button class="btn cyan sm" onclick="edit('${ep}',${id})">Editar</button><button class="btn pink sm" onclick="del('${ep}',${id})">Excluir</button></div>`;

const RENDER = {
  pedidos: l => l.map(p => {
    const i = FLUXO.indexOf(p.status), nxt = FLUXO[i + 1];
    return `<article class="card s-${p.status.replace(' ', '-')}">
      <h3>#${p.id} ${esc(p.titulo)}</h3>
      <span class="badge">${ICON[p.status]} ${p.status}</span>
      <div class="steps">${FLUXO.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
      <div>Ambiente: ${esc(p.ambiente || '—')} | Est.: ${brl(p.preco_estimado)}</div>
      ${p.observacao ? `<div class="muted">"${esc(p.observacao)}"</div>` : ''}
      <small class="muted">${esc(p.data_criacao)}</small>
      <div class="acts">${nxt ? `<button class="btn sm" onclick="avancar(${p.id},'${nxt}')">Avançar ▶ ${nxt}</button>` : ''}
      <button class="btn pink sm" onclick="del('pedidos',${p.id})">Cancelar</button></div></article>`;
  }).join(''),
  servicos: l => l.map(s => `<article class="card"><h3>${esc(s.titulo)}</h3><div>${esc(s.descricao)}</div>
      <div class="cyan">${brl(s.preco_estimado)}</div>${acts('servicos', s.id)}</article>`).join(''),
  produtos: l => l.map(p => `<article class="card ${p.baixo ? 'low' : ''}"><h3>${esc(p.nome)}</h3>
      <div>Qtd: <b>${p.quantidade}</b> / mín. ${p.quantidade_minima}</div>
      ${p.baixo ? '<span class="badge" style="--c:var(--pink)">⚠ ESTOQUE BAIXO</span>' : ''}
      ${acts('produtos', p.id, `<button class="btn sm" onclick="repor(${p.id},'${esc(p.nome)}')">Repor</button>`)}</article>`).join(''),
  dispositivos: l => l.map(d => `<article class="card"><h3>${esc(d.nome)}</h3>
      <div>${esc(d.tipo)} @ ${esc(d.ambiente || '—')}</div><div class="cyan">estado: ${esc(d.estado)}</div>${acts('dispositivos', d.id)}</article>`).join(''),
  rotinas: l => l.map(r => `<article class="card" style="--c:var(--pink)"><h3>${esc(r.nome)}</h3><div class="muted">${esc(r.descricao)}</div>
      <ul class="acoes">${r.acoes.map(a => `<li>${esc(a.dispositivo)} → ${esc(a.acao)} <a href="#" onclick="delAcao(${a.id});return false">[x]</a></li>`).join('') || '<li class="muted">sem ações</li>'}</ul>
      <button class="btn cyan sm" onclick="addAcao(${r.id})">+ Ação</button>
      ${acts('rotinas', r.id, `<button class="btn sm" onclick="executar(${r.id})">▶ Executar</button>`)}</article>`).join(''),
  enderecos: l => l.map(e => `<article class="card"><h3>${esc(e.rua)}, ${esc(e.numero)}</h3>${acts('enderecos', e.id)}</article>`).join(''),
  ambientes: l => l.map(a => `<article class="card"><h3>${esc(a.nome)}</h3>${acts('ambientes', a.id)}</article>`).join(''),
  experimentos: l => l.map(e => `<article class="card x-${e.area}"><h3>${esc(e.titulo)}</h3>
      <span class="badge">${esc(LAB_AREA[e.area] || e.area)}</span>
      ${e.ambiente || e.dispositivo ? `<div class="muted">${esc(e.ambiente || '')} ${e.dispositivo ? '· ' + esc(e.dispositivo) : ''}</div>` : ''}
      <div class="resumo">${resumoExp(e)}</div><small class="muted">${esc(e.data)}</small>
      <div class="acts"><button class="btn cyan sm" onclick="abrirExp(${e.id})">Reabrir</button><button class="btn pink sm" onclick="del('experimentos',${e.id})">Excluir</button></div></article>`).join(''),
  historico: l => l.map(h => `<div class="t-${h.tipo}"><small>${esc(h.data)}</small><b>[${h.tipo}]</b> ${esc(h.descricao)}</div>`).join('')
};
const ENDPOINT = { pedidos: 'pedidos', servicos: 'servicos', produtos: 'produtos', dispositivos: 'dispositivos', rotinas: 'rotinas', enderecos: 'enderecos', ambientes: 'ambientes', experimentos: 'experimentos', historico: 'historico' };
const LAB_AREA = { campo_eletrico: 'Campo elétrico', eletrostatica: 'Eletrostática', magnetismo: 'Magnetismo', termodinamica: 'Termodinâmica', eletronica: 'Eletrônica' };
const resumoExp = e => (window.resumoLab ? window.resumoLab(e) : '');

const refresh = run(async quiet => {
  const keys = Object.keys(ENDPOINT);
  const res = await Promise.all(keys.map(k => api('/' + ENDPOINT[k])));
  keys.forEach((k, i) => D[k] = res[i]);
  keys.forEach(k => $('#lista-' + k).innerHTML = D[k].length ? RENDER[k](D[k]) : empty);
  // selects de referência (preserva seleção atual)
  $$('select[data-src]').forEach(sel => {
    const cur = sel.value, opt = sel.required ? '' : '<option value="">—</option>';
    sel.innerHTML = opt + D[sel.dataset.src].map(o => `<option value="${o.id}">${esc(o[sel.dataset.lbl])}</option>`).join('');
    if (cur) sel.value = cur;
  });
  const baixos = D.produtos.filter(p => p.baixo);
  $('#alerta').hidden = !baixos.length;
  window.aoAtualizar && window.aoAtualizar(quiet);
  $('#alerta').textContent = baixos.length ? '⚠ ALERTA DE ESTOQUE: ' + baixos.map(p => `${p.nome} (${p.quantidade})`).join(', ') + ' — vá em Estoque e reponha.' : '';
});

// ---------- Formulários genéricos (criar / editar) ----------
$$('form[data-ep]').forEach(f => f.onsubmit = run(async e => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(f)), id = body.id; delete body.id;
  await api('/' + f.dataset.ep + (id ? '/' + id : ''), id ? 'PUT' : 'POST', body);
  toast(id ? 'Registro atualizado.' : 'Registro criado.');
  f.reset(); f.id.value = ''; refresh();
}));
window.edit = (ep, id) => {
  const f = $(`form[data-ep="${ep}"]`), item = D[ep].find(x => x.id === id);
  for (const el of f.elements) if (el.name && item[el.name] !== undefined) el.value = item[el.name] ?? '';
  f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  toast('Editando #' + id + ' — altere e salve.');
};
window.del = run(async (ep, id) => {
  if (!confirm('Confirmar exclusão #' + id + '?')) return;
  await api(`/${ep}/${id}`, 'DELETE'); toast('Removido.'); refresh();
});

// ---------- Ações específicas ----------
window.avancar = run(async (id, status) => { await api('/pedidos/' + id, 'PUT', { status }); toast('Pedido #' + id + ' → ' + status); refresh(); });
window.repor = run(async (id, nome) => {
  const q = prompt(`Quantidade a repor de "${nome}":`, '5'); if (!q) return;
  await api(`/produtos/${id}/repor`, 'POST', { quantidade: q }); toast('Reposição registrada.'); refresh();
});
window.addAcao = run(async id => {
  const lista = D.dispositivos.map(d => `${d.id} = ${d.nome}`).join('\n');
  const dev = prompt('ID do dispositivo:\n' + lista); if (!dev) return;
  const acao = prompt('Ação / estado (ex.: ligado, desligado, 22°C, fechada, ativada):'); if (!acao) return;
  await api(`/rotinas/${id}/acoes`, 'POST', { dispositivo_id: dev, acao }); refresh();
});
window.delAcao = run(async id => { await api('/acoes/' + id, 'DELETE'); refresh(); });
window.executar = run(async id => { const r = await api(`/rotinas/${id}/executar`, 'POST'); toast(`Rotina executada (${r.executadas} ações).`); refresh(); });
window.limparHist = run(async () => { if (confirm('Apagar todo o histórico?')) { await api('/historico', 'DELETE'); refresh(); } });

if (token) enter();
