const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Estúdio oferece criação assistida transparente sem fingir provedor de IA', () => {
  const studio = read('public/js/views/communities.js');
  const assistant = read('public/js/features/creative-assistant.js');
  const main = read('public/js/main.js');

  assert.match(studio, /Criação assistida/);
  assert.match(studio, /não finge geração por IA/);
  assert.match(studio, /data-guided-template="banner"/);
  assert.match(studio, /data-guided-template="slides"/);
  assert.match(studio, /data-guided-template="estudo"/);

  assert.match(assistant, /const BLUEPRINTS =/);
  assert.match(assistant, /pageSize: 'Apresentação'/);
  assert.match(assistant, /\/api\/custom-templates/);
  assert.match(assistant, /crypto\.randomUUID/);
  assert.match(main, /installCreativeAssistant/);
});

test('blueprints guiados mantêm autoria do usuário e estrutura acadêmica explícita', () => {
  const assistant = read('public/js/features/creative-assistant.js');

  assert.match(assistant, /Introdução/);
  assert.match(assistant, /Metodologia/);
  assert.match(assistant, /Resultados/);
  assert.match(assistant, /Referências/);
  assert.match(assistant, /Conceitos-chave/);
  assert.doesNotMatch(assistant, /openai|anthropic|manus\.im|gemini/i);
});
