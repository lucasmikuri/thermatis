'use strict';

function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

module.exports = { getEnv, getRequiredEnv };
