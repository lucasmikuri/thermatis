"use strict";

(function () {
  const memory = new Map();
  const relevantKeys = {
    thermatis_master_store: { endpoint: '/api/store', type: 'store' },
    climamax_orcamentos: { endpoint: '/api/orcamentos', type: 'collection' },
    climamax_clientes: { endpoint: '/api/clientes', type: 'collection' },
    climamax_visitas: { endpoint: '/api/visitas', type: 'collection' },
    climamax_comentarios: { endpoint: '/api/comentarios', type: 'collection' },
  };
  const syncTimers = new Map();

  const state = {
    remoteConfigured: false,
    publicReady: Promise.resolve(),
    adminReady: Promise.resolve(),
  };

  function seedMemory(key, value) {
    memory.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  function getAdminToken() {
    return sessionStorage.getItem('thermatis_admin_token') || '';
  }

  async function apiFetch(url, options = {}) {
    const token = getAdminToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch {}
    if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
    return data;
  }

  function installMemoryStorage() {
    const proto = Storage.prototype;
    proto.getItem = function (key) {
      return memory.has(String(key)) ? memory.get(String(key)) : null;
    };
    proto.setItem = function (key, value) {
      const keyStr = String(key);
      const valueStr = String(value);
      memory.set(keyStr, valueStr);
      queueSync(keyStr, valueStr);
    };
    proto.removeItem = function (key) {
      memory.delete(String(key));
    };
    proto.clear = function () {
      memory.clear();
    };
    proto.key = function (index) {
      return Array.from(memory.keys())[index] ?? null;
    };
    Object.defineProperty(proto, 'length', {
      configurable: true,
      get() { return memory.size; }
    });
  }

  async function initPublic() {
    try {
      const data = await apiFetch('/api/store', { method: 'GET' });
      if (data?.data) {
        seedMemory('thermatis_master_store', data.data);
        state.remoteConfigured = true;
      }
    } catch (error) {
      console.warn('Persistência remota indisponível no site público.', error.message);
    }
  }

  async function initAdmin() {
    try {
      const [storeRes, orcRes, cliRes, visRes, comRes] = await Promise.all([
        apiFetch('/api/store'),
        apiFetch('/api/orcamentos'),
        apiFetch('/api/clientes'),
        apiFetch('/api/visitas'),
        apiFetch('/api/comentarios'),
      ]);
      if (storeRes?.data) seedMemory('thermatis_master_store', storeRes.data);
      if (Array.isArray(orcRes?.data)) seedMemory('climamax_orcamentos', orcRes.data);
      if (Array.isArray(cliRes?.data)) seedMemory('climamax_clientes', cliRes.data);
      if (Array.isArray(visRes?.data)) seedMemory('climamax_visitas', visRes.data);
      if (Array.isArray(comRes?.data)) seedMemory('climamax_comentarios', comRes.data);
      state.remoteConfigured = true;
    } catch (error) {
      console.warn('Persistência remota indisponível no admin.', error.message);
      throw error;
    }
  }

  async function login(user, pass) {
    const data = await apiFetch('/api/auth-login', {
      method: 'POST',
      body: JSON.stringify({ user, pass }),
    });
    if (!data?.token) throw new Error('Falha no login.');
    sessionStorage.setItem('thermatis_admin_token', data.token);
    sessionStorage.setItem('climamax_logged', '1');
    sessionStorage.setItem('thermatis_admin_user', data.user || user);
    state.remoteConfigured = true;
    return data;
  }

  async function createOrcamento(pedido) {
    const data = await apiFetch('/api/orcamentos', {
      method: 'POST',
      body: JSON.stringify(pedido),
    });
    state.remoteConfigured = true;
    return data?.data || pedido;
  }

  async function createComentario(comentario) {
    const data = await apiFetch('/api/comentarios', {
      method: 'POST',
      body: JSON.stringify(comentario),
    });
    return data?.data || comentario;
  }

  function queueSync(key, rawValue) {
    const meta = relevantKeys[key];
    const token = getAdminToken();
    if (!meta || !token) return;

    clearTimeout(syncTimers.get(key));
    const timer = setTimeout(async () => {
      try {
        const parsed = JSON.parse(rawValue || 'null');
        if (meta.type === 'store') {
          await apiFetch(meta.endpoint, { method: 'PUT', body: JSON.stringify({ data: parsed }) });
        } else {
          await apiFetch(meta.endpoint, { method: 'PUT', body: JSON.stringify({ items: Array.isArray(parsed) ? parsed : [] }) });
        }
      } catch (error) {
        console.warn(`Falha ao sincronizar ${key}:`, error.message);
      }
    }, 200);
    syncTimers.set(key, timer);
  }

  installMemoryStorage();

  window.Persistence = {
    state,
    initPublic,
    initAdmin,
    login,
    createOrcamento,
    createComentario,
    seedMemory,
  };
})();
