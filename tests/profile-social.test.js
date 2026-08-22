const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('perfil social usa apenas métricas reais e conteúdo público', () => {
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
  assert.ok(profile.includes('state.me?.username === username'));
  assert.ok(profile.includes('userId: state.me.id'));
  assert.ok(profile.includes('state.me?.id === profile.userId'));
  assert.ok(profile.includes('perfil porque ele é seu'));
  assert.ok(profile.includes('Este perfil não está público.'));
});

test('perfil social possui identidade, métricas, atividade e seções responsivas', () => {
  const profile = read('public/js/views/profile-social.js');
  const styles = read('public/css/profile-social.css');
  for (const marker of [
    'profile-social-cover',
    'profile-social-avatar',
    'profile-social-stats',
    'profile-activity-list',
    'id="obras"',
    'id="projetos"',
    'id="discussoes"',
    'id="sobre"',
  ]) {
    assert.ok(profile.includes(marker), `estrutura ausente: ${marker}`);
  }
  assert.ok(styles.includes('@media (max-width: 680px)'));
  assert.ok(styles.includes('.profile-directory-grid'));
});
