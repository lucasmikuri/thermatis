'use strict';
const { json, readBody } = require('./_lib/http');
const { listRows, replaceRows } = require('./_lib/supabase');
const { requireAuth } = require('./_lib/auth');

module.exports = async (req, res) => {
  try {
    const auth = requireAuth(req);
    if (!auth) return json(res, 401, { error: 'Não autorizado.' });
    if (req.method === 'GET') return json(res, 200, { ok: true, data: await listRows('clientes') });
    if (req.method === 'PUT') {
      const body = await readBody(req);
      return json(res, 200, { ok: true, data: await replaceRows('clientes', body.items || []) });
    }
    return json(res, 405, { error: 'Método não permitido.' });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
};
