/* =====================================================================
   admin-cms.js — THERMATIS — Gerenciador Central de Dados (Store)
   Versão Sênior 10/10: Sincronismo Total, SEO 2.0 e Gestão de Mídia
   ===================================================================== */
'use strict';

const STORE_KEY = 'thermatis_master_store';
const SCHEMA_VERSION = '2.0';

/* ─── Estrutura Padrão (Fallback) ────────────────────────────────── */
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
    faviconUrl: '', // Se vazio, usa o SVG padrão
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
      stat2Num: '8', stat2Label: 'Anos de Experiência',
      stat3Num: '100', stat3Label: '% Comprometimento'
    },
    secoes: {
      servicos: { titulo: 'Soluções Completas em', destaque: 'Ar Condicionado', subtitulo: 'Da instalação à manutenção, trabalhamos com qualidade para garantir o conforto do seu ambiente.' },
      sobre: { titulo: 'Especialistas em', destaque: 'Climatização', anosExp: '8', anosLabel: 'em Cuiabá - MT' },
      diferenciais: { titulo: 'Nossos Compromissos', destaque: 'Com Você', subtitulo: 'Mais do que um serviço técnico, entregamos tranquilidade.' },
      depoimentos: { titulo: 'O Que Nossos Clientes', destaque: 'Dizem Sobre Nós' },
      cta: { titulo: 'Seu Ar Limpo e Gelando de Verdade!', descricao: 'Solicite um orçamento gratuito agora mesmo pelo WhatsApp.' }
    },
    servicos: [
      { icon: '❄️', titulo: 'Instalação', cor: 'blue', descricao: 'Instalação profissional de splits e multi-splits.' },
      { icon: '🧼', titulo: 'Limpeza', cor: 'emerald', descricao: 'Limpeza profunda com produtos bactericidas.' }
    ],
    sobre: {
      p1: 'A THERMATIS é referência em Cuiabá.',
      p2: 'Equipe especializada com treinamento constante.',
      lista: ['Técnicos especializados', 'Garantia total no serviço', 'Atendimento ágil']
    },
    diferenciais: [
      { num: '01', titulo: 'Ar Limpo Garantido', descricao: 'Eliminamos fungos e bactérias.' },
      { num: '02', titulo: 'Técnicos Especializados', descricao: 'Equipe treinada e atualizada.' }
    ],
    depoimentos: [
      { iniciais: 'AP', nome: 'Ana Paula', cidade: 'Cuiabá', cor: '#1a9fd4', texto: 'Serviço excelente, recomendo!' }
    ]
  }
};

/* ─── Core Logic (Store Management) ──────────────────────────────── */
function getGlobalStore() {
  try {
    let s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');

    // Se não houver store v2, tenta migrar
    if (!s) {
      s = migrateFromLegacy();
    }

    const base = JSON.parse(JSON.stringify(DEFAULT_STORE));
    const merged = s ? deepMergeStore(base, s) : base;

    // Proteção Anti-Trava: Se a senha salva na memória for a do resgate antigo,
    // mas o arquivo DEFAULT_STORE estiver com a senha nova, nós forçamos a atualização.
    if (merged.auth && merged.auth.pass === 'climamax2024' && base.auth.pass === '123456') {
      merged.auth.pass = '123456';
    }

    return merged;
  } catch (err) {
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
}

function saveGlobalStore(data) {
  data._version = SCHEMA_VERSION;
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
  if (typeof showToast === 'function') showToast('✅ Sistema atualizado com sucesso!');
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

  // Busca em todas as chaves possíveis e limpa possíveis aspas de JSON
  const getLegacy = (key) => {
    const val = localStorage.getItem(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  };

  const legacyUser = getLegacy('climamax_auth_user') || getLegacy('auth_user');
  const legacyPass = getLegacy('climamax_auth_pass') || getLegacy('auth_pass');

  if (Object.keys(legacyContent).length === 0 && !legacyUser) return null;

  const newStore = JSON.parse(JSON.stringify(DEFAULT_STORE));

  if (legacyContent.hero) newStore.conteudo.hero = { ...newStore.conteudo.hero, ...legacyContent };
  if (legacyContent.empresa) newStore.empresa = { ...newStore.empresa, ...legacyContent.empresa };

  if (legacyUser) newStore.auth.user = legacyUser;
  if (legacyPass) newStore.auth.pass = legacyPass;

  return newStore;
}

/* ─── UI Rendering (Admin Panel) ─────────────────────────────────── */
function injectGlobalSettingsPage() {
  const existingPage = document.getElementById('page-global-settings');
  
  // Se já existe e já tem abas renderizadas, não repete
  if (existingPage && existingPage.innerHTML.includes('cms-tabs')) return;

  const container = document.querySelector('.page-content') || document.querySelector('main') || document.body;
  if (!container && !existingPage) return;

  const page = existingPage || document.createElement('section');
  if (!existingPage) {
    page.className = 'page';
    page.id = 'page-global-settings';
  }

  page.innerHTML = `
    <div class="page-header">
      <div>
        <h1>⚙️ Gestão Centralizada</h1>
        <p>Controle total da Identidade, Conteúdo e SEO em um único lugar.</p>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn-primary-admin" id="btnSaveStore">💾 Salvar Alterações</button>
      </div>
    </div>

    <div class="cms-tabs" id="globalTabs">
      <button class="cms-tab active" data-tab="identidade">🏢 Identidade</button>
      <button class="cms-tab" data-tab="hero">🦸 Hero & Stats</button>
      <button class="cms-tab" data-tab="secoes">📄 Seções & Textos</button>
      <button class="cms-tab" data-tab="marketing">📡 SEO & Marketing</button>
      <button class="cms-tab" data-tab="seguranca">🔒 Segurança</button>
    </div>

    <!-- TAB: IDENTIDADE -->
    <div class="cms-panel active" id="pnl-identidade">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🏢 Dados de Contato</div>
          <div class="config-group"><label>Nome da Empresa</label><input type="text" id="st-nome" /></div>
          <div class="config-group"><label>WhatsApp (Ex: 5565998093240)</label><input type="text" id="st-wa" /></div>
          <div class="config-group"><label>Telefone para Exibição</label><input type="text" id="st-tel" /></div>
          <div class="config-group"><label>E-mail</label><input type="email" id="st-email" /></div>
          <div class="config-group"><label>Área de Atendimento</label><input type="text" id="st-area" /></div>
          <div class="config-group"><label>Horário</label><input type="text" id="st-horario" /></div>
        </div>
        <div class="card">
          <div class="config-section-title">🖼️ Mídia & Links</div>
          <div class="config-group"><label>URL do Logotipo</label><input type="text" id="st-logo" placeholder="ex: logo.png" /></div>
          <div class="config-group"><label>URL do Favicon</label><input type="text" id="st-favicon" placeholder="URL da imagem (opcional)" /></div>
          <div class="config-group"><label>Instagram (URL)</label><input type="text" id="st-ig" /></div>
          <div class="config-group"><label>Facebook (URL)</label><input type="text" id="st-fb" /></div>
        </div>
      </div>
    </div>

    <!-- TAB: HERO & STATS -->
    <div class="cms-panel" id="pnl-hero">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🦸 Banner Principal</div>
          <div class="config-group"><label>Badge (Topo)</label><input type="text" id="st-hero-badge" /></div>
          <div class="config-group"><label>Título Linha 1</label><input type="text" id="st-hero-t1" /></div>
          <div class="config-group"><label>Título Destaque</label><input type="text" id="st-hero-td" /></div>
          <div class="config-group"><label>Descrição</label><textarea id="st-hero-desc" rows="3"></textarea></div>
        </div>
        <div class="card">
          <div class="config-section-title">📊 Números (Stats)</div>
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

    <!-- TAB: SEÇÕES -->
    <div class="cms-panel" id="pnl-secoes">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🛠️ Serviços</div>
          <div class="config-group"><label>Título</label><input type="text" id="st-svc-t" /></div>
          <div class="config-group"><label>Destaque</label><input type="text" id="st-svc-d" /></div>
          <div class="config-group"><label>Subtítulo</label><textarea id="st-svc-s" rows="2"></textarea></div>
        </div>
        <div class="card">
          <div class="config-section-title">👥 Sobre Nós</div>
          <div class="config-group"><label>Título</label><input type="text" id="st-ab-t" /></div>
          <div class="config-group"><label>Destaque</label><input type="text" id="st-ab-dest" /></div>
          <div class="config-group"><label>Anos Exp.</label><input type="text" id="st-ab-anos" /></div>
        </div>
        <div class="card">
          <div class="config-section-title">📣 Banner Final (CTA)</div>
          <div class="config-group"><label>Título</label><input type="text" id="st-cta-t" /></div>
          <div class="config-group"><label>Descrição</label><textarea id="st-cta-d" rows="2"></textarea></div>
        </div>
      </div>
    </div>

    <!-- TAB: MARKETING -->
    <div class="cms-panel" id="pnl-marketing">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🔍 SEO</div>
          <div class="config-group"><label>Título Aba</label><input type="text" id="st-seo-t" /></div>
          <div class="config-group"><label>Meta Desc.</label><textarea id="st-seo-d" rows="3"></textarea></div>
          <div class="config-group"><label>Compartilhamento (Image URL)</label><input type="text" id="st-seo-og" /></div>
        </div>
        <div class="card">
          <div class="config-section-title">📡 Rastreamento</div>
          <div class="config-group"><label>Meta Pixel ID</label><input type="text" id="st-pixel" placeholder="Ex: 123456789012345" /></div>
          <div class="config-group"><label>Google Tag ID</label><input type="text" id="st-google" placeholder="Ex: G-XXXXXXXXXX" /></div>
        </div>
      </div>
    </div>

    <!-- TAB: SEGURANÇA -->
    <div class="cms-panel" id="pnl-seguranca">
      <div class="config-grid">
        <div class="card">
          <div class="config-section-title">🔒 Perfil</div>
          <div class="config-group"><label>Usuário</label><input type="text" id="st-user" /></div>
          <div class="config-group"><label>Nova Senha</label><input type="password" id="st-pass" /></div>
        </div>
      </div>
    </div>
  `;

  if (!existingPage) container.appendChild(page);
  bindGlobalEvents();
}

function bindGlobalEvents() {
  // Troca de Tabs
  document.getElementById('globalTabs')?.addEventListener('click', e => {
    const tab = e.target.dataset.tab; if (!tab) return;
    document.querySelectorAll('#globalTabs .cms-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.cms-panel').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(`pnl-${tab}`).classList.add('active');
  });

  // Botão Salvar
  document.getElementById('btnSaveStore')?.addEventListener('click', () => {
    const s = getGlobalStore();

    // 1. Identidade
    s.empresa.nome = document.getElementById('st-nome').value.trim();
    s.empresa.whatsapp = document.getElementById('st-wa').value.trim();
    s.empresa.telefone = document.getElementById('st-tel').value.trim();
    s.empresa.email = document.getElementById('st-email').value.trim();
    s.empresa.area = document.getElementById('st-area').value.trim();
    s.empresa.horario = document.getElementById('st-horario').value.trim();
    s.empresa.logoUrl = document.getElementById('st-logo').value.trim();
    s.empresa.faviconUrl = document.getElementById('st-favicon').value.trim();
    s.social.instagram = document.getElementById('st-ig').value.trim();
    s.social.facebook = document.getElementById('st-fb').value.trim();

    // 2. Hero & Stats
    s.conteudo.hero.badge = document.getElementById('st-hero-badge').value.trim();
    s.conteudo.hero.tituloLinha1 = document.getElementById('st-hero-t1').value.trim();
    s.conteudo.hero.tituloDestaque = document.getElementById('st-hero-td').value.trim();
    s.conteudo.hero.descricao = document.getElementById('st-hero-desc').value.trim();
    s.conteudo.hero.stat1Num = document.getElementById('st-s1n').value.trim();
    s.conteudo.hero.stat1Label = document.getElementById('st-s1l').value.trim();
    s.conteudo.hero.stat2Num = document.getElementById('st-s2n').value.trim();
    s.conteudo.hero.stat2Label = document.getElementById('st-s2l').value.trim();
    s.conteudo.hero.stat3Num = document.getElementById('st-s3n').value.trim();
    s.conteudo.hero.stat3Label = document.getElementById('st-s3l').value.trim();

    // 3. Seções
    s.conteudo.secoes.servicos.titulo = document.getElementById('st-svc-t').value.trim();
    s.conteudo.secoes.servicos.destaque = document.getElementById('st-svc-d').value.trim();
    s.conteudo.secoes.servicos.subtitulo = document.getElementById('st-svc-s').value.trim();
    s.conteudo.secoes.sobre.titulo = document.getElementById('st-ab-t').value.trim();
    s.conteudo.secoes.sobre.destaque = document.getElementById('st-ab-dest').value.trim();
    s.conteudo.secoes.sobre.anosExp = document.getElementById('st-ab-anos').value.trim();
    s.conteudo.secoes.cta.titulo = document.getElementById('st-cta-t').value.trim();
    s.conteudo.secoes.cta.descricao = document.getElementById('st-cta-d').value.trim();

    // 4. Marketing & SEO
    s.marketing.metaPixelId = document.getElementById('st-pixel').value.trim();
    s.marketing.googleTagId = document.getElementById('st-google').value.trim();
    s.seo.title = document.getElementById('st-seo-t').value.trim();
    s.seo.description = document.getElementById('st-seo-d').value.trim();
    s.seo.ogImage = document.getElementById('st-seo-og').value.trim();

    // 5. Segurança
    s.auth.user = document.getElementById('st-user').value.trim();
    const p = document.getElementById('st-pass').value; if (p) s.auth.pass = p;

    saveGlobalStore(s);
  });
}

function loadGlobalForm() {
  try {
    injectGlobalSettingsPage();
    const s = getGlobalStore();

    if (!s.conteudo.secoes.cta) s.conteudo.secoes.cta = { titulo: '', descricao: '' };

    const map = {
      'st-nome': s.empresa?.nome, 'st-wa': s.empresa?.whatsapp, 'st-tel': s.empresa?.telefone,
      'st-email': s.empresa?.email, 'st-area': s.empresa?.area, 'st-horario': s.empresa?.horario,
      'st-logo': s.empresa?.logoUrl, 'st-favicon': s.empresa?.faviconUrl,
      'st-ig': s.social?.instagram, 'st-fb': s.social?.facebook,
      'st-hero-badge': s.conteudo?.hero?.badge, 'st-hero-t1': s.conteudo?.hero?.tituloLinha1,
      'st-hero-td': s.conteudo?.hero?.tituloDestaque, 'st-hero-desc': s.conteudo?.hero?.descricao,
      'st-s1n': s.conteudo?.hero?.stat1Num, 'st-s1l': s.conteudo?.hero?.stat1Label,
      'st-s2n': s.conteudo?.hero?.stat2Num, 'st-s2l': s.conteudo?.hero?.stat2Label,
      'st-s3n': s.conteudo?.hero?.stat3Num, 'st-s3l': s.conteudo?.hero?.stat3Label,
      'st-svc-t': s.conteudo?.secoes?.servicos?.titulo, 'st-svc-d': s.conteudo?.secoes?.servicos?.destaque,
      'st-svc-s': s.conteudo?.secoes?.servicos?.subtitulo,
      'st-ab-t': s.conteudo?.secoes?.sobre?.titulo, 'st-ab-dest': s.conteudo?.secoes?.sobre?.destaque,
      'st-ab-anos': s.conteudo?.secoes?.sobre?.anosExp,
      'st-cta-t': s.conteudo?.secoes?.cta?.titulo, 'st-cta-d': s.conteudo?.secoes?.cta?.descricao,
      'st-pixel': s.marketing?.metaPixelId,
      'st-google': s.marketing?.googleTagId,
      'st-seo-t': s.seo?.title, 'st-seo-d': s.seo?.description, 'st-seo-og': s.seo?.ogImage,
      'st-user': s.auth?.user
    };

    for (const id in map) {
      const el = document.getElementById(id);
      if (el) el.value = map[id] || '';
    }
  } catch (err) {
    console.error("Erro Crítico no carregamento do Gestão do Site:", err);
  }
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
