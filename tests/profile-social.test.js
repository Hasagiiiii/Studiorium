const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('perfil público usa somente métricas reais', () => {
  const profile = read('public/js/views/profile-social.js');
  assert.ok(profile.includes('profileStats(profile)'));
  assert.ok(profile.includes('state.boot?.publications'));
  assert.ok(profile.includes('state.boot?.communityProjects'));
  assert.ok(profile.includes('state.boot?.discussions'));
  assert.ok(profile.includes('stats.views'));
  assert.equal(profile.includes('followers'), false);
  assert.equal(profile.includes('seguidores'), false);
});

test('dono pode ver o próprio perfil privado sem expor terceiros', () => {
  const profile = read('public/js/views/profile-social.js');
  const server = read('src/server/routes/profile.js');
  assert.ok(profile.includes('state.me?.username === username'));
  assert.ok(profile.includes('userId: state.me.id'));
  assert.ok(profile.includes('state.me?.id === profile.userId'));
  assert.ok(profile.includes('Perfil privado — somente você consegue ver esta página.'));
  assert.ok(server.includes('!profile.is_public && !isOwner'));
  assert.ok(server.includes("new Error('Imagem não encontrada.')"));
});

test('gerenciamento de perfil existe apenas na Escrivaninha', () => {
  const workspace = read('public/js/views/workspace-personal-v330.js');
  const profile = read('public/js/views/profile-social.js');
  for (const marker of ['Aparência', 'Identidade', 'Verificação', 'Segurança']) {
    assert.ok(workspace.includes(marker), `opção ausente: ${marker}`);
  }
  assert.ok(workspace.includes('data-workspace-profile-center'));
  assert.ok(workspace.includes('data-profile-media'));
  assert.ok(profile.includes('Gerenciar na Escrivaninha'));
  assert.equal(profile.includes('data-profile-verification'), false);
  assert.equal(profile.includes('data-change-password'), false);
});

test('foto de perfil e capa usam storage privado e não expõem paths', () => {
  const migration = read('supabase/upgrade-v3.4.3-profile-media.sql');
  const auth = read('src/server/auth.js');
  const serializers = read('src/server/serializers.js');
  const profile = read('src/server/routes/profile.js');
  assert.ok(migration.includes("'profile-media'"));
  assert.ok(migration.includes('false'));
  assert.ok(profile.includes("PROFILE_MEDIA_BUCKET = 'profile-media'"));
  assert.ok(profile.includes('createSignedUrl'));
  assert.ok(auth.includes('hasAvatar'));
  assert.ok(auth.includes('hasCover'));
  assert.ok(serializers.includes('hasAvatar'));
  assert.equal(auth.includes('avatarPath'), false);
  assert.equal(serializers.includes('avatarPath'), false);
});

test('perfil público é compacto e conteúdo fica em opções recolhíveis', () => {
  const profile = read('public/js/views/profile-social.js');
  const styles = read('public/css/profile-social.css');
  assert.ok(profile.includes('profile-content-panel'));
  assert.ok(profile.includes('Publicações'));
  assert.ok(profile.includes('Projetos'));
  assert.ok(profile.includes('Discussões'));
  assert.equal(profile.includes('Atividade recente'), false);
  assert.equal(profile.includes('id="sobre"'), false);
  assert.ok(styles.includes('.workspace-profile-options'));
  assert.ok(styles.includes('@media (max-width: 700px)'));
});
