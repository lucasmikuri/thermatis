'use strict';

const crypto = require('crypto');
const { getEnv } = require('./config');
const { getStore } = require('./supabase');

const DEFAULT_AUTH = { user: 'admin', pass: '123456' };

function getSecret() {
  return getEnv('ADMIN_TOKEN_SECRET', 'troque-esta-chave-em-producao');
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(data) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

function makeToken(payload) {
  const encoded = b64url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = sign(encoded);
  if (signature !== expected) return null;
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  if (!payload?.exp || Date.now() > payload.exp) return null;
  return payload;
}

async function getAdminCredentials() {
  const storeRow = await getStore().catch(() => null);
  const auth = storeRow?.payload?.auth;
  return {
    user: auth?.user || getEnv('ADMIN_DEFAULT_USER', DEFAULT_AUTH.user),
    pass: auth?.pass || getEnv('ADMIN_DEFAULT_PASS', DEFAULT_AUTH.pass),
  };
}

async function validateAdmin(user, pass) {
  const auth = await getAdminCredentials();
  return user === auth.user && pass === auth.pass;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireAuth(req) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  return payload;
}

module.exports = { makeToken, validateAdmin, requireAuth };
