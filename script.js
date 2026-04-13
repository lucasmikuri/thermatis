/* =====================================================================
   script.js — THERMATIS Climatização
   CMS client-side: carrega conteúdo da camada em memória abastecida pelo banco
   ===================================================================== */
'use strict';

/* ─── Conteúdo padrão (fallback) ──────────────────────────────────── */
const DEFAULT_CONTENT = {
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
      { icon: '❄️', titulo: 'Instalação', cor: 'blue', descricao: 'Instalação profissional de splits e multi-splits residencial e predial.' },
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
    ],
    cta: { titulo: 'Seu Ar Limpo e Gelando de Verdade!', descricao: 'Solicite um orçamento gratuito agora mesmo pelo WhatsApp.' }
  },
  // Retrocompatibilidade
  trustBar: [
    { icon: '🔧', texto: 'Técnicos Especializados' },
    { icon: '🛡️', texto: 'Garantia nos Serviços' }
  ]
};

/* ─── Utilitários ──────────────────────────────────────────────────── */
const STORE_KEY = 'thermatis_master_store';
const SCHEMA_VERSION = '2.0';

function getSiteContent() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    const base = JSON.parse(JSON.stringify(DEFAULT_CONTENT));
    if (!saved) return base;
    
    // Na arquitetura sênior v2.0, usamos o merge direto da Master Store
    return deepMerge(base, saved);
  } catch (err) {
    console.warn('Erro ao carregar conteúdo salvo, usando padrão.', err);
    return DEFAULT_CONTENT; 
  }
}

function deepMerge(base, override) {
  const result = { ...base };
  for (const key in override) {
    if (Array.isArray(override[key])) {
      result[key] = override[key];
    } else if (typeof override[key] === 'object' && override[key] !== null) {
      result[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function updateAllLinks(selector, attr, newVal) {
  document.querySelectorAll(selector).forEach(el => { el[attr] = newVal; });
}

/* ─── Aplicar conteúdo no site ─────────────────────────────────────── */
function applySiteContent() {
  const c = getSiteContent();

  // 1. Identidade & Mídia
  setText('header-nome-empresa', c.empresa.nome);
  setText('footer-logo-nome',   c.empresa.nome);
  
  if (c.empresa.logoUrl) {
    document.querySelectorAll('.nav-logo img, footer img').forEach(img => { img.src = c.empresa.logoUrl; });
  }
  if (c.empresa.faviconUrl) {
    const fav = document.getElementById('favicon');
    if (fav) fav.href = c.empresa.faviconUrl;
  }

  // 2. Links Dinâmicos (WhatsApp & Tel)
  const waUrl = `https://wa.me/${c.empresa.whatsapp.replace(/\D/g,'')}`;
  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    const msgPart = a.href.split('?')[1] || 'text=Olá!%20Gostaria%20de%20um%20orçamento.';
    a.href = `${waUrl}?${msgPart}`;
  });
  document.querySelectorAll('a[href^="tel:"]').forEach(a => {
    a.href = `tel:+${c.empresa.whatsapp.replace(/\D/g,'')}`;
  });

  // 3. SEO & OpenGraph 2.0
  if (c.seo) {
    document.title = c.seo.title;
    const metaDesc = document.getElementById('seo-description');
    if (metaDesc) metaDesc.content = c.seo.description;
    const metaKeys = document.getElementById('seo-keywords');
    if (metaKeys) metaKeys.content = c.seo.keywords;

    // OG Tags
    const ogT = document.getElementById('og-title'); if (ogT) ogT.content = c.seo.title;
    const ogD = document.getElementById('og-description'); if (ogD) ogD.content = c.seo.description;
    const ogI = document.getElementById('og-image'); if (ogI) ogI.content = c.seo.ogImage || c.empresa.logoUrl;
  }

  // 4. Marketing & Tracking
  // (O rastreamento é gerenciado pela função initTracking no final do arquivo)

  // 5. Redes Sociais
  if (c.social?.instagram) {
    const ig = document.getElementById('footer-instagram'); if (ig) ig.href = c.social.instagram;
  }
  if (c.social?.facebook) {
    const fb = document.getElementById('footer-facebook'); if (fb) fb.href = c.social.facebook;
  }

  // 6. Hero & Stats
  const h = c.conteudo.hero;
  setText('hero-badge-text', h.badge);
  setText('hero-title-line1', h.tituloLinha1);
  setText('hero-title-highlight', h.tituloDestaque);
  setText('hero-desc', h.descricao);

  const stats = [
    { num: h.stat1Num, label: h.stat1Label },
    { num: h.stat2Num, label: h.stat2Label },
    { num: h.stat3Num, label: h.stat3Label }
  ];
  document.querySelectorAll('.hero-stat').forEach((el, i) => {
    if (stats[i]) {
      const n = el.querySelector('.stat-number');
      const l = el.querySelector('.stat-label');
      if (n) { n.dataset.target = stats[i].num; n.textContent = '0'; }
      if (l) l.textContent = stats[i].label;
    }
  });

  // 7. Seções (Títulos & Subtítulos)
  const s = c.conteudo?.secoes;
  if (s) {
    setHTML('servicos-title', `${s.servicos?.titulo || ''}<br /><span class="highlight">${s.servicos?.destaque || ''}</span>`);
    setText('servicos-subtitle', s.servicos?.subtitulo);
    setHTML('sobre-title', `${s.sobre?.titulo || ''}<br /><span class="highlight">${s.sobre?.destaque || ''}</span>`);
    setText('sobre-anos-num', s.sobre?.anosExp);
    setText('sobre-anos-label', s.sobre?.anosLabel);
    setHTML('diferenciais-title', `${s.diferenciais?.titulo || ''}<br /><span class="highlight">${s.diferenciais?.destaque || ''}</span>`);
    setText('diferenciais-subtitle', s.diferenciais?.subtitulo);
    setHTML('depoimentos-title', `${s.depoimentos?.titulo || ''}<br /><span class="highlight">${s.depoimentos?.destaque || ''}</span>`);
    
    // Caminho corrigido para CTA (fora de secoes)
    setText('cta-titulo', c.conteudo?.cta?.titulo);
    setText('cta-descricao', c.conteudo?.cta?.descricao);
  }

  // 8. Renderizadores Dinâmicos
  renderTrustBar(c.trustBar || []);
  renderServicos(c.conteudo?.servicos || []);
  setHTML('sobre-p1', c.conteudo?.sobre?.p1);
  setHTML('sobre-p2', c.conteudo?.sobre?.p2);
  renderSobreLista(c.conteudo?.sobre?.lista || []);
  renderDiferenciais(c.conteudo?.diferenciais || []);
  renderDepoimentos(c.conteudo?.depoimentos || []);

  // 9. Contatos & Rodapé
  const tel = c.empresa?.telefone;
  const email = c.empresa?.email;
  const area = c.empresa?.area;
  const hr = c.empresa?.horario;

  ['contact-telefone', 'contact-telefone2', 'footer-telefone', 'nav-phone-number', 'contact-whatsapp-num'].forEach(id => setText(id, tel));
  ['contact-email', 'footer-email'].forEach(id => setText(id, email));
  ['contact-area', 'footer-area'].forEach(id => setText(id, area));
  ['contact-horario', 'footer-horario'].forEach(id => setText(id, hr));
  if (c.seo?.description) setText('footer-desc', c.seo.description);
}

/* ─── Renderizadores ────────────────────────────────────────────────── */
function renderTrustBar(items) {
  const container = document.getElementById('trust-inner');
  if (!container) return;
  container.innerHTML = items.map(item => `
    <div class="trust-item">
      <span class="icon">${item.icon}</span>
      <span>${escHtml(item.texto)}</span>
    </div>
  `).join('');
}

function renderServicos(servicos) {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  const corMap = { blue:'icon-blue', emerald:'icon-emerald', indigo:'icon-indigo', amber:'icon-amber', purple:'icon-purple' };
  grid.innerHTML = servicos.map((s, i) => `
    <article class="service-card reveal" aria-labelledby="svc-${i}">
      <div class="service-icon-wrap ${corMap[s.cor] || 'icon-blue'}">${s.icon}</div>
      <h3 id="svc-${i}">${escHtml(s.titulo)}</h3>
      <p>${escHtml(s.descricao)}</p>
      <a href="#contato" class="service-link" aria-label="Solicitar ${escHtml(s.titulo)}">Solicitar orçamento →</a>
    </article>
  `).join('');
  // Re-observar novos elementos
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function renderSobreLista(lista) {
  const ul = document.getElementById('sobre-lista');
  if (!ul) return;
  ul.innerHTML = lista.map(item => `
    <li>
      <span class="check" aria-hidden="true">✓</span>
      <span>${item}</span>
    </li>
  `).join('');
}

function renderDiferenciais(items) {
  const grid = document.getElementById('features-grid');
  if (!grid) return;
  grid.innerHTML = items.map((f, i) => `
    <article class="feature-card reveal" aria-label="${escHtml(f.titulo)}">
      <div class="feature-num">${escHtml(f.num || String(i+1).padStart(2,'0'))}</div>
      <h3>${escHtml(f.titulo)}</h3>
      <p>${escHtml(f.descricao)}</p>
    </article>
  `).join('');
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function renderDepoimentos(items) {
  const grid = document.getElementById('testimonials-grid');
  if (!grid) return;
  grid.innerHTML = items.map((d, i) => `
    <article class="testimonial-card reveal" aria-label="Depoimento de ${escHtml(d.nome)}">
      <div class="stars" aria-label="5 estrelas">
        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
      </div>
      <p>"${escHtml(d.texto)}"</p>
      <div class="testimonial-author">
        <div class="author-avatar" style="background:${d.cor}22;color:${d.cor}">${escHtml(d.iniciais)}</div>
        <div>
          <div class="author-name">${escHtml(d.nome)}</div>
          <div class="author-city">${escHtml(d.cidade)}</div>
        </div>
      </div>
    </article>
  `).join('');
  grid.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function escHtml(str = '') {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
}

/* ─── Navbar scroll ─────────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
function updateNavbar() {
  if (window.scrollY > 40) {
    navbar.classList.remove('transparent');
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.add('transparent');
    navbar.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

/* ─── Parallax hero ─────────────────────────────────────────────────── */
const heroBg = document.getElementById('heroBg');
window.addEventListener('scroll', () => {
  if (heroBg) heroBg.style.transform = `translateY(${window.scrollY * 0.35}px) scale(1.05)`;
}, { passive: true });
window.addEventListener('load', () => { if (heroBg) heroBg.classList.add('loaded'); });

/* ─── Menu Mobile ───────────────────────────────────────────────────── */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu   = document.getElementById('mobileMenu');

if (hamburgerBtn && mobileMenu) {

  const toggleMenu = () => {
    const isOpen = mobileMenu.classList.contains('open');

    if (isOpen) {
      // FECHAR
      mobileMenu.classList.remove('open');
      hamburgerBtn.classList.remove('active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    } else {
      // ABRIR
      mobileMenu.classList.add('open');
      hamburgerBtn.classList.add('active');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }
  };

  hamburgerBtn.addEventListener('click', toggleMenu);

  // Fecha ao clicar em link
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburgerBtn.classList.remove('active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Fecha clicando fora (melhoria profissional)
  document.addEventListener('click', (e) => {
    if (
      mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburgerBtn.contains(e.target)
    ) {
      mobileMenu.classList.remove('open');
      hamburgerBtn.classList.remove('active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* ─── Smooth scroll ─────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 80;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - headerH, behavior: 'smooth' });
    }
  });
});

/* ─── Intersection Observer (Reveal) ───────────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => entry.target.classList.add('visible'), delay);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.services-grid .service-card, .features-grid .feature-card, .testimonials-grid .testimonial-card').forEach((card, i) => {
  card.dataset.delay = (i % 3) * 100;
});
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─── Contador animado no Hero ──────────────────────────────────────── */
const statNumbers = document.querySelectorAll('.stat-number[data-target]');

function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.textContent.includes('%') ? '%' : (target >= 100 ? '+' : '');
  const duration = 2000;
  const steps    = 60;
  const inc      = target / steps;
  let frame = 0;
  const timer = setInterval(() => {
    frame++;
    const current = Math.min(Math.round(inc * frame), target);
    el.textContent = current.toLocaleString('pt-BR') + suffix;
    if (frame >= steps) clearInterval(timer);
  }, duration / steps);
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-number[data-target]').forEach(animateCounter);
      heroObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

/* ─── Formulário de contato ─────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const submitBtn   = document.getElementById('form-submit-btn');
const btnText     = document.getElementById('btnText');

function servicoLabel(val) {
  const map = {
    instalacao:  'Instalação de Ar Condicionado',
    limpeza:     'Limpeza e Higienização',
    gas:         'Carga de Gás',
    preventiva:  'Manutenção Preventiva',
    reparatoria: 'Manutenção Reparatória',
    orcamento:   'Orçamento',
  };
  return map[val] || val;
}

function simulateRequest(ms) { return new Promise(r => setTimeout(r, ms)); }

if (contactForm) {
  const telefoneInput = document.getElementById('telefone');
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      if (v.length > 6)  v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
      else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
      else if (v.length > 0) v = `(${v}`;
      e.target.value = v;
    });
  }

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome    = document.getElementById('nome').value.trim();
    const telefone= document.getElementById('telefone').value.trim();
    const servico = document.getElementById('servico').value;

    if (!nome || !telefone || !servico) {
      showToast('Por favor, preencha os campos obrigatórios.');
      return;
    }

    submitBtn.disabled = true;
    btnText.textContent = '⏳ Enviando...';

    try {
      const pedido = {
        id:       Date.now().toString(36) + Math.random().toString(36).slice(2),
        nome,
        telefone,
        email:    document.getElementById('email').value.trim(),
        servico:  servicoLabel(servico),
        mensagem: document.getElementById('mensagem').value.trim(),
        status:   'novo',
        data:     new Date().toISOString(),
        origem:   'site',
      };

      if (!window.Persistence?.createOrcamento) {
        throw new Error('Persistência remota indisponível.');
      }

      await window.Persistence.createOrcamento(pedido);
    } catch(err) {
      submitBtn.disabled = false;
      btnText.textContent = 'Solicitar Orçamento';
      showToast('Não foi possível salvar no banco de dados. Tente novamente.');
      return;
    }

    await simulateRequest(700);

    // Abre WhatsApp com os dados preenchidos
    const c = getSiteContent();
    const mensagem = document.getElementById('mensagem').value.trim();
    const msg = `Olá! Me chamo *${nome}*.%0A` +
                `📱 Telefone: ${telefone}%0A` +
                `🛠️ Serviço: ${servicoLabel(servico)}%0A` +
                (mensagem ? `💬 ${mensagem}` : '');
    contactForm.style.display = 'none';
    if (formSuccess) formSuccess.style.display = 'block';
    setTimeout(() => {
      const cleanWa = c.empresa.whatsapp.replace(/\D/g,'');
      window.open(`https://wa.me/${cleanWa}?text=${msg}`, '_blank');
    }, 800);
  });
}

function showToast(msg) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.textContent = msg;
  toast.style.cssText = `position:fixed;bottom:100px;right:28px;background:#06b6d4;color:#fff;padding:14px 24px;border-radius:12px;font-size:.9rem;font-weight:600;font-family:'Inter',sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.2);z-index:9999;animation:fadeInUp .3s ease;`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity .3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}

/* ─── Destaque do link ativo no scroll ──────────────────────────────── */
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${id}` ? '#fff' : 'rgba(255,255,255,.85)';
      });
    }
  });
}, { threshold: 0.35 });
sections.forEach(s => sectionObs.observe(s));

/* ─── Inicialização ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (window.Persistence?.initPublic) {
    await window.Persistence.initPublic();
  }
  const siteContent = getSiteContent();
  applySiteContent();
  initTracking(siteContent);
});

/* ─── TRACKING & MARKETING (Meta Pixel & Google Tag) ────────────────── */
function initTracking(content) {
  if (!content) return;
  const { metaPixelId, googleTagId } = content.marketing || {};

  // 1. Meta Pixel (código base oficial da Meta — inserido no <head>)
  if (metaPixelId && metaPixelId.trim() !== '') {
    const pid = metaPixelId.trim();
    if (!window._fbqLoaded) {
      window._fbqLoaded = true;
      /* Script principal — inserido no <head> conforme instruções da Meta */
      const t = document.createElement('script');
      t.async = true;
      t.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(t);

      window.fbq = window.fbq || function() {
        (window.fbq.q = window.fbq.q || []).push(arguments);
      };
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue  = window.fbq.queue || [];
      window._fbq = window.fbq;

      fbq('init', pid);
      fbq('track', 'PageView');

      /* <noscript> — fallback para usuários sem JavaScript */
      const ns = document.createElement('noscript');
      ns.innerHTML = `<img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=${pid}&ev=PageView&noscript=1" />`;
      document.head.appendChild(ns);

      console.log('📡 Meta Pixel ativo:', pid);
    }
  }

  // 2. Google Tag (Ads/Analytics)
  if (googleTagId && googleTagId.trim() !== '') {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${googleTagId.trim()}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', googleTagId.trim());
    console.log('📡 Google Tag ativa:', googleTagId);
  }
}

/* ─── Atualização em tempo real vinda do painel admin ──────────────── */
window.addEventListener('storage', (e) => {
  if (e.key === STORE_KEY) applySiteContent();
  if (e.key === 'climamax_comentarios') renderComentarios();
});

/* Canal de broadcast para abas na mesma origem (complementa o storage) */
if (typeof BroadcastChannel !== 'undefined') {
  const siteChannel = new BroadcastChannel('thermatis_site_update');
  siteChannel.addEventListener('message', (e) => {
    if (e.data === 'refresh') applySiteContent();
    if (e.data === 'comentarios_update') renderComentarios();
  });
}

/* ─────────────────────────────────────────────────────────────────────
   COMENTÁRIOS — Exibição e envio
   ───────────────────────────────────────────────────────────────────── */
async function renderComentarios() {
  const container = document.getElementById('comentarios-lista');
  if (!container) return;

  try {
    const res = await fetch('/api/comentarios');
    const json = await res.json();
    const lista = Array.isArray(json?.data) ? json.data : [];

    if (!lista.length) {
      container.innerHTML = `
        <div class="comentarios-empty">
          <p>Seja o primeiro a deixar um comentário!</p>
        </div>`;
      return;
    }

    container.innerHTML = lista.map(c => {
      const iniciais = (c.nome || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const data = c.created_at
        ? new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        : '';
      return `
        <div class="comentario-card reveal">
          <div class="comentario-avatar">${iniciais}</div>
          <div class="comentario-body">
            <div class="comentario-header">
              <strong class="comentario-nome">${escHtmlPublic(c.nome)}</strong>
              ${data ? `<span class="comentario-data">${data}</span>` : ''}
            </div>
            <p class="comentario-texto">${escHtmlPublic(c.mensagem)}</p>
          </div>
        </div>`;
    }).join('');

    // Re-aplica observer de reveal para os novos cards
    container.querySelectorAll('.reveal').forEach(el => {
      if (typeof revealObserver !== 'undefined') revealObserver.observe(el);
    });
  } catch {
    container.innerHTML = '';
  }
}

function escHtmlPublic(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

(function setupComentarioForm() {
  const form    = document.getElementById('comentarioForm');
  const success = document.getElementById('comentarioSuccess');
  const btnText = document.getElementById('com-btn-text');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome     = document.getElementById('com-nome').value.trim();
    const email    = document.getElementById('com-email').value.trim();
    const mensagem = document.getElementById('com-mensagem').value.trim();

    if (!nome) {
      document.getElementById('com-nome').focus();
      return;
    }
    if (!mensagem) {
      document.getElementById('com-mensagem').focus();
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('com-email').focus();
      return;
    }

    btnText.textContent = '⏳ Enviando...';
    form.querySelector('button[type="submit"]').disabled = true;

    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, mensagem }),
      });

      if (!res.ok) throw new Error('Erro ao enviar');

      form.reset();
      form.style.display = 'none';
      success.style.display = 'block';

      /* Notifica o painel admin (mesma aba/browser) */
      if (typeof BroadcastChannel !== 'undefined') {
        try { new BroadcastChannel('thermatis_admin_update').postMessage('new_comment'); } catch {}
      }
    } catch {
      btnText.textContent = '💬 Enviar Comentário';
      form.querySelector('button[type="submit"]').disabled = false;
      alert('Não foi possível enviar o comentário. Tente novamente.');
    }
  });
})();

/* Carrega comentários ao iniciar */
document.addEventListener('DOMContentLoaded', () => {
  renderComentarios();
});
