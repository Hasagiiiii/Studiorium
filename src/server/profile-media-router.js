const { assertSameOrigin, send } = require('./http');
const { apiPath } = require('./route-utils');
const profileRoutes = require('./routes/profile');

async function handleProfileMedia(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const pathname = apiPath(req);

  if (method === 'POST' && pathname === '/profile/media') {
    assertSameOrigin(req);
    send(res, 200, await profileRoutes.uploadProfileMedia(req));
    return true;
  }

  const ownMedia = pathname.match(/^\/profile\/media\/(avatar|cover)$/);
  if (ownMedia && method === 'DELETE') {
    assertSameOrigin(req);
    send(res, 200, await profileRoutes.removeProfileMedia(req, ownMedia[1]));
    return true;
  }

  const publicMedia = pathname.match(/^\/profiles\/([^/]+)\/media\/(avatar|cover)$/);
  if (publicMedia && method === 'GET') {
    await profileRoutes.serveProfileMedia(
      req,
      res,
      decodeURIComponent(publicMedia[1]),
      publicMedia[2],
    );
    return true;
  }

  return false;
}

module.exports = { handleProfileMedia };
