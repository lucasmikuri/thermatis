'use strict';
const { json } = require('./_lib/http');
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

async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  return await new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', chunk => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('JSON inválido no corpo da requisição.'));
      }
    });

    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });
      return json(res, 200, { ok: true, data: await listRows('orcamentos') });
    }

    if (req.method === 'POST') {
      const body = await parseRequestBody(req);
      const payload = normalizeOrcamento(body?.data || body || {});

      if (!payload.nome) {
        return json(res, 400, { error: 'Campo obrigatório ausente: nome.' });
      }

      const row = await insertRow('orcamentos', payload);
      return json(res, 201, { ok: true, data: row });
    }

    if (req.method === 'PUT') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });

      const body = await parseRequestBody(req);
      const items = Array.isArray(body?.items)
        ? body.items.map(normalizeOrcamento)
        : [];

      return json(res, 200, {
        ok: true,
        data: await replaceRows('orcamentos', items)
      });
    }

    return json(res, 405, { error: 'Método não permitido.' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
};