'use strict';

const { json, readBody } = require('./_lib/http');
const { getStore, upsertStore } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const auth = requireAuth(req);
      const row = await getStore();
      const payload = row?.payload || null;
      if (!payload) return json(res, 200, { ok: true, data: null });
      if (auth) return json(res, 200, { ok: true, data: payload });
      const sanitized = { ...payload };
      delete sanitized.auth;
      return json(res, 200, { ok: true, data: sanitized });
    }

    if (req.method === 'PUT') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });
      const body = await readBody(req);
      const saved = await upsertStore(body.data || body);
      return json(res, 200, { ok: true, data: saved?.payload || body.data || body });
    }

    return json(res, 405, { error: 'Método não permitido.' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
};
