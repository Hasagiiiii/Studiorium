const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('v3.1 adiciona equipe, verificação, notificações, estante e impulsos com RLS', () => {
  const migration = read('supabase/upgrade-v3.1-community-identity.sql');
  for (const marker of [
    "'moderator', 'curator', 'editor', 'admin'",
    'profile_verification_requests',
    'verification_status',
    'notifications_user_unread_idx',
    'create table if not exists public.books',
    'create table if not exists public.book_saves',
    'create table if not exists public.publication_boosts',
    'publications_discovery_idx',
    'boost_publication',
    'complete_profile_verification',
    'enable row level security',
    'from public, anon, authenticated',
    'to service_role',
  ]) {
    assert.ok(migration.includes(marker), `proteção ou recurso ausente: ${marker}`);
  }
});

test('migração v3.1 preserva a estrutura comunitária já aplicada online', () => {
  const migration = read('supabase/upgrade-v3.1-community-identity.sql');
  for (const marker of [
    "alter column requested_level set default 'specialist'",
    "alter column proof_url set default ''",
    'set education_level = education_status',
    'set verified_specialty = expertise_area',
    'set credential_reference = proof_url',
  ]) {
    assert.ok(migration.includes(marker), `compatibilidade ausente: ${marker}`);
  }
});

test('perfil acadêmico declara formação sem permitir auto-verificação', () => {
  const profile = read('src/server/routes/profile.js');
  const verification = read('src/server/routes/verification.js');
  const auth = read('src/server/auth.js');
  assert.ok(profile.includes("'internauta'"));
  assert.ok(profile.includes('education_level'));
  assert.equal(profile.includes('verified_specialty:'), false);
  assert.ok(verification.includes('requireAdmin(req)'));
  assert.ok(verification.includes("db().rpc('complete_profile_verification'"));
  assert.ok(auth.includes('verificationStatus'));
});

test('interface oferece pesquisa de usuários, selo e central interna responsiva', () => {
  const profile = read('public/js/views/profile-social.js');
  const core = read('public/js/views/core.js');
  const styles = read('public/css/components.css');
  assert.ok(profile.includes('data-author-filter'));
  assert.ok(profile.includes('Especialista verificado'));
  assert.ok(core.includes('data-notification-panel'));
  assert.ok(core.includes('data-notifications-read-all'));
  assert.ok(styles.includes('.notification-panel.open'));
  assert.ok(styles.includes('bottom: 10px'));
});

test('publicação usa foto opcional validada e impulso único', () => {
  const publications = read('src/server/routes/publications.js');
  const workspace = read('public/js/views/workspace.js');
  const schema = read('supabase/schema.sql');
  for (const marker of ['image/jpeg', 'image/png', 'image/webp', 'matchesImageSignature']) {
    assert.ok(publications.includes(marker), `validação de imagem ausente: ${marker}`);
  }
  assert.ok(publications.includes("from('publication_boosts')"));
  assert.ok(workspace.includes('data-publication-cover'));
  assert.ok(workspace.includes('Se você não enviar foto'));
  assert.ok(schema.includes('primary key (publication_id, user_id)'));
});

test('biblioteca e escrivaninha mantêm uma estante de livros', () => {
  const library = read('public/js/views/home-library.js');
  const workspace = read('public/js/views/workspace.js');
  const router = read('src/server/router.js');
  assert.ok(library.includes('Estante de livros'));
  assert.ok(library.includes('data-book-save'));
  assert.ok(workspace.includes('Minha estante de livros'));
  assert.ok(router.includes('bookRoutes.saveBook'));
});

test('cadastro bloqueia reenvio enquanto a conta está sendo criada', () => {
  const account = read('public/js/events/account.js');
  assert.ok(account.includes("form.dataset.submitting === 'true'"));
  assert.ok(account.includes("button.textContent = 'Criando conta…'"));
  assert.ok(account.includes("form.dataset.submitting = 'false'"));
});

test('projetos acadêmicos podem ser compartilhados sem expor notas privadas', () => {
  const migration = read('supabase/upgrade-v3.1.1-local-moderation-public-projects.sql');
  const projects = read('src/server/routes/projects.js');
  const serializers = read('src/server/serializers.js');
  const research = read('public/js/views/research.js');
  const profile = read('public/js/views/profile-social.js');
  const router = read('public/js/router.js');
  assert.ok(migration.includes("visibility in ('private', 'public')"));
  assert.ok(projects.includes("['private', 'public'].includes(body.visibility)"));
  assert.ok(serializers.includes('function publicProject'));
  assert.equal(
    serializers
      .slice(
        serializers.indexOf('function publicProject'),
        serializers.indexOf('function publication'),
      )
      .includes('notes:'),
    false,
  );
  assert.ok(research.includes('function publicProjectDetail'));
  assert.ok(router.includes("p.startsWith('/projetos/')"));
  assert.ok(profile.includes("'Projetos'"));
  assert.ok(profile.includes('stats.projects.map(projectCard)'));
});
