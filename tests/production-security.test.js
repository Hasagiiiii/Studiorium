const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const { safePublicName } = require('../src/server/public-identity');

test('identidade pública nunca devolve endereço de e-mail', () => {
  assert.equal(safePublicName('pessoa@example.com'), 'Membro do Studiorium');
  assert.equal(safePublicName('Contato pessoa@example.com'), 'Membro do Studiorium');
  assert.equal(safePublicName('Nome Público', 'pessoa@example.com'), 'Nome Público');

  const serializers = read('src/server/serializers.js');
  const tech = read('src/server/routes/tech.js');
  assert.ok(serializers.includes('safePublicName(row.author_name)'));
  assert.equal(tech.includes('u.displayName || u.email'), false);
});

test('Oficina oferece leitura completa apenas para conteúdo publicado', () => {
  const router = read('src/server/router.js');
  const route = read('src/server/routes/tech.js');
  const view = read('public/js/views/tech.js');

  assert.ok(router.includes('tech-resources\\/public'));
  assert.ok(route.includes(".eq('status', 'published')"));
  assert.ok(view.includes('Ler conteúdo completo'));
  assert.ok(view.includes('function oficinaDetail'));
});

test('autenticação reserva o ADM sem promoção automática por e-mail', () => {
  const authRoutes = read('src/server/routes/auth.js');
  const auth = read('src/server/auth.js');
  assert.ok(authRoutes.includes('admin.registration_blocked'));
  assert.ok(authRoutes.includes("const role = 'user'"));
  assert.equal(auth.includes('admin.role_restored'), false);
});

test('rotas críticas de segurança estão ligadas', () => {
  const router = read('src/server/router.js');
  for (const route of [
    '/health',
    '/auth/change-password',
    '/auth/password-reset',
    '/auth/password-reset/request',
    '/admin/security-events',
    '/admin/news',
  ]) {
    assert.ok(router.includes(route), `rota ausente: ${route}`);
  }
});

test('migrações de segurança e produção estão versionadas', () => {
  const required = [
    'supabase/upgrade-v2.4-security.sql',
    'supabase/upgrade-v2.4.1-security-compat.sql',
    'supabase/upgrade-v2.5-admin-bootstrap.sql',
    'supabase/upgrade-v2.6-performance.sql',
    'supabase/upgrade-v2.6.1-revoke-client-grants.sql',
    'supabase/upgrade-v2.7-security-events.sql',
    'supabase/upgrade-v2.8-password-reset.sql',
    'supabase/upgrade-v2.9-editorial-studio.sql',
  ];
  for (const rel of required)
    assert.ok(fs.existsSync(path.join(root, rel)), `migração ausente: ${rel}`);
});

test('redefinição de senha usa token com hash, validade e uso único', () => {
  const migration = read('supabase/upgrade-v2.8-password-reset.sql');
  const authRoutes = read('src/server/routes/auth.js');
  const accountEvents = read('public/js/events/account.js');

  for (const marker of [
    'token_hash text primary key',
    'expires_at > now()',
    'used_at is null',
    'security definer',
    'from public, anon, authenticated',
    'to service_role',
    'delete from public.sessions',
  ]) {
    assert.ok(migration.includes(marker), `proteção ausente: ${marker}`);
  }
  assert.ok(authRoutes.includes('tokenHash(rawToken)'));
  assert.ok(authRoutes.includes("db().rpc('complete_password_reset'"));
  assert.ok(accountEvents.includes('location.hash.slice(1)'));
  assert.ok(accountEvents.includes("history.replaceState({}, '', '/login')"));
});

test('migração v2.7 remove o bloqueio legado de eventos de segurança', () => {
  const migration = read('supabase/upgrade-v2.7-security-events.sql');
  assert.ok(migration.includes('alter column event set not null'));
  assert.ok(migration.includes('alter column event_type drop not null'));
  assert.ok(migration.includes("column_name = 'event_type'"));
});

test('schema novo já contém toda a segurança e os índices atuais', () => {
  const schema = read('supabase/schema.sql');
  for (const marker of [
    'create table if not exists public.auth_rate_limits',
    'create table if not exists public.security_events',
    'projects_template_id_idx',
    'reports_reporter_id_idx',
    'tech_resources_owner_id_idx',
    'from anon, authenticated',
  ]) {
    assert.ok(schema.includes(marker), `item ausente no schema consolidado: ${marker}`);
  }
});

test('provisionamento administrativo é explícito e não promove conta comum', () => {
  const pkg = JSON.parse(read('package.json'));
  const script = read('scripts/provision-admin.js');
  assert.equal(pkg.scripts['provision-admin'], 'node scripts/provision-admin.js');
  assert.ok(script.includes("existing.data.role !== 'admin'"));
  assert.ok(script.includes("role: 'admin'"));
  assert.equal(script.includes('update({ role'), false);
});

test('deploy oficial permanece Vercel + Supabase e dependência está fixada', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const pkg = JSON.parse(read('package.json'));
  assert.ok(Array.isArray(vercel.rewrites) && vercel.rewrites.length >= 2);
  assert.ok(vercel.functions && vercel.functions['api/index.js']);
  assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.57.0');
  assert.equal(pkg.engines.node, '24.x');
  assert.equal(fs.existsSync(path.join(root, '.github/workflows/deploy-pages.yml')), false);
  assert.equal(fs.existsSync(path.join(root, 'scripts/build-pages.js')), false);
});
