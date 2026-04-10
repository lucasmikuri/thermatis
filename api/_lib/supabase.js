'use strict';

const { getRequiredEnv } = require('./config');

function getBaseUrl() {
  const url = getRequiredEnv('SUPABASE_URL').replace(/\/$/, '');
  return `${url}/rest/v1`;
}

function getHeaders(prefer = '') {
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function sbFetch(path, options = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
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

async function getStore() {
  const rows = await sbFetch(`/app_store?id=eq.main&select=*`);
  return rows?.[0] || null;
}

async function upsertStore(payload) {
  const body = [{ id: 'main', payload, updated_at: new Date().toISOString() }];
  const rows = await sbFetch(`/app_store?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(body),
  });
  return rows?.[0] || null;
}

async function listRows(table) {
  return await sbFetch(`/${table}?select=*&order=created_at.asc.nullslast,data.asc.nullslast`);
}

async function replaceRows(table, rows) {
  await sbFetch(`/${table}?id=not.is.null`, { method: 'DELETE' });
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return await sbFetch(`/${table}?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(rows),
  });
}

async function insertRow(table, row) {
  const rows = await sbFetch(`/${table}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify([row]),
  });
  return rows?.[0] || row;
}

module.exports = { getStore, upsertStore, listRows, replaceRows, insertRow };
