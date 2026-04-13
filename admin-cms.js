/* =====================================================================
   admin-cms.js — THERMATIS — Gerenciador Central de Dados (Store)
   CMS Completo: Identidade, Hero, Sobre, Serviços, Diferenciais,
                 Depoimentos, SEO, Marketing, Segurança
   ===================================================================== */
'use strict';

const STORE_KEY = 'thermatis_master_store';
const SCHEMA_VERSION = '2.0';

/* ─── Estrutura Padrão (Fallback) ──────────────────────────────────── */
const DEFAULT_STORE = {
  _version: SCHEMA_VERSION,
  auth: { user: 'admin', pass: '123456' },
  empresa: {
    nome: 'THERMATIS Climatização',
    whatsapp: '5565998093240',
    telefone: '(65) 99809-3240',
    email: 'contato@thermatis.com.br',
    area: 'Cuiabá - MT e Região',
    horario: 'Seg–Sáb, 7h às 20h',
    logoUrl: 'logo.png',
    faviconUrl: '',
  },
  marketing: { metaPixelId: '', googleTagId: '' },
  seo: {
    title: 'THERMATIS Climatização — Instalação e Manutenção de Ar Condicionado | Cuiabá - MT',
    description: 'Instalação, limpeza, higienização e manutenção de ar condicionado em Cuiabá - MT.',
    keywords: 'ar condicionado, Cuiabá, manutenção, instalação, climatização',
    ogImage: 'https://thermatis.com.br/logo.png'
  },
  social: { instagram: '#', facebook: '#' },
  conteudo: {
    hero: {
      badge: 'Cuiabá & Região — Atendimento Especializado',
      tituloLinha1: 'Seu Ar Condicionado',
      tituloDestaque: 'Mãos de Especialistas',
      descricao: 'Instalação, limpeza, carga de gás e manutenção de ar condicionado em Cuiabá - MT.',
      stat1Num: '800', stat1Label: 'Clientes Atendidos',
      stat2Num: '8',   stat2Label: 'Anos de Experiência',
      stat3Num: '100', stat3Label: '% Comprometimento'
    },
    secoes: {
      servicos:    { titulo: 'Soluções Completas em', destaque: 'Ar Condicionado', subtitulo: 'Da instalação à manutenção, trabalhamos com qualidade para garantir o conforto do seu ambiente.' },
      sobre:       { titulo: 'Especialistas em', destaque: 'Climatização', anosExp: '8', anosLabel: 'em Cuiabá - MT' },
      diferenciais:{ titulo: 'Nossos Compromissos', destaque: 'Com Você', subtitulo: 'Mais do que um serviço técnico, entregamos tranquilidade.' },
      depoimentos: { titulo: 'O Que Nossos Clientes', destaque: 'Dizem Sobre Nós' },
      cta:         { titulo: 'Seu Ar Limpo e Gelando de Verdade!', descricao: 'Solicite um orçamento gratuito agora mesmo pelo WhatsApp.' }
    },
    servicos: [
      { icon: '❄️', titulo: 'Instalação',          cor: 'blue',    descricao: 'Instalação profissional de splits e multi-splits residencial e predial.' },
      { icon: '🧼', titulo: 'Limpeza',              cor: 'emerald', descricao: 'Limpeza profunda com produtos bactericidas para ar limpo e saudável.' },
      { icon: '💨', titulo: 'Carga de Gás',         cor: 'indigo',  descricao: 'Recarga de gás refrigerante com equipamentos calibrados e certificados.' },
      { icon: '🔧', titulo: 'Manutenção Preventiva',cor: 'amber',   descricao: 'Manutenção periódica que evita falhas e prolonga a vida do seu equipamento.' },
      { icon: '🛠️', titulo: 'Manutenção Reparatória',cor: 'blue',   descricao: 'Diagnóstico e reparo de qualquer problema no seu ar condicionado.' },
      { icon: '📋', titulo: 'Orçamentos',           cor: 'emerald', descricao: 'Orçamentos gratuitos e sem compromisso, com atendimento rápido.' }
    ],
    sobre: {
      p1: 'A THERMATIS é referência em climatização em Cuiabá - MT, com anos de experiência e centenas de clientes satisfeitos.',
      p2: 'Nossa equipe é formada por técnicos especializados com treinamento constante, garantindo qualidade e segurança em cada serviço.',
      lista: [
        'Técnicos certificados e especializados',
        'Garantia total nos serviços realizados',
        'Atendimento ágil e pontual',
        'Materiais e peças de alta qualidade',
        'Orçamento gratuito e transparente'
      ]
    },
    diferenciais: [
      { num: '01', titulo: 'Ar Limpo Garantido',     descricao: 'Eliminamos fungos, bactérias e ácaros do seu sistema de climatização.' },
      { num: '02', titulo: 'Técnicos Especializados', descricao: 'Equipe com certificação técnica e treinamento contínuo.' },
      { num: '03', titulo: 'Atendimento Rápido',      descricao: 'Respondemos em minutos e agendamos no dia mais conveniente para você.' },
      { num: '04', titulo: 'Garantia do Serviço',     descricao: 'Todos os nossos serviços têm garantia formal por escrito.' }
    ],
    depoimentos: [
      { iniciais: 'AP', nome: 'Ana Paula',    cidade: 'Cuiabá', cor: '#1a9fd4', texto: 'Serviço excelente! Técnico pontual, educado e o ar ficou funcionando perfeitamente. Recomendo muito!' },
      { iniciais: 'JC', nome: 'João Carlos',  cidade: 'Várzea Grande', cor: '#10b981', texto: 'Limpeza feita com cuidado e profissionalismo. Diferença imediata no cheiro e na potência do ar.' },
      { iniciais: 'MS', nome: 'Maria Silva',  cidade: 'Cuiabá', cor: '#f59e0b', texto: 'Atendimento rápido, preço justo e trabalho impecável. Com certeza chamarei novamente!' }
    ]
  }
};

/* ─── Core Logic ───────────────────────────────────────────────────── */
function getGlobalStore() {
  try {
    let s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!s) s = migrateFromLegacy();
    const base = JSON.parse(JSON.stringify(DEFAULT_STORE));
    const merged = s ? deepMergeStore(base, s) : base;
    if (merged.auth && merged.auth.pass === 'climamax2024' && base.auth.pass === '123456') {
      merged.auth.pass = '123456';
    }
    return merged;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
}

function saveGlobalStore(data) {
  data._version = SCHEMA_VERSION;
  localStorage.setItem(STORE_KEY, JSON.stringify(data));

  /* Notifica abas do site público para aplicar imediatamente */
  if (typeof BroadcastChannel !== 'undefined') {
    try { new BroadcastChannel('thermatis_site_update').postMessage('refresh'); } catch {}
  }

  if (typeof showToast === 'function') showToast('✅ Alterações salvas e aplicadas ao site!');
}

function deepMergeStore(base, over) {
  const r = { ...base };
  for (const k in over) {
    if (Array.isArray(over[k])) {
      r[k] = over[k];
    } else if (typeof over[k] === 'object' && over[k] !== null) {
      r[k] = deepMergeStore(base[k] || {}, over[k]);
    } else {
      r[k] = over[k];
    }
  }
  return r;
}

function migrateFromLegacy() {
  const legacyContent = JSON.parse(localStorage.getItem('thermatis_site_content') || '{}');
  const getLegacy = (key) => {
    const val = localStorage.getItem(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  };
  const legacyUser = getLegacy('climamax_auth_user') || getLegacy('auth_user');
  const legacyPass = getLegacy('climamax_auth_pass') || getLegacy('auth_pass');
  if (Object.keys(legacyContent).length === 0 && !legacyUser) return null;
  const newStore = JSON.parse(JSON.stringify(DEFAULT_STORE));
  if (legacyContent.empresa) newStore.empresa = { ...newStore.empresa, ...legacyContent.empresa };
  if (legacyUser) newStore.auth.user = legacyUser;
  if (legacyPass) newStore.auth.pass = legacyPass;
  return newStore;
}

/* ─── Helpers para listas dinâmicas ───────────────────────────────── */
function renderDynamicList(containerId, items, fieldDefs, addLabel) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function buildItem(item, idx) {
    const card = document.createElement('div');
    card.className = 'dynamic-item card';
    card.style.cssText = 'margin-bottom:12px;position:relative;padding:20px 20px 16px';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid var(--border);padding-bottom:10px';
    header.innerHTML = `<span style="font-size:.8rem;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.06em">Item ${idx + 1}</span>`;
    const btnRem = document.createElement('button');
    btnRem.textContent = '✕ Remover';
    btnRem.style.cssText = 'font-size:.75rem;color:var(--red);background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:6px;padding:4px 10px;cursor:pointer';
    btnRem.addEventListener('click', () => { card.remove(); });
    header.appendChild(btnRem);
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px';

    fieldDefs.forEach(f => {
      const group = document.createElement('div');
      group.className = 'config-group';
      if (f.full) group.style.gridColumn = '1 / -1';
      group.style.marginBottom = '0';
      const label = document.createElement('label');
      label.textContent = f.label;
      label.style.cssText = 'display:block;font-size:.8rem;font-weight:600;color:var(--text-2);margin-bottom:6px';

      let input;
      if (f.type === 'textarea') {
        input = document.createElement('textarea');
        input.rows = 2;
        input.style.resize = 'vertical';
      } else {
        input = document.createElement('input');
        input.type = f.type || 'text';
      }
      input.dataset.field = f.key;
      input.value = item[f.key] || '';
      input.style.cssText = 'width:100%;background:rgba(0,0,0,.2);border:1px solid var(--border-light);border-radius:8px;padding:9px 12px;color:var(--text-1);font-size:.88rem;outline:none;font-family:inherit';
      input.addEventListener('focus', () => input.style.borderColor = 'var(--primary)');
      input.addEventListener('blur',  () => input.style.borderColor = 'var(--border-light)');

      group.appendChild(label);
      group.appendChild(input);
      grid.appendChild(group);
    });

    card.appendChild(grid);
    return card;
  }

  container.innerHTML = '';
  items.forEach((item, idx) => container.appendChild(buildItem(item, idx)));

  const btnAdd = document.createElement('button');
  btnAdd.textContent = `+ ${addLabel}`;
  btnAdd.style.cssText = 'margin-top:6px;padding:10px 20px;background:rgba(6,182,212,.1);border:1px dashed rgba(6,182,212,.4);border-radius:8px;color:var(--primary);font-size:.88rem;font-weight:600;cursor:pointer;width:100%';
  btnAdd.addEventListener('click', () => {
    const empty = {};
    fieldDefs.forEach(f => { empty[f.key] = ''; });
    const newCard = buildItem(empty, container.querySelectorAll('.dynamic-item').length);
    container.insertBefore(newCard, btnAdd);
  });
  container.appendChild(btnAdd);
}

function readDynamicList(containerId) {
  const items = [];
  document.querySelectorAll(`#${containerId} .dynamic-item`).forEach(card => {
    const item = {};
    card.querySelectorAll('[data-field]').forEach(input => {
      item[input.dataset.field] = input.value.trim();
    });
    items.push(item);
  });
  return items;
}

/* Helper para lista de strings (sobre.lista) */
function renderStringList(containerId, items, addLabel) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function buildRow(val) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = val;
    input.style.cssText = 'flex:1;background:rgba(0,0,0,.2);border:1px solid var(--border-light);border-radius:8px;padding:9px 12px;color:var(--text-1);font-size:.88rem;outline:none;font-family:inherit';
    input.addEventListener('focus', () => input.style.borderColor = 'var(--primary)');
    input.addEventListener('blur',  () => input.style.borderColor = 'var(--border-light)');
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.style.cssText = 'width:32px;height:32px;flex-shrink:0;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:6px;color:var(--red);cursor:pointer;font-size:.85rem';
    btn.addEventListener('click', () => row.remove());
    row.appendChild(input);
    row.appendChild(btn);
    return row;
  }

  container.innerHTML = '';
  items.forEach(v => container.appendChild(buildRow(v)));

  const btnAdd = document.createElement('button');
  btnAdd.textContent = `+ ${addLabel}`;
  btnAdd.style.cssText = 'margin-top:4px;padding:8px 16px;background:rgba(6,182,212,.08);border:1px dashed rgba(6,182,212,.3);border-radius:8px;color:var(--primary);font-size:.82rem;font-weight:600;cursor:pointer;width:100%';
  btnAdd.addEventListener('click', () => container.insertBefore(buildRow(''), btnAdd));
  container.appendChild(btnAdd);
}

function readStringList(containerId) {
  const vals = [];
  document.querySelectorAll(`#${containerId} input`).forEach(inp => {
    if (inp.value.trim()) vals.push(inp.value.trim());
  });
  return vals;
}

/* ─── UI Rendering ─────────────────────────────────────────────────── */
function injectGlobalSettingsPage() {
  const existingPage = document.getElementById('page-global-settings');
  if (existingPage && existingPage.innerHTML.includes('cms-tabs')) return;

  const container = document.querySelector('.page-content') || document.querySelector('main') || document.body;
  const page = existingPage || document.createElement('section');
  if (!existingPage) { page.className = 'page'; page.id = 'page-global-settings'; }

  page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>⚙️ Gestão do Site</h1>
        <p>Edite qualquer conteúdo — as alterações são aplicadas ao site imediatamente.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn-primary-admin" id="btnSaveStore" style="background:linear-gradient(135deg,#10b981,#059669)">💾 Salvar & Aplicar</button>
        <a href="./" target="_blank" class="btn-primary-admin" style="background:var(--surface-3);border:1px solid var(--border);color:var(--text-1);font-size:.82rem;padding:8px 14px;display:inline-flex;align-items:center;gap:6px;border-radius:8px;text-decoration:none">🌐 Ver Site</a>
      </div>
    </div>

    <div class="cms-tabs" id="globalTabs">
      <button class="cms-tab active" data-tab="identidade">🏢 Identidade</button>
      <button class="cms-tab" data-tab="hero">🦸 Hero</button>
      <button class="cms-tab" data-tab="sobre">👥 Sobre</button>
      <button class="cms-tab" data-tab="servicos">🛠️ Serviços</button>
      <button class="cms-tab" data-tab="diferenciais">⭐ Diferenciais</button>
      <button class="cms-tab" data-tab="depoimentos">💬 Depoimentos</button>
      <button class="cms-tab" data-tab="marketing">📡 SEO</button>
      <button class="cms-tab" data-tab="seguranca">🔒 Segurança</button>
    </div>

    <!-- ── IDENTIDADE ── -->
    <div class="cms-panel active" id="pnl-identidade">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🏢 Dados de Contato</div>
          <div class="config-group"><label>Nome da Empresa</label><input type="text" id="st-nome" /></div>
          <div class="config-group"><label>WhatsApp (somente números, ex: 5565998093240)</label><input type="text" id="st-wa" /></div>
          <div class="config-group"><label>Telefone para Exibição</label><input type="text" id="st-tel" /></div>
          <div class="config-group"><label>E-mail</label><input type="email" id="st-email" /></div>
          <div class="config-group"><label>Área de Atendimento</label><input type="text" id="st-area" /></div>
          <div class="config-group"><label>Horário de Funcionamento</label><input type="text" id="st-horario" /></div>
        </div>
        <div class="card">
          <div class="config-section-title">🖼️ Mídia & Redes Sociais</div>
          <div class="config-group"><label>URL do Logotipo</label><input type="text" id="st-logo" placeholder="ex: logo.png" /></div>
          <div class="config-group"><label>URL do Favicon (opcional)</label><input type="text" id="st-favicon" placeholder="URL da imagem" /></div>
          <div class="config-group"><label>Instagram (URL completa)</label><input type="text" id="st-ig" placeholder="https://instagram.com/..." /></div>
          <div class="config-group"><label>Facebook (URL completa)</label><input type="text" id="st-fb" placeholder="https://facebook.com/..." /></div>
        </div>
      </div>
    </div>

    <!-- ── HERO ── -->
    <div class="cms-panel" id="pnl-hero">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🦸 Banner Principal</div>
          <div class="config-group"><label>Badge (topo do hero)</label><input type="text" id="st-hero-badge" /></div>
          <div class="config-group"><label>Título — Linha 1</label><input type="text" id="st-hero-t1" /></div>
          <div class="config-group"><label>Título — Destaque (colorido)</label><input type="text" id="st-hero-td" /></div>
          <div class="config-group"><label>Descrição</label><textarea id="st-hero-desc" rows="3"></textarea></div>
        </div>
        <div class="card">
          <div class="config-section-title">📊 Números em Destaque</div>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
            <div class="config-group"><label>Valor 1</label><input type="text" id="st-s1n" /></div>
            <div class="config-group"><label>Label 1</label><input type="text" id="st-s1l" /></div>
            <div class="config-group"><label>Valor 2</label><input type="text" id="st-s2n" /></div>
            <div class="config-group"><label>Label 2</label><input type="text" id="st-s2l" /></div>
            <div class="config-group"><label>Valor 3</label><input type="text" id="st-s3n" /></div>
            <div class="config-group"><label>Label 3</label><input type="text" id="st-s3l" /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SOBRE ── -->
    <div class="cms-panel" id="pnl-sobre">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">👥 Títulos da Seção</div>
          <div class="config-group"><label>Título</label><input type="text" id="st-ab-t" /></div>
          <div class="config-group"><label>Destaque (colorido)</label><input type="text" id="st-ab-dest" /></div>
          <div class="config-group"><label>Anos de Experiência</label><input type="text" id="st-ab-anos" /></div>
          <div class="config-group"><label>Label dos Anos</label><input type="text" id="st-ab-anosLabel" /></div>
        </div>
        <div class="card">
          <div class="config-section-title">📝 Textos</div>
          <div class="config-group"><label>Parágrafo 1</label><textarea id="st-ab-p1" rows="3"></textarea></div>
          <div class="config-group"><label>Parágrafo 2</label><textarea id="st-ab-p2" rows="3"></textarea></div>
        </div>
        <div class="card" style="grid-column:1/-1">
          <div class="config-section-title">✅ Lista de Diferenciais (Sobre)</div>
          <div id="list-sobre-lista"></div>
        </div>
        <div class="card" style="grid-column:1/-1">
          <div class="config-section-title">📣 Banner CTA</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="config-group"><label>Título</label><input type="text" id="st-cta-t" /></div>
            <div class="config-group"><label>Descrição</label><input type="text" id="st-cta-d" /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── SERVIÇOS ── -->
    <div class="cms-panel" id="pnl-servicos">
      <div class="card" style="margin-bottom:16px">
        <div class="config-section-title">🛠️ Títulos da Seção Serviços</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="config-group" style="margin-bottom:0"><label>Título</label><input type="text" id="st-svc-t" /></div>
          <div class="config-group" style="margin-bottom:0"><label>Destaque</label><input type="text" id="st-svc-d" /></div>
          <div class="config-group" style="margin-bottom:0"><label>Subtítulo</label><input type="text" id="st-svc-s" /></div>
        </div>
      </div>
      <div class="card">
        <div class="config-section-title">📋 Cards de Serviços</div>
        <div id="list-servicos"></div>
      </div>
    </div>

    <!-- ── DIFERENCIAIS ── -->
    <div class="cms-panel" id="pnl-diferenciais">
      <div class="card" style="margin-bottom:16px">
        <div class="config-section-title">⭐ Títulos da Seção</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
          <div class="config-group" style="margin-bottom:0"><label>Título</label><input type="text" id="st-dif-t" /></div>
          <div class="config-group" style="margin-bottom:0"><label>Destaque</label><input type="text" id="st-dif-d" /></div>
          <div class="config-group" style="margin-bottom:0"><label>Subtítulo</label><input type="text" id="st-dif-s" /></div>
        </div>
      </div>
      <div class="card">
        <div class="config-section-title">⭐ Cards de Diferenciais</div>
        <div id="list-diferenciais"></div>
      </div>
    </div>

    <!-- ── DEPOIMENTOS ── -->
    <div class="cms-panel" id="pnl-depoimentos">
      <div class="card" style="margin-bottom:16px">
        <div class="config-section-title">💬 Títulos da Seção</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="config-group" style="margin-bottom:0"><label>Título</label><input type="text" id="st-dep-t" /></div>
          <div class="config-group" style="margin-bottom:0"><label>Destaque</label><input type="text" id="st-dep-d" /></div>
        </div>
      </div>
      <div class="card">
        <div class="config-section-title">💬 Depoimentos dos Clientes</div>
        <div id="list-depoimentos"></div>
      </div>
    </div>

    <!-- ── SEO & MARKETING ── -->
    <div class="cms-panel" id="pnl-marketing">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🔍 SEO</div>
          <div class="config-group"><label>Título da Aba (title)</label><input type="text" id="st-seo-t" /></div>
          <div class="config-group"><label>Meta Descrição</label><textarea id="st-seo-d" rows="3"></textarea></div>
          <div class="config-group"><label>Palavras-Chave</label><input type="text" id="st-seo-kw" /></div>
          <div class="config-group"><label>Imagem de Compartilhamento (og:image URL)</label><input type="text" id="st-seo-og" /></div>
        </div>
        <div class="card">
          <div class="config-section-title">📡 Rastreamento</div>
          <div class="config-group"><label>Meta Pixel ID</label><input type="text" id="st-pixel" placeholder="Ex: 123456789012345" /></div>
          <div class="config-group"><label>Google Tag ID</label><input type="text" id="st-google" placeholder="Ex: G-XXXXXXXXXX" /></div>
        </div>
      </div>
    </div>

    <!-- ── SEGURANÇA ── -->
    <div class="cms-panel" id="pnl-seguranca">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🔒 Credenciais de Acesso</div>
          <div class="config-group"><label>Usuário</label><input type="text" id="st-user" /></div>
          <div class="config-group"><label>Nova Senha (deixe em branco para manter)</label><input type="password" id="st-pass" placeholder="••••••••" /></div>
        </div>
      </div>
    </div>
  `;

  if (!existingPage) container.appendChild(page);
  bindGlobalEvents();
}

function bindGlobalEvents() {
  /* Troca de tabs */
  document.getElementById('globalTabs')?.addEventListener('click', e => {
    const tab = e.target.dataset.tab;
    if (!tab) return;
    document.querySelectorAll('#globalTabs .cms-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.cms-panel').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(`pnl-${tab}`)?.classList.add('active');
  });

  /* Botão Salvar */
  document.getElementById('btnSaveStore')?.addEventListener('click', () => {
    const s = getGlobalStore();

    // Identidade
    s.empresa.nome     = document.getElementById('st-nome').value.trim();
    s.empresa.whatsapp = document.getElementById('st-wa').value.trim();
    s.empresa.telefone = document.getElementById('st-tel').value.trim();
    s.empresa.email    = document.getElementById('st-email').value.trim();
    s.empresa.area     = document.getElementById('st-area').value.trim();
    s.empresa.horario  = document.getElementById('st-horario').value.trim();
    s.empresa.logoUrl  = document.getElementById('st-logo').value.trim();
    s.empresa.faviconUrl = document.getElementById('st-favicon').value.trim();
    s.social.instagram = document.getElementById('st-ig').value.trim();
    s.social.facebook  = document.getElementById('st-fb').value.trim();

    // Hero
    s.conteudo.hero.badge        = document.getElementById('st-hero-badge').value.trim();
    s.conteudo.hero.tituloLinha1 = document.getElementById('st-hero-t1').value.trim();
    s.conteudo.hero.tituloDestaque = document.getElementById('st-hero-td').value.trim();
    s.conteudo.hero.descricao    = document.getElementById('st-hero-desc').value.trim();
    s.conteudo.hero.stat1Num     = document.getElementById('st-s1n').value.trim();
    s.conteudo.hero.stat1Label   = document.getElementById('st-s1l').value.trim();
    s.conteudo.hero.stat2Num     = document.getElementById('st-s2n').value.trim();
    s.conteudo.hero.stat2Label   = document.getElementById('st-s2l').value.trim();
    s.conteudo.hero.stat3Num     = document.getElementById('st-s3n').value.trim();
    s.conteudo.hero.stat3Label   = document.getElementById('st-s3l').value.trim();

    // Sobre
    s.conteudo.secoes.sobre.titulo    = document.getElementById('st-ab-t').value.trim();
    s.conteudo.secoes.sobre.destaque  = document.getElementById('st-ab-dest').value.trim();
    s.conteudo.secoes.sobre.anosExp   = document.getElementById('st-ab-anos').value.trim();
    s.conteudo.secoes.sobre.anosLabel = document.getElementById('st-ab-anosLabel').value.trim();
    s.conteudo.sobre.p1 = document.getElementById('st-ab-p1').value.trim();
    s.conteudo.sobre.p2 = document.getElementById('st-ab-p2').value.trim();
    s.conteudo.sobre.lista = readStringList('list-sobre-lista');
    s.conteudo.secoes.cta.titulo    = document.getElementById('st-cta-t').value.trim();
    s.conteudo.secoes.cta.descricao = document.getElementById('st-cta-d').value.trim();

    // Serviços
    s.conteudo.secoes.servicos.titulo    = document.getElementById('st-svc-t').value.trim();
    s.conteudo.secoes.servicos.destaque  = document.getElementById('st-svc-d').value.trim();
    s.conteudo.secoes.servicos.subtitulo = document.getElementById('st-svc-s').value.trim();
    s.conteudo.servicos = readDynamicList('list-servicos');

    // Diferenciais
    s.conteudo.secoes.diferenciais.titulo    = document.getElementById('st-dif-t').value.trim();
    s.conteudo.secoes.diferenciais.destaque  = document.getElementById('st-dif-d').value.trim();
    s.conteudo.secoes.diferenciais.subtitulo = document.getElementById('st-dif-s').value.trim();
    s.conteudo.diferenciais = readDynamicList('list-diferenciais');

    // Depoimentos
    s.conteudo.secoes.depoimentos.titulo   = document.getElementById('st-dep-t').value.trim();
    s.conteudo.secoes.depoimentos.destaque = document.getElementById('st-dep-d').value.trim();
    s.conteudo.depoimentos = readDynamicList('list-depoimentos');

    // SEO & Marketing
    s.seo.title          = document.getElementById('st-seo-t').value.trim();
    s.seo.description    = document.getElementById('st-seo-d').value.trim();
    s.seo.keywords       = document.getElementById('st-seo-kw').value.trim();
    s.seo.ogImage        = document.getElementById('st-seo-og').value.trim();
    s.marketing.metaPixelId = document.getElementById('st-pixel').value.trim();
    s.marketing.googleTagId = document.getElementById('st-google').value.trim();

    // Segurança
    s.auth.user = document.getElementById('st-user').value.trim();
    const newPass = document.getElementById('st-pass').value;
    if (newPass) s.auth.pass = newPass;
    document.getElementById('st-pass').value = '';

    saveGlobalStore(s);
  });
}

function loadGlobalForm() {
  injectGlobalSettingsPage();
  const s = getGlobalStore();

  /* Campos simples */
  const map = {
    'st-nome': s.empresa?.nome,
    'st-wa': s.empresa?.whatsapp,
    'st-tel': s.empresa?.telefone,
    'st-email': s.empresa?.email,
    'st-area': s.empresa?.area,
    'st-horario': s.empresa?.horario,
    'st-logo': s.empresa?.logoUrl,
    'st-favicon': s.empresa?.faviconUrl,
    'st-ig': s.social?.instagram,
    'st-fb': s.social?.facebook,
    'st-hero-badge': s.conteudo?.hero?.badge,
    'st-hero-t1':    s.conteudo?.hero?.tituloLinha1,
    'st-hero-td':    s.conteudo?.hero?.tituloDestaque,
    'st-hero-desc':  s.conteudo?.hero?.descricao,
    'st-s1n': s.conteudo?.hero?.stat1Num,
    'st-s1l': s.conteudo?.hero?.stat1Label,
    'st-s2n': s.conteudo?.hero?.stat2Num,
    'st-s2l': s.conteudo?.hero?.stat2Label,
    'st-s3n': s.conteudo?.hero?.stat3Num,
    'st-s3l': s.conteudo?.hero?.stat3Label,
    'st-ab-t':        s.conteudo?.secoes?.sobre?.titulo,
    'st-ab-dest':     s.conteudo?.secoes?.sobre?.destaque,
    'st-ab-anos':     s.conteudo?.secoes?.sobre?.anosExp,
    'st-ab-anosLabel':s.conteudo?.secoes?.sobre?.anosLabel,
    'st-ab-p1':  s.conteudo?.sobre?.p1,
    'st-ab-p2':  s.conteudo?.sobre?.p2,
    'st-cta-t':  s.conteudo?.secoes?.cta?.titulo,
    'st-cta-d':  s.conteudo?.secoes?.cta?.descricao,
    'st-svc-t':  s.conteudo?.secoes?.servicos?.titulo,
    'st-svc-d':  s.conteudo?.secoes?.servicos?.destaque,
    'st-svc-s':  s.conteudo?.secoes?.servicos?.subtitulo,
    'st-dif-t':  s.conteudo?.secoes?.diferenciais?.titulo,
    'st-dif-d':  s.conteudo?.secoes?.diferenciais?.destaque,
    'st-dif-s':  s.conteudo?.secoes?.diferenciais?.subtitulo,
    'st-dep-t':  s.conteudo?.secoes?.depoimentos?.titulo,
    'st-dep-d':  s.conteudo?.secoes?.depoimentos?.destaque,
    'st-pixel':  s.marketing?.metaPixelId,
    'st-google': s.marketing?.googleTagId,
    'st-seo-t':  s.seo?.title,
    'st-seo-d':  s.seo?.description,
    'st-seo-kw': s.seo?.keywords,
    'st-seo-og': s.seo?.ogImage,
    'st-user':   s.auth?.user,
  };
  for (const id in map) {
    const el = document.getElementById(id);
    if (el) el.value = map[id] || '';
  }

  /* Listas dinâmicas */
  renderStringList('list-sobre-lista', s.conteudo?.sobre?.lista || [], 'Adicionar Item');

  renderDynamicList('list-servicos', s.conteudo?.servicos || [], [
    { key: 'icon',      label: 'Ícone (emoji)' },
    { key: 'titulo',    label: 'Título' },
    { key: 'cor',       label: 'Cor (blue/emerald/indigo/amber)' },
    { key: 'descricao', label: 'Descrição', type: 'textarea', full: true },
  ], 'Adicionar Serviço');

  renderDynamicList('list-diferenciais', s.conteudo?.diferenciais || [], [
    { key: 'num',      label: 'Número (ex: 01)' },
    { key: 'titulo',   label: 'Título' },
    { key: 'descricao',label: 'Descrição', type: 'textarea', full: true },
  ], 'Adicionar Diferencial');

  renderDynamicList('list-depoimentos', s.conteudo?.depoimentos || [], [
    { key: 'iniciais', label: 'Iniciais (ex: AP)' },
    { key: 'nome',     label: 'Nome Completo' },
    { key: 'cidade',   label: 'Cidade' },
    { key: 'cor',      label: 'Cor do avatar (hex)' },
    { key: 'texto',    label: 'Depoimento', type: 'textarea', full: true },
  ], 'Adicionar Depoimento');
}

window.loadGlobalForm = loadGlobalForm;

window.exportDataUnificado = function () {
  const data = {
    store: getGlobalStore(),
    orcamentos: JSON.parse(localStorage.getItem('climamax_orcamentos') || '[]'),
    clientes: JSON.parse(localStorage.getItem('climamax_clientes') || '[]'),
    visitas: JSON.parse(localStorage.getItem('climamax_visitas') || '[]'),
    exportedAt: new Date().toISOString(),
    version: '2.0-senior'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `thermatis_full_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
