const { send } = require('./http');
const { apiPath } = require('./route-utils');
const socialRoutes = require('./routes/social');

async function handleSocial(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const pathname = apiPath(req);

  if (method === 'GET' && pathname === '/social/me') {
    const { requireUser } = require('./auth');
    const user = await requireUser(req);
    return send(res, 200, { followingIds: await socialRoutes.followingIdsFor(user.id) });
  }

  const profileSocial = pathname.match(/^\/profiles\/([^/]+)\/social$/);
  if (!profileSocial) return false;

  const username = decodeURIComponent(profileSocial[1]);
  if (method === 'GET') return send(res, 200, await socialRoutes.socialSummary(req, username));
  if (method === 'POST') return send(res, 200, await socialRoutes.follow(req, username));
  if (method === 'DELETE') return send(res, 200, await socialRoutes.unfollow(req, username));

  return false;
}

module.exports = { handleSocial };
