const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('health distingue e-mail não configurado sem expor segredos', () => {
  const email = read('src/server/email.js');
  const system = read('src/server/routes/system.js');

  assert.ok(email.includes('function isEmailDeliveryConfigured()'));
  assert.ok(email.includes('process.env.RESEND_API_KEY'));
  assert.ok(email.includes('process.env.STUDIORIUM_EMAIL_FROM'));
  assert.ok(
    system.includes("emailDelivery: isEmailDeliveryConfigured() ? 'configured' : 'not_configured'"),
  );
  assert.equal(system.includes('RESEND_API_KEY'), false);
  assert.equal(system.includes('STUDIORIUM_EMAIL_FROM'), false);
});

test('interface não gera token quando entrega de e-mail está indisponível', () => {
  const account = read('public/js/events/account.js');

  assert.ok(account.includes("const health = await api('/api/health')"));
  assert.ok(account.includes("health.emailDelivery !== 'configured'"));
  assert.ok(account.includes('Nenhum link foi gerado.'));
  assert.ok(
    account.indexOf("api('/api/health')") <
      account.indexOf("api('/api/auth/password-reset/request'"),
  );
});
