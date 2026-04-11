'use strict';

const { json, readBody } = require('./_lib/http');
const { listRows, replaceRows, insertRow } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

async function getBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  try {
    const raw = await readBody(req);
    if (!raw) return {};
    if (typeof raw === 'string') return JSON.parse(raw);
    return raw;
  } catch {
    return {};
  }
}

function toText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function buildOrcamento(input = {}) {
  return {
    id: toText(input.id) || `orc-${Date.now()}`,
    nome: toText(input.nome),
    telefone: toText(input.telefone),
    email: toText(input.email),
    servico: toText(input.servico),
    mensagem: toText(input.mensagem),
    status: toText(input.status) || 'novo',
    data: toText(input.data) || new Date().toISOString(),
    origem: toText(input.origem) || 'site'
  };
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const data = await listRows('orcamentos');
      return json(res, 200, { ok: true, data });
    }

    if (req.method === 'POST') {
      const body = await getBody(req);
      const source = body && typeof body === 'object' && body.data && typeof body.data === 'object'
        ? body.data
        : body;

      const payload = buildOrcamento(source);

      if (payload.nome === '') {
        return json(res, 400, {
          error: 'Campo obrigatório ausente: nome.',
          debugBody: body,
          debugPayload: payload
        });
      }

      const row = await insertRow('orcamentos', payload);

      return json(res, 201, {
        ok: true,
        data: row
      });
    }

    if (req.method === 'PUT') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const body = await getBody(req);
      const items = Array.isArray(body?.items)
        ? body.items.map(buildOrcamento)
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