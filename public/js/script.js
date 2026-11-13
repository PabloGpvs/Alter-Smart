const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const FLUXO = ['Solicitado', 'Aceito', 'Em andamento', 'Concluído'];
const ICON = { 'Solicitado': '🟡', 'Aceito': '🔵', 'Em andamento': '🟣', 'Concluído': '🟢' };
const EXPLICA = { 'Solicitado': 'Pedido enviado. Aguardando o profissional.', 'Aceito': 'O profissional confirmou.',
  'Em andamento': 'O serviço está sendo feito.', 'Concluído': 'Serviço terminado.' };
let token = localStorage.getItem('sh_token'), D = {};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---------- Mensagens (ficam mais tempo na tela e podem ser fechadas) ----------
function toast(msg, err) {
  const t = $('#toast');
  t.innerHTML = `${err ? '✖ ' : '✔ '}${esc(msg)}<button type="button" aria-label="Fechar mensagem">fechar</button>`;
  t.setAttribute('aria-live', err ? 'assertive' : 'polite');
  t.className = 'show' + (err ? ' err' : '');
  t.querySelector('button').onclick = () => (t.className = '');
  clearTimeout(toast.h); toast.h = setTimeout(() => (t.className = ''), err ? 9000 : 6000);
}
async function api(path, method = 'GET', body) {
  let r;
  try {
    r = await fetch('/api' + path, {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) }
    });
  } catch (e) { throw new Error('Sem conexão com o sistema. Verifique se ele está ligado e tente de novo.'); }
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && token) { logout(true); }
  if (!r.ok) throw new Error(j.erro || 'Não foi possível concluir. Tente de novo.');
  return j;
}
const run = fn => async (...a) => { try { await fn(...a); } catch (e) { toast(e.message, true); } };

// ---------- Janelas de confirmação (no lugar das caixinhas do navegador) ----------
function confirmar(msg, textoSim = 'Sim, apagar') {
  const d = $('#dlg-confirmar');
  $('#dlg-c-msg').textContent = msg; $('#dlg-c-sim').textContent = textoSim;
  return new Promise(ok => {
    const fim = v => { d.close(); ok(v); };
    $('#dlg-c-sim').onclick = () => fim(true);
    d.querySelector('[data-fechar]').onclick = () => fim(false);
    d.oncancel = () => ok(false);
    d.showModal(); d.querySelector('[data-fechar]').focus();
  });
}
$$('dialog [data-fechar]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));

// ---------- Preferências de leitura ----------
function marcarTexto() { const t = document.documentElement.className; $$('[data-texto]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.texto === t))); }
$$('[data-texto]').forEach(b => b.onclick = () => {
  document.documentElement.className = b.dataset.texto; localStorage.setItem('as_texto', b.dataset.texto); marcarTexto();
  toast(b.getAttribute('aria-label') + ' ativada.');
});
$('#bt-facil').onclick = () => {
  const on = document.body.classList.toggle('facil'); localStorage.setItem('as_facil', on ? '1' : '0');
  $('#bt-facil').setAttribute('aria-pressed', String(on)); toast(on ? 'Leitura fácil ligada: sem linhas de TV e sem brilho.' : 'Leitura fácil desligada.');
};
$('#bt-ajuda').onclick = () => {
  const sem = document.body.classList.toggle('sem-ajuda'); localStorage.setItem('as_ajuda', sem ? '0' : '1');
  $('#bt-ajuda').setAttribute('aria-pressed', String(!sem)); toast(sem ? 'Explicações escondidas.' : 'Explicações aparecendo em todas as telas.');
};
document.addEventListener('DOMContentLoaded', () => {
  marcarTexto();
  $('#bt-facil').setAttribute('aria-pressed', String(document.body.classList.contains('facil')));
  $('#bt-ajuda').setAttribute('aria-pressed', String(!document.body.classList.contains('sem-ajuda')));
});

// ---------- Autenticação ----------
$$('[data-auth]').forEach(b => b.onclick = () => {
  $$('[data-auth]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
  $('#f-login').hidden = b.dataset.auth !== 'login';
  $('#f-register').hidden = b.dataset.auth !== 'register';
  $(b.dataset.auth === 'login' ? '#f-login input' : '#f-register input').focus();
});
$$('[data-mostrar-senha]').forEach(c => c.onchange = () => { c.closest('form').querySelector('[name=senha]').type = c.checked ? 'text' : 'password'; });
for (const [id, ep] of [['#f-login', 'login'], ['#f-register', 'register']]) {
  $(id).onsubmit = async e => {
    e.preventDefault();
    const msg = e.target.querySelector('.erro-form'); msg.textContent = '';
    try {
      const r = await api('/auth/' + ep, 'POST', Object.fromEntries(new FormData(e.target)));
      token = r.token; localStorage.setItem('sh_token', token); localStorage.setItem('sh_nome', r.nome);
      enter();
    } catch (err) {
      msg.textContent = ep === 'login' && /Credenciais/.test(err.message) ? 'E-mail ou senha não conferem. Confira e tente de novo.' : err.message;
    }
  };
}
async function logout(silent) {
  if (!silent) {
    if (!(await confirmar('Deseja mesmo sair do sistema?', 'Sim, sair'))) return;
    api('/auth/logout', 'POST').catch(() => {});
  }
  token = null; localStorage.removeItem('sh_token');
  $('#app').hidden = true; $('#auth').hidden = false; clearInterval(enter.poll);
}
$('#logout').onclick = () => logout();
function enter() {
  $('#auth').hidden = true; $('#app').hidden = false;
  $('#who').textContent = 'Olá, ' + (localStorage.getItem('sh_nome') || 'morador(a)');
  refresh();
  clearInterval(enter.poll); enter.poll = setInterval(() => !document.hidden && !document.querySelector('dialog[open]') && refresh(true), 5000);
}

// ---------- Abas ----------
function irPara(tab, foco) {
  $$('#nav button').forEach(x => { const on = x.dataset.tab === tab; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
  $$('.tab').forEach(t => t.hidden = t.id !== 'tab-' + tab);
  window.aoMostrarAba && window.aoMostrarAba(tab);
  const sec = $('#tab-' + tab);
  const alvo = foco && (sec.querySelector(`[name="${foco}"]`) || document.getElementById(foco));
  if (alvo) { alvo.scrollIntoView({ behavior: 'smooth', block: 'center' }); if (alvo.focus) alvo.focus({ preventScroll: true }); }
  else { window.scrollTo({ top: 0, behavior: 'smooth' }); $('#conteudo').focus({ preventScroll: true }); }
}
$$('#nav button').forEach(b => b.addEventListener('click', () => irPara(b.dataset.tab)));
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ir]'); if (b) irPara(b.dataset.ir, b.dataset.foco || b.dataset.ancora);
});

// ---------- Estados possíveis de cada tipo de aparelho ----------
const ESTADOS = {
  luz: ['desligado', 'ligado'],
  'ar-condicionado': ['desligado', 'ligado', ...[18, 20, 22, 23, 24, 26].map(t => `ligado ${t}°C`)],
  persiana: ['fechada', 'aberta', 'meio aberta'],
  seguranca: ['desarmado', 'armado']
};
const TIPO_NOME = { luz: '💡 Luz', 'ar-condicionado': '❄ Ar-condicionado', persiana: '🪟 Persiana', seguranca: '🔒 Alarme' };
const ligadoQ = e => /^(ligado|aberta|meio|armado|ativ|DISPARADO)/i.test(e || '');
const alternar = d => ({ luz: ligadoQ(d.estado) ? 'desligado' : 'ligado', 'ar-condicionado': ligadoQ(d.estado) ? 'desligado' : 'ligado',
  persiana: ligadoQ(d.estado) ? 'fechada' : 'aberta', seguranca: ligadoQ(d.estado) ? 'desarmado' : 'armado' }[d.tipo] || (ligadoQ(d.estado) ? 'desligado' : 'ligado'));
const verbo = d => ({ luz: ['Acender', 'Apagar'], 'ar-condicionado': ['Ligar', 'Desligar'], persiana: ['Abrir', 'Fechar'], seguranca: ['Armar', 'Desarmar'] }[d.tipo] || ['Ligar', 'Desligar'])[ligadoQ(d.estado) ? 1 : 0];
function opcoesEstado(sel, tipo, atual) {
  const lista = [...(ESTADOS[tipo] || ['ligado', 'desligado'])];
  if (atual && !lista.includes(atual)) lista.unshift(atual);
  sel.innerHTML = lista.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if (atual) sel.value = atual;
}
$('#sel-tipo').onchange = () => opcoesEstado($('#sel-estado'), $('#sel-tipo').value);
opcoesEstado($('#sel-estado'), 'luz');

// ---------- Carga e renderização ----------
const empty = txt => `<div class="empty">&gt; ${txt || 'Nada cadastrado ainda. Use o formulário acima.'}</div>`;
const VAZIO = { pedidos: 'Você ainda não fez nenhum pedido. Escolha um serviço acima e toque em "Fazer pedido".',
  dispositivos: 'Nenhum aparelho cadastrado. Preencha o formulário logo abaixo para cadastrar o primeiro.',
  produtos: 'Nenhum produto cadastrado. Preencha o formulário acima.', rotinas: 'Nenhuma rotina ainda. Crie uma acima.',
  historico: 'Nada registrado ainda.', experimentos: 'Nenhum experimento salvo ainda.' };
const acts = (ep, id, extra = '', nome = '') => `<div class="acts">${extra}<button class="btn cyan sm" onclick="edit('${ep}',${id})" aria-label="Editar ${esc(nome)}">Editar</button><button class="btn pink sm" onclick="del('${ep}',${id})" aria-label="Apagar ${esc(nome)}">Apagar</button></div>`;

const RENDER = {
  pedidos: l => l.map(p => {
    const i = FLUXO.indexOf(p.status), nxt = FLUXO[i + 1];
    return `<article class="card s-${p.status.replace(' ', '-')}" aria-label="Pedido ${p.id}: ${esc(p.titulo)}, ${p.status}">
      <h3>#${p.id} ${esc(p.titulo)}</h3>
      <span class="badge">${ICON[p.status]} ${p.status}</span>
      <div class="muted">${EXPLICA[p.status]}</div>
      <div class="steps" aria-hidden="true">${FLUXO.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
      <div>Etapa ${i + 1} de 4 · Cômodo: ${esc(p.ambiente || 'não informado')}</div>
      <div>Preço estimado: <b>${brl(p.preco_estimado)}</b></div>
      ${p.observacao ? `<div class="muted">Recado: "${esc(p.observacao)}"</div>` : ''}
      <small class="muted">Pedido feito em ${esc(p.data_criacao)}</small>
      <div class="acts">${nxt ? `<button class="btn sm" onclick="avancar(${p.id},'${nxt}')">Avançar para: ${nxt}</button>` : ''}
      <button class="btn pink sm" onclick="del('pedidos',${p.id})">Cancelar pedido</button></div></article>`;
  }).join(''),
  servicos: l => l.map(s => `<article class="card"><h3>${esc(s.titulo)}</h3><div>${esc(s.descricao)}</div>
      <div class="cyan">${brl(s.preco_estimado)}</div>${acts('servicos', s.id, '', s.titulo)}</article>`).join(''),
  produtos: l => l.map(p => `<article class="card ${p.baixo ? 'low' : ''}"><h3>${esc(p.nome)}</h3>
      <div class="estado-txt">Tem <b>${p.quantidade}</b> · avisar com ${p.quantidade_minima}</div>
      ${p.baixo ? '<span class="badge" style="--c:var(--pink)">⚠ ESTÁ ACABANDO: hora de comprar</span>' : '<span class="muted">✔ Quantidade boa</span>'}
      ${acts('produtos', p.id, `<button class="btn sm" onclick="repor(${p.id})">+ Repor</button>`, p.nome)}</article>`).join(''),
  dispositivos: l => l.map(d => {
    const on = ligadoQ(d.estado);
    return `<article class="card" style="--c:var(--${on ? 'green' : 'cyan'})"><h3>${esc(d.nome)}</h3>
      <div>${TIPO_NOME[d.tipo] || esc(d.tipo)} · ${esc(d.ambiente || 'sem cômodo')}</div>
      <div class="estado-txt">Agora está: <b>${esc(d.estado)}</b></div>
      <button class="btn liga ${on ? 'on' : ''}" onclick="alternarDisp(${d.id})" aria-label="${verbo(d)} ${esc(d.nome)}">${on ? '⏻' : '⏼'} ${verbo(d)}</button>
      ${acts('dispositivos', d.id, '', d.nome)}</article>`;
  }).join(''),
  rotinas: l => l.map(r => `<article class="card" style="--c:var(--pink)"><h3>${esc(r.nome)}</h3><div class="muted">${esc(r.descricao)}</div>
      <div>Quando executar, vai fazer:</div>
      <ul class="acoes">${r.acoes.map(a => `<li>${esc(a.dispositivo)} → <b>${esc(a.acao)}</b> <button class="btn ghost sm" onclick="delAcao(${a.id})" aria-label="Tirar esta ação">tirar</button></li>`).join('') || '<li class="muted">nada ainda: toque em "+ Adicionar ação"</li>'}</ul>
      <div class="acts"><button class="btn liga" onclick="executar(${r.id})">▶ Executar</button>
      <button class="btn cyan sm" onclick="addAcao(${r.id})">+ Adicionar ação</button></div>
      ${acts('rotinas', r.id, '', r.nome)}</article>`).join(''),
  enderecos: l => l.map(e => `<article class="card"><h3>${esc(e.rua)}, ${esc(e.numero)}</h3>${acts('enderecos', e.id, '', e.rua)}</article>`).join(''),
  ambientes: l => l.map(a => `<article class="card"><h3>${esc(a.nome)}</h3>${acts('ambientes', a.id, '', a.nome)}</article>`).join(''),
  experimentos: l => l.map(e => `<article class="card x-${e.area}"><h3>${esc(e.titulo)}</h3>
      <span class="badge">${esc(LAB_AREA[e.area] || e.area)}</span>
      ${e.ambiente || e.dispositivo ? `<div class="muted">${esc(e.ambiente || '')} ${e.dispositivo ? '· ' + esc(e.dispositivo) : ''}</div>` : ''}
      <div class="resumo">${resumoExp(e)}</div><small class="muted">${esc(e.data)}</small>
      <div class="acts"><button class="btn cyan sm" onclick="abrirExp(${e.id})">Reabrir</button><button class="btn pink sm" onclick="del('experimentos',${e.id})">Apagar</button></div></article>`).join(''),
  historico: l => l.map(h => `<div class="t-${h.tipo}"><small>${esc(h.data)}</small><b>[${h.tipo}]</b> ${esc(h.descricao)}</div>`).join('')
};
const ENDPOINT = { pedidos: 'pedidos', servicos: 'servicos', produtos: 'produtos', dispositivos: 'dispositivos', rotinas: 'rotinas', enderecos: 'enderecos', ambientes: 'ambientes', experimentos: 'experimentos', historico: 'historico' };
const LAB_AREA = { campo_eletrico: 'Campo elétrico', eletrostatica: 'Eletrostática', magnetismo: 'Magnetismo', termodinamica: 'Termodinâmica', eletronica: 'Eletrônica' };
const resumoExp = e => (window.resumoLab ? window.resumoLab(e) : '');
const ultimo = {}; // só redesenha o que mudou (não atrapalha leitores de tela nem o foco)

function resumoCasa() {
  const abertos = D.pedidos.filter(p => p.status !== 'Concluído'), baixos = D.produtos.filter(p => p.baixo);
  const ligados = D.dispositivos.filter(d => ligadoQ(d.estado));
  $('#resumo-casa').innerHTML = `
    <article class="card" style="--c:var(--cyan)"><h3>🛠 Pedidos em aberto</h3><div class="num">${abertos.length}</div>
      <ul class="lista-rapida">${abertos.slice(0, 4).map(p => `<li>${esc(p.titulo)} <span>${ICON[p.status]} ${p.status}</span></li>`).join('') || '<li class="muted">Nenhum pedido em aberto.</li>'}</ul>
      <button class="btn cyan sm" data-ir="pedidos">Ver pedidos</button></article>
    <article class="card"><h3>💡 Aparelhos ligados</h3><div class="num">${ligados.length} <small class="muted">de ${D.dispositivos.length}</small></div>
      <ul class="lista-rapida">${D.dispositivos.slice(0, 6).map(d => `<li style="--c:var(--${ligadoQ(d.estado) ? 'green' : 'muted'})">${esc(d.nome)} <button class="btn sm ${ligadoQ(d.estado) ? '' : 'ghost'}" onclick="alternarDisp(${d.id})">${verbo(d)}</button></li>`).join('') || '<li class="muted">Nenhum aparelho cadastrado.</li>'}</ul>
      <button class="btn sm" data-ir="automacao">Ver todos os aparelhos</button></article>
    <article class="card" style="--c:var(--pink)"><h3>🧴 Acabando</h3><div class="num">${baixos.length}</div>
      <ul class="lista-rapida">${baixos.map(p => `<li>${esc(p.nome)} (${p.quantidade}) <button class="btn sm" onclick="repor(${p.id})">+ Repor</button></li>`).join('') || '<li class="muted">Nada acabando. 👍</li>'}</ul>
      <button class="btn pink sm" data-ir="estoque">Ver estoque</button></article>
    <article class="card" style="--c:var(--yellow)"><h3>▶ Rotinas</h3>
      <ul class="lista-rapida">${D.rotinas.map(r => `<li>${esc(r.nome)} <button class="btn sm" onclick="executar(${r.id})">▶ Executar</button></li>`).join('') || '<li class="muted">Nenhuma rotina criada.</li>'}</ul>
      <button class="btn sm" data-ir="automacao" data-ancora="lista-rotinas">Ver rotinas</button></article>`;
}

const refresh = run(async quiet => {
  const keys = Object.keys(ENDPOINT);
  const res = await Promise.all(keys.map(k => api('/' + ENDPOINT[k])));
  keys.forEach((k, i) => D[k] = res[i]);
  let mudou = false;
  keys.forEach(k => {
    const j = JSON.stringify(D[k]); if (ultimo[k] === j) return;
    ultimo[k] = j; mudou = true;
    $('#lista-' + k).innerHTML = D[k].length ? RENDER[k](D[k]) : empty(VAZIO[k]);
  });
  if (mudou || !quiet) resumoCasa();
  // listas de escolha (mantém o que estava escolhido)
  $$('select[data-src]').forEach(sel => {
    const cur = sel.value, opt = sel.required ? '' : '<option value="">— não informar —</option>';
    sel.innerHTML = opt + D[sel.dataset.src].map(o => `<option value="${o.id}">${esc(o[sel.dataset.lbl])}</option>`).join('');
    if (cur) sel.value = cur;
  });
  const baixos = D.produtos.filter(p => p.baixo);
  window.aoAtualizar && window.aoAtualizar(quiet);
  const txt = baixos.length ? '⚠ ESTÁ ACABANDO: ' + baixos.map(p => `${p.nome} (${p.quantidade})`).join(', ') + '. Vá em 🧴 Estoque e toque em "Repor" quando comprar.' : '';
  if ($('#alerta').textContent !== txt) { $('#alerta').textContent = txt; $('#alerta').hidden = !baixos.length; }
});

// ---------- Formulários (criar / editar) ----------
$$('form[data-ep]').forEach(f => f.onsubmit = run(async e => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(f)), id = body.id; delete body.id;
  await api('/' + f.dataset.ep + (id ? '/' + id : ''), id ? 'PUT' : 'POST', body);
  toast(id ? 'Alteração salva.' : ({ pedidos: 'Pedido feito! Acompanhe o andamento logo abaixo.' }[f.dataset.ep] || 'Cadastrado com sucesso.'));
  f.reset(); f.id.value = '';
  f.querySelector('button[type=submit]').textContent = f.dataset.txtOriginal || f.querySelector('button[type=submit]').textContent;
  if (f.dataset.ep === 'dispositivos') opcoesEstado($('#sel-estado'), $('#sel-tipo').value);
  refresh();
}));
window.edit = (ep, id) => {
  const f = $(`form[data-ep="${ep}"]`), item = D[ep].find(x => x.id === id);
  if (ep === 'dispositivos') opcoesEstado($('#sel-estado'), item.tipo, item.estado);
  for (const el of f.elements) if (el.name && item[el.name] !== undefined) el.value = item[el.name] ?? '';
  const bt = f.querySelector('button[type=submit]'); f.dataset.txtOriginal = f.dataset.txtOriginal || bt.textContent; bt.textContent = 'Salvar alteração';
  f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.querySelector('input:not([type=hidden]),select').focus({ preventScroll: true });
  toast('Mude o que precisar no formulário e toque em "Salvar alteração".');
};
window.del = run(async (ep, id) => {
  const item = D[ep]?.find(x => x.id === id), nome = item ? (item.nome || item.titulo || item.rua || '#' + id) : '#' + id;
  const msg = ep === 'pedidos' ? `Cancelar o pedido "${nome}"?` : `Apagar "${nome}"? Isso não pode ser desfeito.`;
  if (!(await confirmar(msg, ep === 'pedidos' ? 'Sim, cancelar pedido' : 'Sim, apagar'))) return;
  await api(`/${ep}/${id}`, 'DELETE'); toast(ep === 'pedidos' ? 'Pedido cancelado.' : 'Apagado.'); refresh();
});

// ---------- Ações específicas ----------
window.avancar = run(async (id, status) => { await api('/pedidos/' + id, 'PUT', { status }); toast('Pedido #' + id + ' agora está: ' + status); refresh(); });
window.alternarDisp = run(async id => {
  const d = D.dispositivos.find(x => x.id === id), novo = alternar(d);
  await api('/dispositivos/' + id, 'PUT', { estado: novo }); toast(`${d.nome}: ${novo}.`); refresh();
});
window.repor = id => {
  const p = D.produtos.find(x => x.id === id), dlg = $('#dlg-repor'), f = $('#f-repor');
  $('#dlg-r-nome').textContent = p.nome; f.quantidade.value = Math.max(1, p.quantidade_minima - p.quantidade + 1);
  f.onsubmit = run(async e => {
    const n = parseInt(f.quantidade.value, 10);
    if (!(n > 0)) { e.preventDefault(); return toast('Digite uma quantidade maior que zero.', true); }
    await api(`/produtos/${id}/repor`, 'POST', { quantidade: n }); toast(`Reposição registrada: +${n} ${p.nome}.`); refresh();
  });
  dlg.showModal(); f.quantidade.focus(); f.quantidade.select();
};
$$('#f-repor [data-passo]').forEach(b => b.onclick = () => { const i = $('#f-repor').quantidade; i.value = Math.max(1, (parseInt(i.value, 10) || 0) + +b.dataset.passo); });
window.addAcao = id => {
  if (!D.dispositivos.length) return toast('Cadastre um aparelho primeiro (formulário "Cadastrar ou alterar aparelho").', true);
  const dlg = $('#dlg-acao'), f = $('#f-acao');
  f.dispositivo_id.innerHTML = D.dispositivos.map(d => `<option value="${d.id}">${esc(d.nome)} (${TIPO_NOME[d.tipo] || d.tipo})</option>`).join('');
  const preenche = () => { const d = D.dispositivos.find(x => x.id == f.dispositivo_id.value); opcoesEstado(f.acao, d.tipo); };
  f.dispositivo_id.onchange = preenche; preenche();
  f.onsubmit = run(async () => {
    await api(`/rotinas/${id}/acoes`, 'POST', { dispositivo_id: f.dispositivo_id.value, acao: f.acao.value });
    toast('Ação adicionada à rotina.'); refresh();
  });
  dlg.showModal(); f.dispositivo_id.focus();
};
window.delAcao = run(async id => { await api('/acoes/' + id, 'DELETE'); toast('Ação tirada da rotina.'); refresh(); });
window.executar = run(async id => { const r = await api(`/rotinas/${id}/executar`, 'POST'); toast(`Rotina executada: ${r.executadas} ação(ões) feitas.`); refresh(); });
window.limparHist = run(async () => { if (await confirmar('Apagar todo o histórico?')) { await api('/historico', 'DELETE'); toast('Histórico apagado.'); refresh(); } });

if (token) enter();
