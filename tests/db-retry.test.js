const test = require('node:test');
const assert = require('node:assert/strict');
const { createResilientFetch } = require('../src/server/db');

function response(body, ok = false) {
  return {
    ok,
    clone() {
      return {
        async text() {
          return body;
        },
      };
    },
  };
}

test('repete a consulta quando o JWT ainda não está válido', async () => {
  let calls = 0;
  const baseFetch = async () => {
    calls += 1;
    if (calls < 3) return response('{"message":"JWT issued at future"}');
    return response('{}', true);
  };
  const resilientFetch = createResilientFetch(baseFetch, {
    attempts: 3,
    baseDelayMs: 0,
  });

  const result = await resilientFetch('https://example.test');

  assert.equal(result.ok, true);
  assert.equal(calls, 3);
});

test('não repete uma falha permanente do banco', async () => {
  let calls = 0;
  const permanentFailure = response('{"message":"permission denied"}');
  const resilientFetch = createResilientFetch(async () => {
    calls += 1;
    return permanentFailure;
  });

  const result = await resilientFetch('https://example.test');

  assert.equal(result, permanentFailure);
  assert.equal(calls, 1);
});
