import { access } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

async function assertFile(path) {
  await access(path);
}

async function assertTable(client, table) {
  const { error } = await client.from(table).select('*', { head: true, count: 'exact' }).limit(1);
  if (error) throw new Error(`Falha ao validar ${table}: ${error.message}`);
}

async function main() {
  await assertFile('apps/web/dist/index.html');
  await assertFile('apps/web/dist/assets');

  const client = createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const tables = [
    'profiles',
    'communities',
    'books',
    'projects',
    'publications',
    'news_articles',
    'discussions',
    'user_follows',
    'notifications',
    'sessions',
  ];

  for (const table of tables) await assertTable(client, table);

  console.log(`Lorion v4 predeploy smoke OK: ${tables.length} tabelas essenciais verificadas.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
