const { send, assertSameOrigin } = require('./http');
const bootstrapRoutes = require('./routes/bootstrap');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const projectRoutes = require('./routes/projects');
const publicationRoutes = require('./routes/publications');
const discussionRoutes = require('./routes/discussions');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const techRoutes = require('./routes/tech');
const codeRoutes = require('./routes/code-projects');
const systemRoutes = require('./routes/system');
const securityRoutes = require('./routes/security');

const { apiPath } = require('./route-utils');

async function handle(req, res) {
  const method = String(req.method || 'GET').toUpperCase();
  const pathname = apiPath(req);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) assertSameOrigin(req);
  if (method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (method === 'GET' && pathname === '/health') {
    const r = await systemRoutes.health();
    return send(res, r.status, r.body);
  }
  if (method === 'GET' && pathname === '/bootstrap')
    return send(res, 200, await bootstrapRoutes.bootstrap(req));
  if (method === 'GET' && pathname === '/me') return send(res, 200, await bootstrapRoutes.me(req));

  if (method === 'POST' && pathname === '/auth/register') {
    const r = await authRoutes.register(req, res);
    return send(res, r.status, r.body);
  }
  if (method === 'POST' && pathname === '/auth/login') {
    const r = await authRoutes.login(req, res);
    return send(res, r.status, r.body);
  }
  if (method === 'POST' && pathname === '/auth/change-password') {
    const r = await authRoutes.changePassword(req, res);
    return send(res, r.status, r.body);
  }
  if (method === 'POST' && pathname === '/auth/password-reset') {
    const r = await authRoutes.resetPassword(req);
    return send(res, r.status, r.body);
  }
  if (method === 'POST' && pathname === '/auth/logout') {
    const r = await authRoutes.logout(req, res);
    return send(res, r.status, r.body);
  }
  if (method === 'PATCH' && pathname === '/profile')
    return send(res, 200, await profileRoutes.updateProfile(req));

  if (method === 'POST' && pathname === '/tech-resources')
    return send(res, 201, await techRoutes.create(req));
  if (method === 'POST' && pathname === '/code-projects')
    return send(res, 201, await codeRoutes.create(req));
  const codeProject = pathname.match(/^\/code-projects\/([^/]+)$/);
  if (codeProject && method === 'GET')
    return send(res, 200, await codeRoutes.get(req, decodeURIComponent(codeProject[1])));
  if (codeProject && method === 'PATCH')
    return send(res, 200, await codeRoutes.update(req, decodeURIComponent(codeProject[1])));

  if (method === 'POST' && pathname === '/projects')
    return send(res, 201, await projectRoutes.createProject(req));
  const project = pathname.match(/^\/projects\/([^/]+)$/);
  if (project && method === 'GET')
    return send(res, 200, await projectRoutes.getProject(req, decodeURIComponent(project[1])));
  if (project && method === 'PATCH')
    return send(res, 200, await projectRoutes.updateProject(req, decodeURIComponent(project[1])));
  if (project && method === 'DELETE')
    return send(res, 200, await projectRoutes.deleteProject(req, decodeURIComponent(project[1])));

  if (method === 'POST' && pathname === '/publications')
    return send(res, 201, await publicationRoutes.createPublication(req));
  const pubFile = pathname.match(/^\/publications\/([^/]+)\/file$/);
  if (pubFile && method === 'GET')
    return publicationRoutes.downloadPublication(req, res, decodeURIComponent(pubFile[1]));
  const pubView = pathname.match(/^\/publications\/([^/]+)\/view$/);
  if (pubView && method === 'POST')
    return send(res, 200, await publicationRoutes.registerView(decodeURIComponent(pubView[1])));

  if (method === 'POST' && pathname === '/discussions')
    return send(res, 201, await discussionRoutes.createDiscussion(req));
  const replies = pathname.match(/^\/discussions\/([^/]+)\/replies$/);
  if (replies && method === 'GET')
    return send(res, 200, await discussionRoutes.getThread(decodeURIComponent(replies[1])));
  if (replies && method === 'POST')
    return send(res, 201, await discussionRoutes.createReply(req, decodeURIComponent(replies[1])));

  if (method === 'POST' && pathname === '/reports')
    return send(res, 201, await reportRoutes.createReport(req));
  if (method === 'GET' && pathname === '/admin/dashboard')
    return send(res, 200, await adminRoutes.dashboard(req));
  if (method === 'GET' && pathname === '/admin/queue')
    return send(res, 200, await adminRoutes.queue(req));
  if (method === 'GET' && pathname === '/admin/security-events')
    return send(res, 200, await securityRoutes.recentEvents(req));
  const report = pathname.match(/^\/admin\/reports\/([^/]+)$/);
  if (report && method === 'PATCH')
    return send(res, 200, await adminRoutes.updateReport(req, decodeURIComponent(report[1])));
  const pubAdmin = pathname.match(/^\/admin\/publications\/([^/]+)$/);
  if (pubAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminRoutes.updatePublication(req, decodeURIComponent(pubAdmin[1])),
    );
  const userAdmin = pathname.match(/^\/admin\/users\/([^/]+)$/);
  if (userAdmin && method === 'PATCH')
    return send(res, 200, await adminRoutes.updateUser(req, decodeURIComponent(userAdmin[1])));
  const templateAdmin = pathname.match(/^\/admin\/templates\/([^/]+)$/);
  if (templateAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminRoutes.updateTemplate(req, decodeURIComponent(templateAdmin[1])),
    );
  const contentAdmin = pathname.match(
    /^\/admin\/content\/(publication|discussion|reply)\/([^/]+)$/,
  );
  if (contentAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminRoutes.updateContent(req, contentAdmin[1], decodeURIComponent(contentAdmin[2])),
    );
  if (method === 'PATCH' && pathname === '/admin/settings')
    return send(res, 200, await adminRoutes.updateSettings(req));

  return send(res, 404, { error: 'Endpoint não encontrado.' });
}

module.exports = { handle, apiPath };
