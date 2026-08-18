function config() {
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = String(process.env.STUDIORIUM_ADMIN_EMAIL || '').trim().toLowerCase();
  const missing = [];
  if (!process.env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!supabaseKey) missing.push('SUPABASE_SECRET_KEY');
  if (!adminEmail) missing.push('STUDIORIUM_ADMIN_EMAIL');
  if (missing.length) {
    const error = new Error(`Configuração ausente: ${missing.join(', ')}`);
    error.code = 'CONFIG_MISSING';
    throw error;
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseSecretKey: supabaseKey,
    adminEmail,
    sessionDays: 14,
    maxBodyBytes: 8_000_000,
    maxUploadBytes: 5 * 1024 * 1024,
  };
}
module.exports = { config };
