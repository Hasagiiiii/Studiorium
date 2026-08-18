const { handle } = require('../src/server/router');

module.exports = async function handler(req, res) {
  try {
    return await handle(req, res);
  } catch (error) {
    console.error('[Studiorium API]', error);
    const status = Number(error.statusCode || 500);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: status >= 500 ? 'Não foi possível concluir a operação.' : error.message }));
  }
};
