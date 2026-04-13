/* =====================================================================
   admin.js — THERMATIS Climatização — Painel Administrativo
   Toda a lógica: auth, navegação, CRUD, gráfico, calendário
   ===================================================================== */
'use strict';

/* ─────────────────────────────────────────────────────────────────────
   ESTADO GLOBAL
   ───────────────────────────────────────────────────────────────────── */
const DB = {
  get: (key, def = []) => {
    try { return JSON.parse(localStorage.getItem('climamax_' + key)) ?? def; }
    catch { return def; }
  },
  set: (key, value) => localStorage.setItem('climamax_' + key, JSON.stringify(value)),
};

/* ─── Helpers para sessionStorage REAL (antes da sobrescrita do persistence.js) ─── */
const _ss = window._ss || {
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} },
  get: (k)    => { try { return sessionStorage.getItem(k); } catch { return null; } },
  del: (k)    => { try { sessionStorage.removeItem(k); } catch {} },
};

const AUTH = {
  isLogged: () => {
    /* Lê do sessionStorage REAL — persiste em reloads (F5) */
    return _ss.get('climamax_logged') === '1' && !!_ss.get('thermatis_admin_token');
  },
  login: (token, user = 'Administrador') => {
    if (token) {
      _ss.set('thermatis_admin_token', token);
      /* Também coloca na memória do persistence.js para que
         getAdminToken() funcione durante a sessão atual */
      sessionStorage.setItem('thermatis_admin_token', token);
    }
    _ss.set('climamax_logged', '1');
    _ss.set('thermatis_admin_user', user);
    sessionStorage.setItem('climamax_logged', '1');
    sessionStorage.setItem('thermatis_admin_user', user);
  },
  logout: () => {
    _ss.del('climamax_logged');
    _ss.del('thermatis_admin_token');
    _ss.del('thermatis_admin_user');
    sessionStorage.removeItem('climamax_logged');
    sessionStorage.removeItem('thermatis_admin_token');
    sessionStorage.removeItem('thermatis_admin_user');
    location.reload();
  },
};

let currentPage    = 'dashboard';
let calDate        = new Date();
let selectedDay    = null;
let deleteCallback = null;
let editingOrcId   = null;

/* ─────────────────────────────────────────────────────────────────────
   INICIALIZAÇÃO
   ───────────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  if (AUTH.isLogged()) {
    await showApp();
  } else {
    document.getElementById('login-page').style.display = 'flex';
  }

  setupLogin();
  setupTogglePass();
});

async function showApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').classList.add('active');

  /* Restaura token para a memória do persistence.js (caso venha do sessionStorage real após reload) */
  const savedToken = _ss.get('thermatis_admin_token');
  const savedUser  = _ss.get('thermatis_admin_user');
  if (savedToken) sessionStorage.setItem('thermatis_admin_token', savedToken);
  if (savedUser)  sessionStorage.setItem('thermatis_admin_user', savedUser);

  if (window.Persistence?.initAdmin) {
    await window.Persistence.initAdmin();
  }

  const userName = _ss.get('thermatis_admin_user') || sessionStorage.getItem('thermatis_admin_user') || 'Administrador';
  const userNameEl = document.getElementById('userName');
  const dashGreetEl = document.getElementById('dashGreet');
  const userAvatarEl = document.getElementById('userAvatar');
  if (userNameEl) userNameEl.textContent = userName;
  if (dashGreetEl) dashGreetEl.textContent = userName;
  if (userAvatarEl) userAvatarEl.textContent = getInitials(userName || 'Administrador').slice(0,2) || 'AD';

  setupNav();
  setupSidebar();
  setupLogout();
  setupModals();
  setupOrcamentos();
  setupClientes();
  setupAgenda();
  setupComentarios();
  setupDashboard();
  updateBadge();
  setupNotifications();

  // Pré-popula dados de demonstração apenas no modo local
  if (!window.Persistence?.state?.remoteConfigured) {
    seedDemoData();
  }
}

/* ─────────────────────────────────────────────────────────────────────
   LOGIN
   ───────────────────────────────────────────────────────────────────── */
function setupLogin() {
  const form  = document.getElementById('loginForm');
  const error = document.getElementById('loginError');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    try {
      document.getElementById('loginBtn').textContent = '⏳ Entrando...';
      if (window.Persistence?.login) {
        const result = await window.Persistence.login(user, pass);
        AUTH.login(result.token, result.user || user);
      } else {
        throw new Error('Persistência não carregada.');
      }
      document.getElementById('loginBtn').textContent = '✅ Entrando...';
      await showApp();
    } catch (err) {
      error.classList.add('show');
      document.getElementById('loginPass').value = '';
      document.getElementById('loginPass').focus();
      document.getElementById('loginBtn').textContent = '🔐 Entrar no Painel';
      setTimeout(() => error.classList.remove('show'), 3000);
    }
  });
}

function setupTogglePass() {
  const toggle = document.getElementById('togglePass');
  const input  = document.getElementById('loginPass');
  if (!toggle || !input) return;
  toggle.addEventListener('click', () => {
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    toggle.textContent = isPass ? '🙈' : '👁️';
  });
}

/* ─────────────────────────────────────────────────────────────────────
   NAVEGAÇÃO (SPA)
   ───────────────────────────────────────────────────────────────────── */
function setupNav() {
  document.querySelectorAll('[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') navigateTo(item.dataset.page);
    });
  });
}

function navigateTo(pageId) {
  // Atualiza nav items
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`[data-page="${pageId}"]`);
  if (activeItem) activeItem.classList.add('active');

  // Se for a página de gestão, injeta/carrega ANTES de tentar mostrar
  if (pageId === 'global-settings' && typeof loadGlobalForm === 'function') {
    loadGlobalForm();
  }

  // Atualiza páginas (Visibilidade)
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Breadcrumb Labels
  const labels = {
    dashboard: 'Dashboard',
    orcamentos: 'Orçamentos',
    agenda: 'Agenda',
    clientes: 'Clientes',
    comentarios: 'Comentários',
    'global-settings': 'Gestão do Site',
  };
  const bc = document.getElementById('breadcrumbLabel');
  if (bc) bc.textContent = labels[pageId] || pageId;

  currentPage = pageId;

  // Fecha sidebar no mobile
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    sidebar.classList.remove('mobile-open');
    document.body.classList.remove('sidebar-open');
  }

  // Atualiza seção específica
  if (pageId === 'dashboard')   setupDashboard();
  if (pageId === 'agenda')      renderCalendar();
  if (pageId === 'comentarios') loadComentariosRemote().then(() => { updateBadgeComentarios(); window._renderComentariosAdmin?.(); });
  if (pageId === 'conteudo' && typeof loadConteudoForm === 'function') setTimeout(loadConteudoForm, 80);
}

/* ─────────────────────────────────────────────────────────────────────
   SIDEBAR
   ───────────────────────────────────────────────────────────────────── */
/* function setupSidebar() {
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  toggle.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle('mobile-open');
      sidebar.classList.remove('collapsed');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });
} */

  /* ─────────────────────────────────────────────────────────────────────
   SIDEBAR (FIX MOBILE + DESKTOP)
   ───────────────────────────────────────────────────────────────────── */
function setupSidebar() {
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');

  if (!toggle || !sidebar) return;

  const isMobile = () => window.innerWidth <= 768;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();

    if (isMobile()) {
      const opened = sidebar.classList.toggle('mobile-open');
      document.body.classList.toggle('sidebar-open', opened);
      sidebar.classList.remove('collapsed');
    } else {
      sidebar.classList.toggle('collapsed');
    }
  });

  // 🔥 FECHAR AO CLICAR FORA
  document.addEventListener('click', (e) => {
    if (!isMobile()) return;

    const clicouDentro = sidebar.contains(e.target);
    const clicouBotao  = toggle.contains(e.target);

    if (!clicouDentro && !clicouBotao) {
      sidebar.classList.remove('mobile-open');
      document.body.classList.remove('sidebar-open');
    }
  });

  // 🔥 RESET AO REDIMENSIONAR
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      sidebar.classList.remove('mobile-open');
      document.body.classList.remove('sidebar-open');
    }
  });
}

function setupLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja sair?')) AUTH.logout();
  });
}

/* ─────────────────────────────────────────────────────────────────────
   MODAIS
   ───────────────────────────────────────────────────────────────────── */
function setupModals() {
  // Fecha ao clicar no overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Botões de fechar
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    }
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

/* ─────────────────────────────────────────────────────────────────────
   DASHBOARD
   ───────────────────────────────────────────────────────────────────── */
function setupDashboard() {
  // Data/hora
  const now = new Date();
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  const dateEl = document.getElementById('dashDate');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('pt-BR', opts);

  // KPIs
  const orcamentos = DB.get('orcamentos', []);
  const clientes   = DB.get('clientes', []);

  const total   = orcamentos.length;
  const pendente = orcamentos.filter(o => o.status === 'novo' || o.status === 'atendendo').length;
  const concluido = orcamentos.filter(o => o.status === 'concluido').length;

  animateKPI('kpiTotal', total);
  animateKPI('kpiPendente', pendente);
  animateKPI('kpiConcluido', concluido);
  animateKPI('kpiClientes', clientes.length);

  // Últimos pedidos
  renderRecentList(orcamentos.slice(-5).reverse());

  // Gráfico
  renderChart(orcamentos);

  // Botão novo orçamento no dashboard
  document.getElementById('btnNovoOrcamento')?.addEventListener('click', openNovoOrcamento);
}

function animateKPI(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  let current = 0;
  const steps = 30;
  const inc = target / steps;
  let frame = 0;
  const t = setInterval(() => {
    frame++;
    current = Math.min(Math.round(inc * frame), target);
    el.textContent = current;
    if (frame >= steps) clearInterval(t);
  }, 30);
}

function renderRecentList(items) {
  const container = document.getElementById('recentList');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">📭</div>
      <h3>Nenhum pedido ainda</h3>
      <p>Os pedidos do formulário aparecem aqui.</p>
    </div>`;
    return;
  }

  const colors = ['#06b6d4','#6366f1','#10b981','#f59e0b','#a855f7'];
  container.innerHTML = items.map((o, i) => `
    <div class="recent-item" onclick="openOrcamentoModal('${o.id}')">
      <div class="recent-avatar" style="background:${colors[i % colors.length]}22;color:${colors[i % colors.length]}">
        ${getInitials(o.nome)}
      </div>
      <div class="recent-info">
        <div class="recent-name">${o.nome}</div>
        <div class="recent-service">${o.servico}</div>
      </div>
      <span class="badge badge-${o.status}">${statusLabel(o.status)}</span>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────────────────────────────
   GRÁFICO (Canvas API puro)
   ───────────────────────────────────────────────────────────────────── */
function renderChart(orcamentos) {
  const canvas = document.getElementById('chartCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Últimos 7 dias
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push(d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }));
    counts.push(orcamentos.filter(o => o.data && o.data.startsWith(key)).length);
  }

  // Responsivo
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = 220;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  const padL = 40, padR = 20, padT = 20, padB = 40;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const maxVal = Math.max(...counts, 1);
  const barW   = (chartW / days.length) * 0.55;
  const gap    = chartW / days.length;

  ctx.clearRect(0, 0, w, h);

  // Linhas de grade
  ctx.strokeStyle = 'rgba(255,255,255,.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(w - padR, y);
    ctx.stroke();
  }

  // Barras
  days.forEach((label, i) => {
    const x    = padL + gap * i + (gap - barW) / 2;
    const barH = counts[i] > 0 ? (counts[i] / maxVal) * chartH : 0;
    const y    = padT + chartH - barH;

    // Gradiente
    const grad = ctx.createLinearGradient(x, y, x, padT + chartH);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(1, 'rgba(6,182,212,.1)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    const radius = Math.min(6, barW / 2);
    ctx.roundRect(x, y, barW, barH, [radius, radius, 0, 0]);
    ctx.fill();

    // Valor acima da barra
    if (counts[i] > 0) {
      ctx.fillStyle = '#06b6d4';
      ctx.font = `bold ${11 * dpr / dpr}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(counts[i], x + barW / 2, y - 6);
    }

    // Label eixo X
    ctx.fillStyle = 'rgba(100,116,139,1)';
    ctx.font = `${11 * dpr / dpr}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + barW / 2, h - 8);
  });
}

/* ─────────────────────────────────────────────────────────────────────
   ORÇAMENTOS
   ───────────────────────────────────────────────────────────────────── */
function setupOrcamentos() {
  let activeFilter = 'todos';
  let searchTerm   = '';

  const renderTable = () => {
    let data = DB.get('orcamentos', []);

    if (activeFilter !== 'todos') data = data.filter(o => o.status === activeFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(o =>
        o.nome?.toLowerCase().includes(q) ||
        o.servico?.toLowerCase().includes(q) ||
        o.telefone?.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('tabelaOrcamentos');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>Nenhum orçamento encontrado</h3>
          <p>Tente alterar os filtros ou busca.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.slice().reverse().map((o, idx) => `
      <tr>
        <td class="td-date">#${String(idx + 1).padStart(3,'0')}</td>
        <td>
          <div class="td-name">${escHtml(o.nome)}</div>
          <div class="td-phone">${escHtml(o.telefone || '—')}</div>
        </td>
        <td>${escHtml(o.servico)}</td>
        <td><span class="badge badge-${o.status}">${statusLabel(o.status)}</span></td>
        <td class="td-date">${formatDate(o.data)}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="action-btn action-btn-view" onclick="openOrcamentoModal('${o.id}')" title="Ver / Editar">👁️</button>
            <button class="action-btn action-btn-delete" onclick="confirmDelete('orcamento','${o.id}')" title="Excluir">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  // Filtros
  document.getElementById('filterTabs')?.addEventListener('click', (e) => {
    const tab = e.target.closest('.filter-tab');
    if (!tab) return;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeFilter = tab.dataset.filter;
    renderTable();
  });

  // Busca
  document.getElementById('searchOrcamentos')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderTable();
  });

  // Botões de novo orçamento
  document.getElementById('btnNovoOrcamento2')?.addEventListener('click', openNovoOrcamento);

  // Salvar edição
  document.getElementById('btnSalvarOrcamento')?.addEventListener('click', saveOrcamentoEdit);

  // Criar novo orçamento
  document.getElementById('btnConfirmarNovoOrcamento')?.addEventListener('click', createNovoOrcamento);

  // Atualiza tabela quando entrar na página
  const originalNavigateTo = window.navigateTo;
  document.querySelector('[data-page="orcamentos"]')?.addEventListener('click', renderTable);

  // Renderiza na inicialização
  renderTable();

  // Expõe para uso global
  window._renderOrcamentos = renderTable;
}

function openNovoOrcamento() {
  document.getElementById('formNovoOrcamento')?.reset();
  openModal('modalNovoOrcamento');
}

function createNovoOrcamento() {
  const nome    = document.getElementById('noNome').value.trim();
  const telefone= document.getElementById('noTelefone').value.trim();
  const email   = document.getElementById('noEmail').value.trim();
  const servico = document.getElementById('noServico').value;
  const mensagem= document.getElementById('noMensagem').value.trim();
  const status  = document.getElementById('noStatus').value;

  if (!nome || !telefone || !servico) {
    showToast('Preencha os campos obrigatórios.', 'error');
    return;
  }

  const orc = { id: uid(), nome, telefone, email, servico, mensagem, status, data: new Date().toISOString() };
  const lista = DB.get('orcamentos', []);
  lista.push(orc);
  DB.set('orcamentos', lista);

  closeModal('modalNovoOrcamento');
  window._renderOrcamentos?.();
  updateBadge();
  showToast('✅ Orçamento criado com sucesso!');
}

window.openOrcamentoModal = function(id) {
  const orcamentos = DB.get('orcamentos', []);
  const o = orcamentos.find(x => x.id === id);
  if (!o) return;
  editingOrcId = id;

  document.getElementById('modalOrcamentoTitle').textContent = `Orçamento — ${o.nome}`;
  document.getElementById('modalOrcamentoId').textContent = `ID: ${o.id.slice(0,8).toUpperCase()} · ${formatDate(o.data)}`;

  document.getElementById('modalOrcamentoBody').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><label>Nome</label><p>${escHtml(o.nome)}</p></div>
      <div class="detail-item"><label>Telefone</label>
        <p><a href="tel:${o.telefone}" style="color:var(--primary)">${escHtml(o.telefone || '—')}</a></p>
      </div>
      <div class="detail-item"><label>E-mail</label><p>${escHtml(o.email || '—')}</p></div>
      <div class="detail-item"><label>Serviço</label><p>${escHtml(o.servico)}</p></div>
    </div>
    ${o.mensagem ? `<div class="detail-mensagem">💬 ${escHtml(o.mensagem)}</div>` : ''}
    <div class="modal-form-group">
      <label class="form-label">Alterar Status</label>
      <select class="form-input" id="editStatus">
        ${['novo','atendendo','concluido','cancelado'].map(s =>
          `<option value="${s}" ${o.status===s?'selected':''}>${statusLabel(s)}</option>`
        ).join('')}
      </select>
    </div>
    <div class="modal-form-group">
      <label class="form-label">Observações Internas</label>
      <textarea class="form-input" id="editObs" rows="3">${escHtml(o.obs || '')}</textarea>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <a href="https://wa.me/${(o.telefone||'').replace(/\D/g,'')}" target="_blank" class="btn-primary-admin" style="font-size:.82rem;padding:8px 16px">📱 WhatsApp</a>
      ${o.telefone ? `<a href="tel:${o.telefone}" class="btn-primary-admin" style="font-size:.82rem;padding:8px 16px;background:linear-gradient(135deg,var(--green),#059669)">📞 Ligar</a>` : ''}
    </div>
  `;

  openModal('modalOrcamento');
};

function saveOrcamentoEdit() {
  if (!editingOrcId) return;
  const lista = DB.get('orcamentos', []);
  const idx = lista.findIndex(o => o.id === editingOrcId);
  if (idx === -1) return;

  lista[idx].status = document.getElementById('editStatus').value;
  lista[idx].obs    = document.getElementById('editObs').value;
  DB.set('orcamentos', lista);

  closeModal('modalOrcamento');
  window._renderOrcamentos?.();
  updateBadge();
  setupDashboard();
  showToast('✅ Orçamento atualizado!');
}

/* ─────────────────────────────────────────────────────────────────────
   CLIENTES
   ───────────────────────────────────────────────────────────────────── */
function setupClientes() {
  let searchTerm = '';

  const render = () => {
    let data = DB.get('clientes', []);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(c =>
        c.nome?.toLowerCase().includes(q) ||
        c.telefone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>Nenhum cliente encontrado</h3>
          <p>Clique em "+ Novo Cliente" para adicionar.</p>
        </div>
      </td></tr>`;
      return;
    }

    const orcamentos = DB.get('orcamentos', []);
    tbody.innerHTML = data.slice().reverse().map((c, idx) => {
      const totalServicos = orcamentos.filter(o => o.email === c.email || o.telefone === c.telefone).length;
      return `<tr>
        <td class="td-date">${idx + 1}</td>
        <td class="td-name">${escHtml(c.nome)}</td>
        <td class="td-phone">${escHtml(c.telefone || '—')}</td>
        <td class="td-phone">${escHtml(c.email || '—')}</td>
        <td><span class="badge badge-${totalServicos > 0 ? 'concluido' : 'novo'}">${totalServicos} serviço(s)</span></td>
        <td class="td-date">${formatDate(c.data)}</td>
        <td>
          <div style="display:flex;gap:4px;">
            <button class="action-btn action-btn-edit" onclick="editCliente('${c.id}')" title="Editar">✏️</button>
            <button class="action-btn action-btn-delete" onclick="confirmDelete('cliente','${c.id}')" title="Excluir">🗑️</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  };

  document.getElementById('searchClientes')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    render();
  });

  document.getElementById('btnNovoCliente')?.addEventListener('click', () => {
    document.getElementById('clienteId').value = '';
    document.getElementById('formCliente')?.reset();
    document.getElementById('modalClienteTitle').textContent = 'Novo Cliente';
    openModal('modalCliente');
  });

  document.getElementById('btnSalvarCliente')?.addEventListener('click', () => {
    const id   = document.getElementById('clienteId').value;
    const nome = document.getElementById('clNome').value.trim();
    const tel  = document.getElementById('clTelefone').value.trim();

    if (!nome || !tel) { showToast('Preencha nome e telefone.', 'error'); return; }

    const lista = DB.get('clientes', []);
    const cliente = {
      id:       id || uid(),
      nome,
      telefone: tel,
      email:    document.getElementById('clEmail').value.trim(),
      endereco: document.getElementById('clEndereco').value.trim(),
      obs:      document.getElementById('clObs').value.trim(),
      data:     new Date().toISOString(),
    };

    if (id) {
      const idx = lista.findIndex(c => c.id === id);
      if (idx !== -1) lista[idx] = { ...lista[idx], ...cliente };
    } else {
      lista.push(cliente);
    }

    DB.set('clientes', lista);
    closeModal('modalCliente');
    render();
    showToast('✅ Cliente salvo com sucesso!');
  });

  document.querySelector('[data-page="clientes"]')?.addEventListener('click', render);
  render();

  window._renderClientes = render;
}

window.editCliente = function(id) {
  const lista = DB.get('clientes', []);
  const c = lista.find(x => x.id === id);
  if (!c) return;

  document.getElementById('clienteId').value           = c.id;
  document.getElementById('clNome').value               = c.nome || '';
  document.getElementById('clTelefone').value           = c.telefone || '';
  document.getElementById('clEmail').value              = c.email || '';
  document.getElementById('clEndereco').value           = c.endereco || '';
  document.getElementById('clObs').value                = c.obs || '';
  document.getElementById('modalClienteTitle').textContent = 'Editar Cliente';
  openModal('modalCliente');
};

/* ─────────────────────────────────────────────────────────────────────
   AGENDA / CALENDÁRIO
   ───────────────────────────────────────────────────────────────────── */
function setupAgenda() {
  document.getElementById('calPrev')?.addEventListener('click', () => {
    calDate.setMonth(calDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('calNext')?.addEventListener('click', () => {
    calDate.setMonth(calDate.getMonth() + 1);
    renderCalendar();
  });
  document.getElementById('calToday')?.addEventListener('click', () => {
    calDate = new Date();
    renderCalendar();
  });

  document.getElementById('btnNovaVisita')?.addEventListener('click', () => {
    document.getElementById('visitaId').value = '';
    document.getElementById('formVisita')?.reset();

    // Pré-preenche a data selecionada
    if (selectedDay) {
      const d = new Date(calDate.getFullYear(), calDate.getMonth(), selectedDay);
      document.getElementById('vData').value = d.toISOString().split('T')[0];
    }

    document.getElementById('modalVisitaTitle').textContent = 'Agendar Visita';
    document.getElementById('btnExcluirVisita').style.display = 'none';
    openModal('modalVisita');
  });

  document.getElementById('btnExcluirVisita')?.addEventListener('click', () => {
    const id = document.getElementById('visitaId').value;
    if (id) {
      closeModal('modalVisita');
      window.confirmDelete('visita', id);
    }
  });

  document.getElementById('btnSalvarVisita')?.addEventListener('click', salvarVisita);

  document.querySelector('[data-page="agenda"]')?.addEventListener('click', renderCalendar);

  renderCalendar();
}

function renderCalendar() {
  const grid  = document.getElementById('calendarGrid');
  if (!grid) return;

  const hoje   = new Date();
  const year   = calDate.getFullYear();
  const month  = calDate.getMonth();
  const visitas = DB.get('visitas', []);

  document.getElementById('calMonthLabel').textContent =
    calDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays  = new Date(year, month, 0).getDate();

  grid.innerHTML = '';

  const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  for (let i = 0; i < total; i++) {
    let dayNum, isCurrentMonth = true;

    if (i < firstDay) {
      dayNum = prevDays - firstDay + 1 + i;
      isCurrentMonth = false;
    } else if (i >= firstDay + daysInMonth) {
      dayNum = i - firstDay - daysInMonth + 1;
      isCurrentMonth = false;
    } else {
      dayNum = i - firstDay + 1;
    }

    const isToday = isCurrentMonth &&
      dayNum === hoje.getDate() &&
      month  === hoje.getMonth() &&
      year   === hoje.getFullYear();

    const isSelected = isCurrentMonth && dayNum === selectedDay;

    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
    const hasEvent = isCurrentMonth && visitas.some(v => v.data === dateStr);

    const div = document.createElement('div');
    div.className = [
      'cal-day',
      !isCurrentMonth ? 'other-month' : '',
      isToday ? 'today' : '',
      isSelected ? 'selected' : '',
      hasEvent ? 'has-event' : '',
    ].filter(Boolean).join(' ');

    div.innerHTML = `<span class="cal-day-num">${dayNum}</span>`;

    if (isCurrentMonth) {
      div.addEventListener('click', () => {
        selectedDay = dayNum;
        const label = new Date(year, month, dayNum).toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
        document.getElementById('selectedDayLabel').textContent = label;
        renderDayVisits(dateStr);
        renderCalendar();
      });
    }

    grid.appendChild(div);
  }
}

function renderDayVisits(dateStr) {
  const container = document.getElementById('dayVisitsList');
  if (!container) return;

  const visitas = DB.get('visitas', []).filter(v => v.data === dateStr);

  if (!visitas.length) {
    container.innerHTML = `<div class="empty-state" style="padding:30px 20px">
      <div class="empty-icon">📅</div>
      <h3>Nenhuma visita</h3>
      <p>Nenhum agendamento para este dia.</p>
    </div>`;
    return;
  }

  visitas.sort((a, b) => a.hora?.localeCompare(b.hora));

  container.innerHTML = visitas.map(v => `
    <div class="day-visit-card" onclick="editVisita('${v.id}')">
      <div class="visit-time">⏰ ${v.hora || '—'}</div>
      <div class="visit-name">${escHtml(v.nome)}</div>
      <div class="visit-service">${escHtml(v.servico || '—')}</div>
      ${v.tecnico ? `<div class="visit-service">👤 ${escHtml(v.tecnico)}</div>` : ''}
    </div>
  `).join('') + `<button onclick="document.getElementById('btnNovaVisita').click()" style="width:100%;padding:10px;margin-top:12px;background:rgba(6,182,212,.1);border:1px dashed rgba(6,182,212,.3);border-radius:var(--radius-sm);color:var(--primary);font-size:.85rem;font-weight:600;cursor:pointer;">+ Adicionar Visita</button>`;
}

function salvarVisita() {
  const id      = document.getElementById('visitaId').value;
  const nome    = document.getElementById('vNome').value.trim();
  const data    = document.getElementById('vData').value;
  const hora    = document.getElementById('vHora').value;
  const servico = document.getElementById('vServico').value;
  const tecnico = document.getElementById('vTecnico').value.trim();
  const obs     = document.getElementById('vObs').value.trim();

  if (!nome || !data || !hora) { showToast('Preencha nome, data e hora.', 'error'); return; }

  const lista = DB.get('visitas', []);
  const visita = { id: id || uid(), nome, data, hora, servico, tecnico, obs };

  if (id) {
    const idx = lista.findIndex(v => v.id === id);
    if (idx !== -1) lista[idx] = visita;
  } else {
    lista.push(visita);
  }

  DB.set('visitas', lista);
  closeModal('modalVisita');
  renderCalendar();
  if (selectedDay) {
    const dateStr = `${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
    renderDayVisits(dateStr);
  }
  showToast('📅 Visita agendada com sucesso!');
}

window.editVisita = function(id) {
  const v = DB.get('visitas', []).find(x => x.id === id);
  if (!v) return;

  document.getElementById('visitaId').value  = v.id;
  document.getElementById('vNome').value     = v.nome || '';
  document.getElementById('vData').value     = v.data || '';
  document.getElementById('vHora').value     = v.hora || '';
  document.getElementById('vServico').value  = v.servico || '';
  document.getElementById('vTecnico').value  = v.tecnico || '';
  document.getElementById('vObs').value      = v.obs || '';
  
  document.getElementById('modalVisitaTitle').textContent = 'Editar Visita';
  document.getElementById('btnExcluirVisita').style.display = 'block';
  
  openModal('modalVisita');
};

/* ─────────────────────────────────────────────────────────────────────
   EXCLUSÃO (genérica)
   ───────────────────────────────────────────────────────────────────── */
window.confirmDelete = function(tipo, id) {
  const msgs = {
    orcamento: 'Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.',
    cliente:   'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
    visita:    'Tem certeza que deseja excluir esta visita?',
  };
  const msgEl = document.getElementById('modalConfirmMsg');
  if (msgEl) msgEl.textContent = msgs[tipo] || 'Confirmar exclusão?';
  openModal('modalConfirm');

  window._deleteCallback = () => {
    const keyMap = { orcamento: 'orcamentos', cliente: 'clientes', visita: 'visitas' };
    const key = keyMap[tipo];
    const lista = DB.get(key, []).filter(x => x.id !== id);
    DB.set(key, lista);

    closeModal('modalConfirm');
    showToast('🗑️ Excluído com sucesso!');

    if (tipo === 'orcamento') { window._renderOrcamentos?.(); updateBadge(); }
    if (tipo === 'cliente')   window._renderClientes?.();
    if (tipo === 'visita') { 
      renderCalendar(); 
      if (typeof selectedDay !== 'undefined' && selectedDay) {
        const dateStr = `${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
        renderDayVisits(dateStr);
      }
    }
    setupDashboard();
  };
};

document.getElementById('btnConfirmDelete')?.addEventListener('click', () => {
  if (window._deleteCallback) { window._deleteCallback(); window._deleteCallback = null; }
});

/* ─────────────────────────────────────────────────────────────────────
   BADGE (contador de novos pedidos)
   ───────────────────────────────────────────────────────────────────── */
function updateBadge() {
  const novos = DB.get('orcamentos', []).filter(o => o.status === 'novo');
  const count = novos.length;
  const badge = document.getElementById('badgeOrcamentos');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  // Notif dot na topbar
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = count > 0 ? 'block' : 'none';

  // Atualiza painel de notificações se estiver aberto ou para manter pronto
  renderNotifications(novos);
}

/* ─── Dropdown de Notificações ─── */
function toggleNotifDropdown() {
  const drop = document.getElementById('notifDropdown');
  if (drop) drop.classList.toggle('show');
}

window.closeNotifDropdown = function() {
  const drop = document.getElementById('notifDropdown');
  if (drop) drop.classList.remove('show');
};

function renderNotifications(novos) {
  const list = document.getElementById('notifList');
  const countHeader = document.getElementById('notifHeaderCount');
  if (!list) return;

  if (countHeader) countHeader.textContent = `${novos.length} novas`;

  if (novos.length === 0) {
    list.innerHTML = `
      <div class="notif-empty">
        <div class="notif-empty-icon">🔔</div>
        <p>Tudo em dia! Nenhuma notificação nova.</p>
      </div>
    `;
    return;
  }

  // Pega os 5 mais recentes
  const last5 = [...novos].sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0, 5);

  list.innerHTML = last5.map(n => `
    <div class="notif-item" onclick="viewNotif('${n.id}')">
      <div class="notif-item-icon">📄</div>
      <div class="notif-item-body">
        <div class="notif-item-title">${esc(n.nome)}</div>
        <div class="notif-item-text">${esc(n.servico)}</div>
        <span class="notif-item-time">${formatDate(n.data)}</span>
      </div>
    </div>
  `).join('');
}

window.viewNotif = function(id) {
  closeNotifDropdown();
  navigateTo('orcamentos');
  // Opcional: abrir o modal do pedido específico após um pequeno delay
  setTimeout(() => {
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) row.click();
  }, 300);
};

// Fechar ao clicar fora
document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.notif-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    closeNotifDropdown();
  }
});

function esc(s = '') { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function formatDate(d) {
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

function setupNotifications() {
  const btn = document.getElementById('notifBtn');
  if (!btn) return;
  
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotifDropdown();
  });
}

/* ─────────────────────────────────────────────────────────────────────
   DADOS DE DEMONSTRAÇÃO (seed)
   ───────────────────────────────────────────────────────────────────── */
function seedDemoData() {
  if (DB.get('seeded', false)) return;

  const hoje = new Date();
  const orcamentos = [
    { id: uid(), nome: 'Ana Paula Ferreira', telefone: '(65) 99100-1111', email: 'anapaula@email.com',
      servico: 'Limpeza e Higienização', status: 'novo',
      mensagem: 'Ar com cheiro ruim e sujo, preciso de limpeza.', data: subDays(0) },
    { id: uid(), nome: 'Marcos Rodrigues',   telefone: '(65) 99200-2222', email: 'marcos@empresa.com',
      servico: 'Instalação de Ar Condicionado', status: 'atendendo',
      mensagem: 'Instalar 3 splits na empresa.', data: subDays(1) },
    { id: uid(), nome: 'Juliana Castro',     telefone: '(65) 99300-3333', email: '',
      servico: 'Carga de Gás', status: 'concluido',
      mensagem: 'Ar não gelava mais.', data: subDays(3) },
    { id: uid(), nome: 'Ricardo Souza',      telefone: '(65) 99400-4444', email: 'ricardo@email.com',
      servico: 'Manutenção Preventiva', status: 'novo',
      mensagem: 'Manutenção semestral dos aparelhos.', data: subDays(0) },
    { id: uid(), nome: 'Fernanda Lima',      telefone: '(65) 99500-5555', email: '',
      servico: 'Manutenção Reparatória', status: 'novo',
      mensagem: 'Ar fazendo barulho estranho.', data: subDays(2) },
  ];

  const clientes = [
    { id: uid(), nome: 'Ana Paula Ferreira', telefone: '(65) 99100-1111', email: 'anapaula@email.com', endereco: 'Bairro Duque de Caxias, Cuiabá - MT',  obs: '',  data: subDays(15) },
    { id: uid(), nome: 'Marcos Rodrigues',   telefone: '(65) 99200-2222', email: 'marcos@empresa.com', endereco: 'Centro, Cuiabá - MT',                    obs: 'Empresa com 3 aparelhos', data: subDays(30) },
    { id: uid(), nome: 'Juliana Castro',     telefone: '(65) 99300-3333', email: '',                   endereco: 'CPA, Cuiabá - MT',                        obs: 'Contrato semestral', data: subDays(60) },
  ];

  // Visita de exemplo (amanhã)
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const visitas = [
    { id: uid(), nome: 'Marcos Rodrigues', data: amanha.toISOString().split('T')[0], hora: '09:00', servico: 'Instalação de Ar Condicionado', tecnico: 'Técnico THERMATIS', obs: 'Instalar 3 splits, levar suportes.' },
  ];

  DB.set('orcamentos', orcamentos);
  DB.set('clientes', clientes);
  DB.set('visitas', visitas);
  DB.set('seeded', true);

  window._renderOrcamentos?.();
  window._renderClientes?.();
  updateBadge();
  setupDashboard();
}

function subDays(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/* ─────────────────────────────────────────────────────────────────────
   TOAST
   ───────────────────────────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 3500);
}

/* ─────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function statusLabel(s) {
  const map = { novo:'🆕 Novo', atendendo:'⚡ Atendendo', concluido:'✅ Concluído', cancelado:'❌ Cancelado' };
  return map[s] || s;
}

function escHtml(str = '') {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─────────────────────────────────────────────────────────────────────
   INTEGRAÇÃO: recebe pedidos do formulário do site principal
   (o script.js do site salva em localStorage com a chave 'climamax_orcamentos')
   ───────────────────────────────────────────────────────────────────── */
window.addEventListener('storage', (e) => {
  if (e.key === 'climamax_orcamentos') {
    updateBadge();
    setupDashboard();
    window._renderOrcamentos?.();
  }
  if (e.key === 'climamax_comentarios') {
    updateBadgeComentarios();
    window._renderComentariosAdmin?.();
  }
});

/* Notificação em tempo real vinda do site público (mesma origem) */
if (typeof BroadcastChannel !== 'undefined') {
  try {
    const adminChannel = new BroadcastChannel('thermatis_admin_update');
    adminChannel.addEventListener('message', (e) => {
      if (e.data === 'new_comment') {
        loadComentariosRemote().then(() => {
          updateBadgeComentarios();
          window._renderComentariosAdmin?.();
        });
      }
    });
  } catch {}
}

/* ─────────────────────────────────────────────────────────────────────
   COMENTÁRIOS
   ───────────────────────────────────────────────────────────────────── */
function comentarioStatusLabel(s) {
  const map = { pendente: '⏳ Pendente', aprovado: '✅ Aprovado', rejeitado: '❌ Rejeitado' };
  return map[s] || s;
}

function updateBadgeComentarios() {
  const pendentes = DB.get('comentarios', []).filter(c => c.status === 'pendente').length;
  const badge = document.getElementById('badgeComentarios');
  if (!badge) return;
  if (pendentes > 0) {
    badge.textContent = pendentes;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

async function loadComentariosRemote() {
  /* Usa _ss.get (sessionStorage nativo real) — o Map do persistence.js
     pode estar vazio se chamado antes de initAdmin() terminar */
  const token = _ss.get('thermatis_admin_token') || sessionStorage.getItem('thermatis_admin_token') || '';
  try {
    const res = await fetch('/api/comentarios', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (Array.isArray(json?.data)) {
      DB.set('comentarios', json.data);
    }
  } catch {
    /* sem conexão — usa cache local */
  }
}

function setupComentarios() {
  /* Carrega dados remotos ao inicializar (não bloqueia o restante do painel) */
  loadComentariosRemote().then(() => {
    updateBadgeComentarios();
    window._renderComentariosAdmin?.();
  });

  let activeFilter = 'todos';
  let searchTerm   = '';

  const renderTable = () => {
    let data = DB.get('comentarios', [])
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (activeFilter !== 'todos') data = data.filter(c => c.status === activeFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter(c =>
        c.nome?.toLowerCase().includes(q) ||
        c.mensagem?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById('tabelaComentarios');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <h3>Nenhum comentário encontrado</h3>
          <p>Comentários enviados pelo site aparecerão aqui.</p>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((c, i) => `
      <tr>
        <td style="color:var(--text-2);font-size:.8rem">${i + 1}</td>
        <td>
          <div style="font-weight:600">${escHtml(c.nome)}</div>
          <div style="font-size:.78rem;color:var(--text-2)">${escHtml(c.email || '')}</div>
        </td>
        <td style="max-width:280px">
          <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px" title="${escHtml(c.mensagem)}">
            ${escHtml(c.mensagem)}
          </div>
        </td>
        <td><span class="badge badge-com-${c.status}">${comentarioStatusLabel(c.status)}</span></td>
        <td style="font-size:.82rem;color:var(--text-2)">${formatDate(c.created_at)}</td>
        <td>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn-action" title="Ver detalhes" onclick="openComentarioModal('${c.id}')">👁️</button>
            ${c.status !== 'aprovado'
              ? `<button class="btn-action" title="Aprovar" onclick="changeComentarioStatus('${c.id}','aprovado')" style="color:var(--green)">✅</button>`
              : ''}
            ${c.status !== 'rejeitado'
              ? `<button class="btn-action" title="Rejeitar" onclick="changeComentarioStatus('${c.id}','rejeitado')" style="color:var(--red,#ef4444)">❌</button>`
              : ''}
            <button class="btn-action" title="Excluir" onclick="deleteComentario('${c.id}')" style="color:var(--red,#ef4444)">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  window._renderComentariosAdmin = renderTable;

  // Botão atualizar
  document.getElementById('btnRefreshComentarios')?.addEventListener('click', () => {
    loadComentariosRemote().then(() => { updateBadgeComentarios(); renderTable(); });
  });

  // Filtros
  document.getElementById('filterTabsComentarios')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('#filterTabsComentarios .filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTable();
  });

  // Busca
  document.getElementById('searchComentarios')?.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderTable();
  });

  renderTable();
}

function openComentarioModal(id) {
  const comentario = DB.get('comentarios', []).find(c => c.id === id);
  if (!comentario) return;

  document.getElementById('modalComentarioId').textContent = `#${comentario.id}`;
  document.getElementById('modalComentarioBody').innerHTML = `
    <div style="padding:20px 24px;display:flex;flex-direction:column;gap:16px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Nome</div>
          <div style="font-weight:600">${escHtml(comentario.nome)}</div>
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">E-mail</div>
          <div>${escHtml(comentario.email || '—')}</div>
        </div>
      </div>
      <div>
        <div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Mensagem</div>
        <div style="background:var(--surface-2);border-radius:8px;padding:12px 16px;line-height:1.6;white-space:pre-wrap">${escHtml(comentario.mensagem)}</div>
      </div>
      <div style="display:flex;gap:16px;align-items:center">
        <div>
          <div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Status</div>
          <span class="badge badge-com-${comentario.status}">${comentarioStatusLabel(comentario.status)}</span>
        </div>
        <div>
          <div style="font-size:.75rem;color:var(--text-2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Enviado em</div>
          <div style="font-size:.88rem">${formatDate(comentario.created_at)}</div>
        </div>
      </div>
    </div>
  `;

  const btnAprovar  = document.getElementById('btnAprovarComentario');
  const btnRejeitar = document.getElementById('btnRejeitarComentario');

  btnAprovar.style.display  = comentario.status !== 'aprovado'  ? '' : 'none';
  btnRejeitar.style.display = comentario.status !== 'rejeitado' ? '' : 'none';

  // Remove listeners anteriores clonando
  const newAprovar  = btnAprovar.cloneNode(true);
  const newRejeitar = btnRejeitar.cloneNode(true);
  btnAprovar.replaceWith(newAprovar);
  btnRejeitar.replaceWith(newRejeitar);

  newAprovar.addEventListener('click', () => {
    changeComentarioStatus(comentario.id, 'aprovado');
    closeModal('modalComentario');
  });
  newRejeitar.addEventListener('click', () => {
    changeComentarioStatus(comentario.id, 'rejeitado');
    closeModal('modalComentario');
  });

  openModal('modalComentario');
}

function changeComentarioStatus(id, novoStatus) {
  const lista = DB.get('comentarios', []);
  const idx = lista.findIndex(c => c.id === id);
  if (idx === -1) return;

  lista[idx].status = novoStatus;
  DB.set('comentarios', lista);
  updateBadgeComentarios();
  window._renderComentariosAdmin?.();

  const label = novoStatus === 'aprovado' ? 'aprovado' : 'rejeitado';
  showToast(`Comentário ${label} com sucesso!`, 'success');
}

function deleteComentario(id) {
  if (!confirm('Excluir este comentário permanentemente?')) return;
  const lista = DB.get('comentarios', []).filter(c => c.id !== id);
  DB.set('comentarios', lista);
  updateBadgeComentarios();
  window._renderComentariosAdmin?.();
  showToast('Comentário excluído.', 'success');
}
