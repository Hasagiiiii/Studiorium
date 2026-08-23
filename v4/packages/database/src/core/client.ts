import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function databaseSecret(): string {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      'Variável obrigatória ausente: SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY legado)',
    );
  }
  return secret;
}

export function database(): SupabaseClient {
  if (client) return client;

  client = createClient(requiredEnv('SUPABASE_URL'), databaseSecret(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return client;
}
