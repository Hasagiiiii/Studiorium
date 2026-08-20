const { handle } = require('../src/server/router');
const { send } = require('../src/server/http');

function logRequestError(error, status) {
  if (status >= 500) {
    console.error('[Studiorium API]', error);
    return;
  }

  if (status >= 400 && status !== 401 && status !== 404) {
    console.warn('[Studiorium API client]', {
      status,
      message: error.message,
    });
  }
}

module.exports = async function handler(req, res) {
  try {
    return await handle(req, res);
  } catch (error) {
    const status = Number(error.statusCode || 500);
    logRequestError(error, status);
    if (error.retryAfter) res.setHeader('Retry-After', String(Math.ceil(error.retryAfter)));
    return send(res, status, {
      error: status >= 500 ? 'Não foi possível concluir a operação.' : error.message,
    });
  }
};
