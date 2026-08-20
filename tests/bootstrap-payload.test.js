const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/server/routes/bootstrap.js'), 'utf8');

function fieldBlock(name) {
  const match = source.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\]\\.join\\(','\\);`));
  assert.ok(match, `lista de campos ausente: ${name}`);
  return match[1];
}

test('bootstrap usa projeções explícitas nas coleções de conteúdo pesado', () => {
  for (const name of [
    'PUBLICATION_LIST_FIELDS',
    'TECH_LIST_FIELDS',
    'CODE_PROJECT_LIST_FIELDS',
    'NEWS_LIST_FIELDS',
    'CUSTOM_TEMPLATE_LIST_FIELDS',
  ]) {
    assert.ok(source.includes(`.select(${name})`), `bootstrap não usa ${name}`);
  }
});

test('listagem pública não envia código-fonte completo no bootstrap', () => {
  const fields = fieldBlock('CODE_PROJECT_LIST_FIELDS');
  assert.doesNotMatch(fields, /'html'/);
  assert.doesNotMatch(fields, /'css'/);
  assert.doesNotMatch(fields, /'javascript'/);
});

test('listagens de notícias, oficina e templates não enviam conteúdo integral', () => {
  assert.doesNotMatch(fieldBlock('NEWS_LIST_FIELDS'), /'body'|'sources'|'ai_review'/);
  assert.doesNotMatch(fieldBlock('TECH_LIST_FIELDS'), /'body'/);
  assert.doesNotMatch(fieldBlock('CUSTOM_TEMPLATE_LIST_FIELDS'), /'document'/);
});

test('pesquisas preservam conteúdo enquanto a página de detalhe ainda usa o bootstrap', () => {
  assert.match(fieldBlock('PUBLICATION_LIST_FIELDS'), /'content'/);
});
