/* Alter Smart — "Como sua casa funciona": a versão simples, para o morador.
 * Usa os mesmos cálculos e a mesma lógica dos circuitos (fisica.js); só a apresentação é simples:
 * uma pergunta, uma resposta curta, botões grandes e o resultado numa frase.
 * Os detalhes técnicos ficam na Área técnica (lab.js). */
(() => {
  const F = window.Fisica;
  const reais = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const num = (n, c = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: c });
  const estado = { presenca: 1, escuro: 1, armado: 1, porta: 0, tamanho: 12, fora: 32, purificador: 0 };

  const opcoes = (chave, lista) => `<div class="opcoes" role="group">${lista.map(([v, txt]) =>
    `<button type="button" class="btn opcao" data-chave="${chave}" data-valor="${v}" aria-pressed="${estado[chave] === v}">${txt}</button>`).join('')}</div>`;
  const tecnico = sub => `<button type="button" class="btn ghost sm" data-tecnico="${sub}">🔧 Ver detalhes técnicos</button>`;

  const CARTOES = [
    {
      id: 'luz', titulo: '💡 Por que a luz acende sozinha à noite?',
      texto: 'Um sensor percebe quando você entra no cômodo e outro percebe se está escuro. A luz só acende sozinha quando as duas coisas acontecem. Assim você não precisa procurar o interruptor no escuro, e o risco de tropeçar e cair diminui.',
      corpo: () => `<p class="pergunta">Tem alguém no cômodo?</p>${opcoes('presenca', [[1, '🙋 Sim'], [0, 'Não']])}
        <p class="pergunta">Está escuro?</p>${opcoes('escuro', [[1, '🌙 Sim'], [0, '☀ Não']])}`,
      resultado: () => {
        const s = F.calcular('eletronica', { circuito: 'luz_automatica', entradas: { PRESENCA: estado.presenca, ESCURO: estado.escuro, MANUAL: 0 } }).saidas;
        return s.LUZ ? ['ok', '💡 A luz ACENDE sozinha.'] : ['neutro', '⚫ A luz fica apagada' + (estado.presenca ? ', porque ainda está claro.' : ', porque não tem ninguém no cômodo.')];
      },
      sub: 'eletronica'
    },
    {
      id: 'porta', titulo: '🚪 Como o alarme sabe que a porta abriu?',
      texto: 'Na porta tem um pequeno ímã, e no batente tem um sensor. Quando a porta abre, o ímã se afasta e o sensor avisa o sistema. Se o alarme estiver ligado, a sirene toca e o cuidador pode ser avisado.',
      corpo: () => `<p class="pergunta">O alarme está ligado?</p>${opcoes('armado', [[1, '🔒 Ligado'], [0, '🔓 Desligado']])}
        <p class="pergunta">A porta está…</p>${opcoes('porta', [[0, 'Fechada'], [1, '🚪 Aberta']])}`,
      resultado: () => {
        const s = F.calcular('eletronica', { circuito: 'alarme_seguranca', entradas: { ARMADO: estado.armado, PORTA: estado.porta, JANELA: 0, MOVIMENTO: 0 } }).saidas;
        if (s.SIRENE) return ['alerta', '🚨 A sirene toca e o cuidador é avisado.'];
        if (s.AVISO_ABERTA) return ['aviso', '⚠ A porta está aberta. Feche antes de ligar o alarme.'];
        return ['ok', '✔ Tudo tranquilo.'];
      },
      sub: 'magnetismo'
    },
    {
      id: 'toque', titulo: '👆 Por que o botão funciona com um toque leve?',
      texto: 'O botão do painel não tem mola para apertar. Ele percebe a pequena eletricidade do seu dedo através do vidro. Por isso basta encostar, sem força, o que ajuda quem tem pouca força nas mãos ou dor nas juntas.',
      corpo: () => `<button type="button" class="btn toque" data-toque>☝ Encoste aqui de leve</button>`,
      resultado: () => estado.tocou
        ? ['ok', '✔ Toque percebido! Não foi preciso apertar.']
        : ['neutro', 'Toque no botão acima para testar.'],
      sub: 'eletrostatica'
    },
    {
      id: 'ar', titulo: '❄ Quanto o ar-condicionado gasta?',
      texto: 'O ar-condicionado tira o calor de dentro do cômodo e joga para fora. O sistema liga e desliga o ar sozinho para manter a temperatura que você escolheu, e só quando tem alguém em casa. Isso protege a saúde nos dias quentes e evita gastar à toa.',
      corpo: () => `<p class="pergunta">Tamanho do cômodo</p>${opcoes('tamanho', [[9, 'Pequeno'], [12, 'Médio'], [20, 'Grande']])}
        <p class="pergunta">Como está lá fora?</p>${opcoes('fora', [[30, '🌤 Quente'], [35, '🔥 Muito quente']])}`,
      resultado: () => {
        const base = { area_m2: estado.tamanho, t_externa: estado.fora, t_inicial: estado.fora - 2, setpoint: 23, horas: 3, presenca: true };
        const rec = F.calcular('termodinamica', { ...base, btu: 9000 }).btu_recomendado;
        const btu = [7500, 9000, 12000, 18000, 24000].find(b => b >= rec) || 24000;
        const r = F.calcular('termodinamica', { ...base, btu });
        return ['ok', `Para deixar o cômodo em 23 °C por 3 horas, o ar gasta cerca de ${num(r.energia_kWh)} kWh, uns ${reais(r['custo_R$'])}. Um aparelho de ${btu.toLocaleString('pt-BR')} BTU é suficiente.`];
      },
      sub: 'termodinamica'
    },
    {
      id: 'estoque', titulo: '💊 Como o sistema sabe que algo está acabando?',
      texto: 'Você diz quantos tem e com quantos quer ser avisado. O sistema compara os dois números. Quando tiver igual ou menos, aparece um aviso rosa no alto da tela, para não faltar remédio nem produto em casa.',
      corpo: () => {
        const l = (typeof D !== 'undefined' && D.produtos) || [];
        if (!l.length) return '<p class="muted">Você ainda não cadastrou produtos.</p><button type="button" class="btn" data-ir="estoque">🧴 Cadastrar no Estoque</button>';
        return `<ul class="lista-rapida">${l.slice(0, 5).map(p => `<li style="--c:var(--${p.baixo ? 'pink' : 'green'})">${esc(p.nome)}: tem ${p.quantidade}, aviso com ${p.quantidade_minima}<b>${p.baixo ? '🔴 Está acabando' : '🟢 Tem bastante'}</b></li>`).join('')}</ul>`;
      },
      resultado: () => {
        const b = ((typeof D !== 'undefined' && D.produtos) || []).filter(p => p.baixo);
        return b.length ? ['aviso', `⚠ ${b.length === 1 ? 'Um produto está acabando' : b.length + ' produtos estão acabando'}. Veja em 🧴 Estoque.`] : ['ok', '✔ Nada acabando por enquanto.'];
      },
      sub: 'eletronica'
    },
    {
      id: 'ar-puro', titulo: '🌬 Como o purificador limpa o ar?',
      texto: 'Dentro do purificador há placas com eletricidade. Elas puxam a poeira do ar, do mesmo jeito que um pente esfregado no cabelo puxa pedacinhos de papel. O ar sai mais limpo, o que ajuda quem tem asma, alergia ou problemas de respiração.',
      corpo: () => opcoes('purificador', [[1, '▶ Ligar purificador'], [0, '⏹ Desligar']]),
      resultado: () => estado.purificador ? ['ok', '✔ Ligado: a poeira está sendo presa nas placas.'] : ['neutro', 'Purificador desligado.'],
      sub: 'campo'
    }
  ];

  function desenhar() {
    $('#como-cartoes').innerHTML = CARTOES.map(c => `<article class="card como" id="como-${c.id}" aria-labelledby="como-t-${c.id}">
      <h3 id="como-t-${c.id}">${c.titulo}</h3>
      <p class="explica">${c.texto}</p>
      <div class="interacao">${c.corpo()}</div>
      <p class="resultado" aria-live="polite"></p>
      <div class="acts">${tecnico(c.sub)}</div></article>`).join('');
    CARTOES.forEach(atualizar);
  }
  function atualizar(c) {
    const [tipo, txt] = c.resultado(), el = $(`#como-${c.id} .resultado`);
    el.className = 'resultado r-' + tipo; el.textContent = txt;
    $$(`#como-${c.id} .opcao`).forEach(b => b.setAttribute('aria-pressed', String(estado[b.dataset.chave] === +b.dataset.valor)));
  }

  document.addEventListener('click', e => {
    const op = e.target.closest('#como-cartoes .opcao');
    if (op) { estado[op.dataset.chave] = +op.dataset.valor; atualizar(CARTOES.find(c => op.closest('#como-' + c.id))); return; }
    const t = e.target.closest('#como-cartoes [data-toque]');
    if (t) {
      estado.tocou = true; t.classList.add('tocado'); atualizar(CARTOES.find(c => c.id === 'toque'));
      setTimeout(() => t.classList.remove('tocado'), 600); return;
    }
    const tec = e.target.closest('[data-tecnico]');
    if (tec) { irPara('lab'); window.abrirAreaTecnica && window.abrirAreaTecnica(tec.dataset.tecnico); }
  });

  // o cartão do estoque usa os produtos reais da casa; redesenha quando eles mudam
  let ultimo = '';
  const anterior = window.aoAtualizar;
  window.aoAtualizar = q => {
    anterior && anterior(q);
    const j = JSON.stringify((typeof D !== 'undefined' && D.produtos) || []);
    if (j !== ultimo) {
      ultimo = j;
      const c = CARTOES.find(x => x.id === 'estoque');
      $('#como-estoque .interacao').innerHTML = c.corpo(); atualizar(c);
    }
  };
  desenhar();
})();
