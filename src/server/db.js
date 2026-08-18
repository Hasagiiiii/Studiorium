const { createClient } = require('@supabase/supabase-js');
const { config } = require('./config');

const TRANSIENT_RESPONSE_PATTERNS = [/jwt issued at future/i];

function wait(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function isTransientResponse(response) {
  if (response.ok) return false;

  try {
    const body = await response.clone().text();
    return TRANSIENT_RESPONSE_PATTERNS.some((pattern) => pattern.test(body));
  } catch {
    return false;
  }
}

function createResilientFetch(baseFetch, options = {}) {
  const attempts = options.attempts || 3;
  const baseDelayMs = options.baseDelayMs ?? 500;

  return async function resilientFetch(input, init) {
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const response = await baseFetch(input, init);
      const canRetry = attempt < attempts && (await isTransientResponse(response));

      if (!canRetry) return response;
      await wait(baseDelayMs * attempt);
    }

    throw new Error('A consulta ao banco excedeu o limite de tentativas.');
  };
}

let client;
function db() {
  if (!client) {
    const cfg = config();
    client = createClient(cfg.supabaseUrl, cfg.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: createResilientFetch(globalThis.fetch) },
    });
  }
  return client;
}

async function one(query, message = 'Registro não encontrado.') {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) {
    const err = new Error(message);
    err.statusCode = 404;
    throw err;
  }
  return data;
}

function fail(error, fallback = 'Falha no banco de dados.') {
  if (!error) return;
  const err = new Error(error.message || fallback);
  err.statusCode = 500;
  throw err;
}

module.exports = { db, one, fail, createResilientFetch, isTransientResponse };
