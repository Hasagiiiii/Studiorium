function apiPath(req) {
  const queryPath = Array.isArray(req.query?.path) ? req.query.path.join('/') : req.query?.path;
  if (queryPath !== undefined) return '/' + String(queryPath || '').replace(/^\/+/, '');
  const raw = String(req.url || '/');
  return new URL(raw, 'https://studiorium.invalid').pathname.replace(/^\/api/, '') || '/';
}
module.exports = { apiPath };
