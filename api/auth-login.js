'use strict';

const { json, readBody } = require('./_lib/http');
const { makeToken, validateAdmin } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const body = await readBody(req);
    const user = String(body.user || '').trim();
    const pass = String(body.pass || '').trim();

    if (!user || !pass) return json(res, 400, { error: 'Usuário e senha são obrigatórios.' });

    const ok = await validateAdmin(user, pass);
    if (!ok) return json(res, 401, { error: 'Credenciais inválidas.' });

    const token = makeToken({ user, exp: Date.now() + 1000 * 60 * 60 * 12 });
    return json(res, 200, { ok: true, token, user });
  } catch (error) {
    return json(res, 500, { error: error.message || 'Erro interno.' });
  }
};
