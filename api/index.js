const { handle } = require('../src/server/router');
const { send } = require('../src/server/http');

module.exports = async function handler(req, res) {
  try {
    return await handle(req, res);
  } catch (error) {
    console.error('[Studiorium API]', error);
    const status = Number(error.statusCode || 500);
    if (error.retryAfter) res.setHeader('Retry-After', String(Math.ceil(error.retryAfter)));
    return send(res, status, {
      error: status >= 500 ? 'Não foi possível concluir a operação.' : error.message,
    });
  }
};
