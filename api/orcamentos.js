'use strict';
const { json, readBody } = require('./_lib/http');
const { listRows, replaceRows, insertRow } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });
      return json(res, 200, { ok: true, data: await listRows('orcamentos') });
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const row = await insertRow('orcamentos', body.data || body);
      return json(res, 201, { ok: true, data: row });
    }
    if (req.method === 'PUT') {
      const auth = requireAuth(req);
      if (!auth) return json(res, 401, { error: 'Não autorizado.' });
      const body = await readBody(req);
      return json(res, 200, { ok: true, data: await replaceRows('orcamentos', body.items || []) });
    }
    return json(res, 405, { error: 'Método não permitido.' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
};
