'use strict';

const { json, readBody } = require('./_lib/http');
const { listRows, replaceRows, insertRow } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

function normalizeOrcamento(input = {}) {
  return {
    id: input.id || `orc-${Date.now()}`,
    nome: input.nome ?? null,
    telefone: input.telefone ?? null,
    email: input.email ?? null,
    servico: input.servico ?? null,
    mensagem: input.mensagem ?? null,
    status: input.status || 'novo',
    data: input.data || new Date().toISOString(),
    origem: input.origem || 'site'
  };
}

async function getBody(req) {
  // Caso a Vercel já tenha parseado
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  // Caso venha como string
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  // Fallback manual
  try {
    const raw = await readBody(req);
    if (!raw) return {};
    if (typeof raw === 'string') return JSON.parse(raw);
    return raw;
  } catch {
    return {};
  }
}

module.exports = async (req, res) => {
  try {

    // ========================
    // GET
    // ========================
    if (req.method === 'GET') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const data = await listRows('orcamentos');
      return json(res, 200, { ok: true, data });
    }

    // ========================
    // POST
    // ========================
    if (req.method === 'POST') {

      const body = await getBody(req);
      console.log('BODY RECEBIDO:', body);

      const payload = normalizeOrcamento(body?.data || body || {});

      if (!payload.nome) {
        return json(res, 400, {
          error: 'Campo obrigatório ausente: nome.',
          debug: body
        });
      }

      const row = await insertRow('orcamentos', payload);

      return json(res, 201, {
        ok: true,
        data: row
      });
    }

    // ========================
    // PUT
    // ========================
    if (req.method === 'PUT') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const body = await getBody(req);

      const items = Array.isArray(body?.items)
        ? body.items.map(normalizeOrcamento)
        : [];

      const data = await replaceRows('orcamentos', items);

      return json(res, 200, { ok: true, data });
    }

    return json(res, 405, { error: 'Método não permitido.' });

  } catch (error) {
    console.error('ERRO API ORCAMENTOS:', error);
    return json(res, 500, {
      error: error.message || 'Erro interno.'
    });
  }
};