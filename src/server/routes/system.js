const { db } = require('../db');
const { config } = require('../config');

async function health() {
  const startedAt = Date.now();
  try {
    config();
    const { error } = await db().from('site_settings').select('key').limit(1);
    if (error) throw error;
    return {
      status: 200,
      body: {
        ok: true,
        name: 'Studiorium',
        mode: 'online',
        database: 'connected',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[Studiorium health]', error.message || error);
    return {
      status: 503,
      body: {
        ok: false,
        name: 'Studiorium',
        mode: 'online',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

module.exports = { health };
