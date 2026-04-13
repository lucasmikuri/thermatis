'use strict';

const { json, readBody } = require('./_lib/http');
const { listRows, replaceRows, insertRow } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

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

function toText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

const STATUS_ALLOWED = ['pendente', 'aprovado', 'rejeitado'];

function buildComentario(input = {}) {
  const status = STATUS_ALLOWED.includes(toText(input.status)) ? toText(input.status) : 'pendente';
  return {
    id: toText(input.id) || `com-${Date.now()}`,
    nome: toText(input.nome),
    email: toText(input.email),
    mensagem: toText(input.mensagem),
    status,
    created_at: toText(input.created_at) || new Date().toISOString(),
  };
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const auth = requireAuth(req);
      const rows = await listRows('comentarios');

      if (auth) {
        // Admin: retorna todos os comentários
        return json(res, 200, { ok: true, data: rows || [] });
      } else {
        // Público: apenas aprovados, mais recentes primeiro
        const aprovados = (rows || [])
          .filter(c => c.status === 'aprovado')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return json(res, 200, { ok: true, data: aprovados });
      }
    }

    if (req.method === 'POST') {
      const body = await getBody(req);
      const source = body?.data && typeof body.data === 'object' ? body.data : body;

      const payload = buildComentario({ ...source, status: 'pendente' });

      if (!payload.nome) {
        return json(res, 400, { error: 'Campo obrigatório ausente: nome.' });
      }
      if (!payload.mensagem) {
        return json(res, 400, { error: 'Campo obrigatório ausente: mensagem.' });
      }

      const row = await insertRow('comentarios', payload);
      return json(res, 201, { ok: true, data: row });
    }

    if (req.method === 'PUT') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const body = await getBody(req);
      const items = Array.isArray(body?.items)
        ? body.items.map(buildComentario)
        : [];

      const data = await replaceRows('comentarios', items);
      return json(res, 200, { ok: true, data });
    }

    return json(res, 405, { error: 'Método não permitido.' });
  } catch (error) {
    console.error('ERRO API COMENTARIOS:', error);
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
};
