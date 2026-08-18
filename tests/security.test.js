const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword, slugify, tokenHash } = require('../src/server/security');
const { moderate } = require('../src/server/moderation');

test('senha usa hash e valida corretamente', () => {
  const hash = hashPassword('SenhaSegura123');
  assert.notEqual(hash, 'SenhaSegura123');
  assert.equal(verifyPassword('SenhaSegura123', hash), true);
  assert.equal(verifyPassword('senha-errada', hash), false);
});

test('slug remove acentos e símbolos', () => {
  assert.equal(slugify('Educação & Ciência 2026'), 'educacao-ciencia-2026');
});

test('token de sessão não é armazenado em claro', () => {
  assert.equal(tokenHash('abc').length, 64);
  assert.notEqual(tokenHash('abc'), 'abc');
});

test('moderação rejeita conteúdo vazio e padrões críticos', () => {
  assert.equal(moderate('').ok, false);
  assert.equal(moderate('conteúdo sexual com menor').ok, false);
  assert.equal(moderate('Discussão acadêmica sobre metodologia científica.').ok, true);
});
