const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('autenticação reserva o ADM sem promoção automática por e-mail', () => {
  const authRoutes = read('src/server/routes/auth.js');
  const auth = read('src/server/auth.js');
  assert.ok(authRoutes.includes('admin.registration_blocked'));
  assert.ok(authRoutes.includes("const role = 'user'"));
  assert.equal(auth.includes('admin.role_restored'), false);
});

test('rotas críticas de segurança estão ligadas', () => {
  const router = read('src/server/router.js');
  for (const route of ['/health', '/auth/change-password', '/admin/security-events']) {
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
  ];
  for (const rel of required) assert.ok(fs.existsSync(path.join(root, rel)), `migração ausente: ${rel}`);
});

test('deploy oficial permanece Vercel + Supabase e dependência está fixada', () => {
  const vercel = JSON.parse(read('vercel.json'));
  const pkg = JSON.parse(read('package.json'));
  assert.ok(Array.isArray(vercel.rewrites) && vercel.rewrites.length >= 2);
  assert.ok(vercel.functions && vercel.functions['api/index.js']);
  assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.57.0');
  assert.equal(fs.existsSync(path.join(root, '.github/workflows/deploy-pages.yml')), false);
  assert.equal(fs.existsSync(path.join(root, 'scripts/build-pages.js')), false);
});
