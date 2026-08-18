const test = require('node:test');
const assert = require('node:assert/strict');
const { apiPath } = require('../src/server/route-utils');

test('rota reescrita da Vercel preserva o caminho da API', () => {
  assert.equal(apiPath({ query:{ path:'projects/abc' }, url:'/api?path=projects/abc' }), '/projects/abc');
  assert.equal(apiPath({ query:{ path:['discussions','x','replies'] }, url:'/api' }), '/discussions/x/replies');
});

test('rota direta /api também funciona', () => {
  assert.equal(apiPath({ query:{}, url:'/api/health' }), '/health');
});
