'use strict';

const { json, readBody } = require('./_lib/http');
const { insertRow } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

/* Query direta — listRows genérico ordena por 'data' que não existe aqui */
async function sbComentarios(path, options = {}) {
  const { getRequiredEnv } = require('./_lib/config');
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const url = getRequiredEnv('SUPABASE_URL').replace(/\/$/, '');
  const res = await fetch(`${url}/rest/v1/comentarios${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  try {
    const raw = await readBody(req);
    if (!raw) return {};
    if (typeof raw === 'string') return JSON.parse(raw);
    return raw;
  } catch { return {}; }
}

function toText(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

const STATUS_ALLOWED = ['pendente', 'aprovado', 'rejeitado'];

module.exports = async (req, res) => {
  try {
    /* ── GET ─────────────────────────────────────────────────────────── */
    if (req.method === 'GET') {
      const auth = requireAuth(req);
      const rows = await sbComentarios('?select=*&order=created_at.asc.nullslast') || [];

      if (auth) {
        return json(res, 200, { ok: true, data: rows });
      }
      const aprovados = rows
        .filter(c => c.status === 'aprovado')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return json(res, 200, { ok: true, data: aprovados });
    }

    /* ── POST (novo comentário — público) ───────────────────────────── */
    if (req.method === 'POST') {
      const body = await getBody(req);
      const src = body?.data && typeof body.data === 'object' ? body.data : body;

      const nome     = toText(src.nome);
      const email    = toText(src.email);
      const mensagem = toText(src.mensagem);

      if (!nome)     return json(res, 400, { error: 'Campo obrigatório: nome.' });
      if (!mensagem) return json(res, 400, { error: 'Campo obrigatório: mensagem.' });

      const payload = {
        id: `com-${Date.now()}`,
        nome, email, mensagem,
        status: 'pendente',
        created_at: new Date().toISOString(),
      };

      const row = await insertRow('comentarios', payload);
      return json(res, 201, { ok: true, data: row });
    }

    /* ── PATCH (aprovar / rejeitar — admin) ─────────────────────────── */
    if (req.method === 'PATCH') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const body   = await getBody(req);
      const id     = toText(body?.id);
      const status = toText(body?.status);

      if (!id)                          return json(res, 400, { error: 'Campo obrigatório: id.' });
      if (!STATUS_ALLOWED.includes(status)) return json(res, 400, { error: 'Status inválido.' });

      const rows = await sbComentarios(`?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      return json(res, 200, { ok: true, data: rows?.[0] || null });
    }

    /* ── DELETE (excluir — admin) ────────────────────────────────────── */
    if (req.method === 'DELETE') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const body = await getBody(req);
      const id   = toText(body?.id) || toText(req.query?.id);

      if (!id) return json(res, 400, { error: 'Campo obrigatório: id.' });

      await sbComentarios(`?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Método não permitido.' });
  } catch (error) {
    console.error('ERRO API COMENTARIOS:', error);
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
};
