const { createClient } = require('@supabase/supabase-js');
const { config } = require('./config');

let client;
function db() {
  if (!client) {
    const cfg = config();
    client = createClient(cfg.supabaseUrl, cfg.supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
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

module.exports = { db, one, fail };
