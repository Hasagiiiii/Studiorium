const { send, assertSameOrigin } = require('./http');
const bootstrapRoutes = require('./routes/bootstrap');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const projectRoutes = require('./routes/projects');
const publicationRoutes = require('./routes/publications');
const discussionRoutes = require('./routes/discussions');
const communityRoutes = require('./routes/communities');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const techRoutes = require('./routes/tech');
const codeRoutes = require('./routes/code-projects');
const systemRoutes = require('./routes/system');
const securityRoutes = require('./routes/security');
const newsRoutes = require('./routes/news');
const adminNewsRoutes = require('./routes/admin-news');
const customTemplateRoutes = require('./routes/custom-templates');
const notificationRoutes = require('./routes/notifications');
const bookRoutes = require('./routes/books');
const verificationRoutes = require('./routes/verification');

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
    const r = await authRoutes.changePassword(req);
    return send(res, r.status, r.body);
  }
  if (method === 'POST' && pathname === '/auth/password-reset/request') {
    const r = await authRoutes.requestPasswordReset(req);
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
  if (method === 'POST' && pathname === '/profile/verification')
    return send(res, 201, await verificationRoutes.submitVerification(req));

  if (method === 'GET' && pathname === '/communities')
    return send(res, 200, await communityRoutes.list(req));
  const communityMembership = pathname.match(/^\/communities\/([^/]+)\/membership$/);
  if (communityMembership && method === 'POST')
    return send(
      res,
      200,
      await communityRoutes.join(req, decodeURIComponent(communityMembership[1])),
    );
  if (communityMembership && method === 'DELETE')
    return send(
      res,
      200,
      await communityRoutes.leave(req, decodeURIComponent(communityMembership[1])),
    );
  const communityMembers = pathname.match(/^\/communities\/([^/]+)\/members$/);
  if (communityMembers && method === 'GET')
    return send(
      res,
      200,
      await communityRoutes.members(req, decodeURIComponent(communityMembers[1])),
    );
  const communityMember = pathname.match(/^\/communities\/([^/]+)\/members\/([^/]+)$/);
  if (communityMember && method === 'PATCH')
    return send(
      res,
      200,
      await communityRoutes.updateMember(
        req,
        decodeURIComponent(communityMember[1]),
        decodeURIComponent(communityMember[2]),
      ),
    );
  const communityContent = pathname.match(
    /^\/communities\/([^/]+)\/content\/([^/]+)\/([^/]+)\/moderation$/,
  );
  if (communityContent && method === 'PATCH')
    return send(
      res,
      200,
      await communityRoutes.moderateContent(
        req,
        decodeURIComponent(communityContent[1]),
        decodeURIComponent(communityContent[2]),
        decodeURIComponent(communityContent[3]),
      ),
    );
  const communitySettings = pathname.match(/^\/communities\/([^/]+)\/settings$/);
  if (communitySettings && method === 'PATCH')
    return send(
      res,
      200,
      await communityRoutes.updateCommunity(req, decodeURIComponent(communitySettings[1])),
    );
  const community = pathname.match(/^\/communities\/([^/]+)$/);
  if (community && method === 'GET')
    return send(res, 200, await communityRoutes.detail(req, decodeURIComponent(community[1])));

  if (method === 'GET' && pathname === '/notifications')
    return send(res, 200, await notificationRoutes.listNotifications(req));
  if (method === 'PATCH' && pathname === '/notifications/read-all')
    return send(res, 200, await notificationRoutes.markAllRead(req));
  const notification = pathname.match(/^\/notifications\/([^/]+)\/read$/);
  if (notification && method === 'PATCH')
    return send(
      res,
      200,
      await notificationRoutes.markRead(req, decodeURIComponent(notification[1])),
    );

  const bookSave = pathname.match(/^\/books\/([^/]+)\/save$/);
  if (bookSave && method === 'POST')
    return send(res, 200, await bookRoutes.saveBook(req, decodeURIComponent(bookSave[1])));
  if (bookSave && method === 'DELETE')
    return send(res, 200, await bookRoutes.removeBook(req, decodeURIComponent(bookSave[1])));

  if (method === 'POST' && pathname === '/tech-resources')
    return send(res, 201, await techRoutes.create(req));
  const publicTechResource = pathname.match(/^\/tech-resources\/public\/([^/]+)$/);
  if (publicTechResource && method === 'GET')
    return send(res, 200, await techRoutes.getPublic(decodeURIComponent(publicTechResource[1])));
  const techResource = pathname.match(/^\/tech-resources\/([^/]+)$/);
  if (techResource && method === 'GET')
    return send(res, 200, await techRoutes.getMine(req, decodeURIComponent(techResource[1])));
  if (techResource && method === 'PATCH')
    return send(res, 200, await techRoutes.update(req, decodeURIComponent(techResource[1])));
  if (techResource && method === 'DELETE')
    return send(res, 200, await techRoutes.remove(req, decodeURIComponent(techResource[1])));
  if (method === 'POST' && pathname === '/code-projects')
    return send(res, 201, await codeRoutes.create(req));
  const codeProject = pathname.match(/^\/code-projects\/([^/]+)$/);
  if (codeProject && method === 'GET')
    return send(res, 200, await codeRoutes.get(req, decodeURIComponent(codeProject[1])));
  if (codeProject && method === 'PATCH')
    return send(res, 200, await codeRoutes.update(req, decodeURIComponent(codeProject[1])));
  if (codeProject && method === 'DELETE')
    return send(res, 200, await codeRoutes.trash(req, decodeURIComponent(codeProject[1])));
  const codeRestore = pathname.match(/^\/code-projects\/([^/]+)\/restore$/);
  if (codeRestore && method === 'POST')
    return send(res, 200, await codeRoutes.restore(req, decodeURIComponent(codeRestore[1])));
  const codePurge = pathname.match(/^\/code-projects\/([^/]+)\/purge$/);
  if (codePurge && method === 'DELETE')
    return send(res, 200, await codeRoutes.purge(req, decodeURIComponent(codePurge[1])));

  if (method === 'POST' && pathname === '/projects')
    return send(res, 201, await projectRoutes.createProject(req));
  const project = pathname.match(/^\/projects\/([^/]+)$/);
  if (project && method === 'GET')
    return send(res, 200, await projectRoutes.getProject(req, decodeURIComponent(project[1])));
  if (project && method === 'PATCH')
    return send(res, 200, await projectRoutes.updateProject(req, decodeURIComponent(project[1])));
  if (project && method === 'DELETE')
    return send(res, 200, await projectRoutes.deleteProject(req, decodeURIComponent(project[1])));
  const projectRestore = pathname.match(/^\/projects\/([^/]+)\/restore$/);
  if (projectRestore && method === 'POST')
    return send(
      res,
      200,
      await projectRoutes.restoreProject(req, decodeURIComponent(projectRestore[1])),
    );
  const projectPurge = pathname.match(/^\/projects\/([^/]+)\/purge$/);
  if (projectPurge && method === 'DELETE')
    return send(
      res,
      200,
      await projectRoutes.purgeProject(req, decodeURIComponent(projectPurge[1])),
    );

  if (method === 'GET' && pathname === '/news/contributor')
    return send(res, 200, await newsRoutes.contributor(req));
  if (method === 'POST' && pathname === '/news/contributor')
    return send(res, 200, await newsRoutes.applyContributor(req));
  if (method === 'GET' && pathname === '/news/mine')
    return send(res, 200, await newsRoutes.mine(req));
  if (method === 'POST' && pathname === '/news')
    return send(res, 201, await newsRoutes.create(req));
  const newsDetail = pathname.match(/^\/news\/public\/([^/]+)$/);
  if (newsDetail && method === 'GET')
    return send(res, 200, await newsRoutes.detail(decodeURIComponent(newsDetail[1])));
  const newsArticle = pathname.match(/^\/news\/([^/]+)$/);
  if (newsArticle && method === 'PATCH')
    return send(res, 200, await newsRoutes.update(req, decodeURIComponent(newsArticle[1])));
  if (newsArticle && method === 'DELETE')
    return send(res, 200, await newsRoutes.trash(req, decodeURIComponent(newsArticle[1])));
  const newsSubmit = pathname.match(/^\/news\/([^/]+)\/submit$/);
  if (newsSubmit && method === 'POST')
    return send(res, 200, await newsRoutes.submit(req, decodeURIComponent(newsSubmit[1])));
  const newsRestore = pathname.match(/^\/news\/([^/]+)\/restore$/);
  if (newsRestore && method === 'POST')
    return send(res, 200, await newsRoutes.restore(req, decodeURIComponent(newsRestore[1])));
  const newsPurge = pathname.match(/^\/news\/([^/]+)\/purge$/);
  if (newsPurge && method === 'DELETE')
    return send(res, 200, await newsRoutes.purge(req, decodeURIComponent(newsPurge[1])));

  if (method === 'GET' && pathname === '/custom-templates/mine')
    return send(res, 200, await customTemplateRoutes.mine(req));
  if (method === 'POST' && pathname === '/custom-templates')
    return send(res, 201, await customTemplateRoutes.create(req));
  const customTemplate = pathname.match(/^\/custom-templates\/([^/]+)$/);
  if (customTemplate && method === 'GET')
    return send(
      res,
      200,
      await customTemplateRoutes.get(req, decodeURIComponent(customTemplate[1])),
    );
  if (customTemplate && method === 'PATCH')
    return send(
      res,
      200,
      await customTemplateRoutes.update(req, decodeURIComponent(customTemplate[1])),
    );
  if (customTemplate && method === 'DELETE')
    return send(
      res,
      200,
      await customTemplateRoutes.trash(req, decodeURIComponent(customTemplate[1])),
    );
  const customAsset = pathname.match(/^\/custom-templates\/([^/]+)\/assets$/);
  if (customAsset && method === 'POST')
    return send(
      res,
      201,
      await customTemplateRoutes.uploadAsset(req, decodeURIComponent(customAsset[1])),
    );
  const customRestore = pathname.match(/^\/custom-templates\/([^/]+)\/restore$/);
  if (customRestore && method === 'POST')
    return send(
      res,
      200,
      await customTemplateRoutes.restore(req, decodeURIComponent(customRestore[1])),
    );
  const customPurge = pathname.match(/^\/custom-templates\/([^/]+)\/purge$/);
  if (customPurge && method === 'DELETE')
    return send(
      res,
      200,
      await customTemplateRoutes.purge(req, decodeURIComponent(customPurge[1])),
    );

  if (method === 'POST' && pathname === '/publications')
    return send(res, 201, await publicationRoutes.createPublication(req));
  const pubFile = pathname.match(/^\/publications\/([^/]+)\/file$/);
  if (pubFile && method === 'GET')
    return publicationRoutes.downloadPublication(req, res, decodeURIComponent(pubFile[1]));
  const pubCover = pathname.match(/^\/publications\/([^/]+)\/cover$/);
  if (pubCover && method === 'GET')
    return publicationRoutes.serveCover(req, res, decodeURIComponent(pubCover[1]));
  const pubBoost = pathname.match(/^\/publications\/([^/]+)\/boost$/);
  if (pubBoost && method === 'POST')
    return send(
      res,
      200,
      await publicationRoutes.boostPublication(req, decodeURIComponent(pubBoost[1])),
    );
  const pubView = pathname.match(/^\/publications\/([^/]+)\/view$/);
  if (pubView && method === 'POST')
    return send(res, 200, await publicationRoutes.registerView(decodeURIComponent(pubView[1])));
  const publication = pathname.match(/^\/publications\/([^/]+)$/);
  if (publication && method === 'GET')
    return send(
      res,
      200,
      await publicationRoutes.getPublication(req, decodeURIComponent(publication[1])),
    );
  if (publication && method === 'PATCH')
    return send(
      res,
      200,
      await publicationRoutes.updatePublication(req, decodeURIComponent(publication[1])),
    );
  if (publication && method === 'DELETE')
    return send(
      res,
      200,
      await publicationRoutes.deletePublication(req, decodeURIComponent(publication[1])),
    );

  if (method === 'POST' && pathname === '/discussions')
    return send(res, 201, await discussionRoutes.createDiscussion(req));
  const replies = pathname.match(/^\/discussions\/([^/]+)\/replies$/);
  if (replies && method === 'GET')
    return send(res, 200, await discussionRoutes.getThread(req, decodeURIComponent(replies[1])));
  if (replies && method === 'POST')
    return send(res, 201, await discussionRoutes.createReply(req, decodeURIComponent(replies[1])));
  const discussion = pathname.match(/^\/discussions\/([^/]+)$/);
  if (discussion && method === 'PATCH')
    return send(
      res,
      200,
      await discussionRoutes.updateDiscussion(req, decodeURIComponent(discussion[1])),
    );
  if (discussion && method === 'DELETE')
    return send(
      res,
      200,
      await discussionRoutes.deleteDiscussion(req, decodeURIComponent(discussion[1])),
    );
  const reply = pathname.match(/^\/replies\/([^/]+)$/);
  if (reply && method === 'PATCH')
    return send(res, 200, await discussionRoutes.updateReply(req, decodeURIComponent(reply[1])));
  if (reply && method === 'DELETE')
    return send(res, 200, await discussionRoutes.deleteReply(req, decodeURIComponent(reply[1])));

  if (method === 'POST' && pathname === '/reports')
    return send(res, 201, await reportRoutes.createReport(req));
  if (method === 'GET' && pathname === '/admin/dashboard')
    return send(res, 200, await adminRoutes.dashboard(req));
  if (method === 'GET' && pathname === '/admin/queue')
    return send(res, 200, await adminRoutes.queue(req));
  if (method === 'GET' && pathname === '/admin/security-events')
    return send(res, 200, await securityRoutes.recentEvents(req));
  if (method === 'GET' && pathname === '/admin/news')
    return send(res, 200, await adminNewsRoutes.dashboard(req));
  const contributorAdmin = pathname.match(/^\/admin\/news\/contributors\/([^/]+)$/);
  if (contributorAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminNewsRoutes.updateContributor(req, decodeURIComponent(contributorAdmin[1])),
    );
  const newsAdmin = pathname.match(/^\/admin\/news\/articles\/([^/]+)$/);
  if (newsAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminNewsRoutes.updateArticle(req, decodeURIComponent(newsAdmin[1])),
    );
  const customTemplateAdmin = pathname.match(/^\/admin\/custom-templates\/([^/]+)$/);
  if (customTemplateAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminNewsRoutes.updateTemplate(req, decodeURIComponent(customTemplateAdmin[1])),
    );
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
  const verificationAdmin = pathname.match(/^\/admin\/verifications\/([^/]+)$/);
  if (verificationAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await verificationRoutes.reviewVerification(req, decodeURIComponent(verificationAdmin[1])),
    );
  const templateAdmin = pathname.match(/^\/admin\/templates\/([^/]+)$/);
  if (templateAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminRoutes.updateTemplate(req, decodeURIComponent(templateAdmin[1])),
    );
  const contentAdmin = pathname.match(
    /^\/admin\/content\/(publication|tech_resource|discussion|reply)\/([^/]+)$/,
  );
  if (contentAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminRoutes.updateContent(req, contentAdmin[1], decodeURIComponent(contentAdmin[2])),
    );
  const contentDetailsAdmin = pathname.match(
    /^\/admin\/content\/(publication|tech_resource|discussion|reply)\/([^/]+)\/details$/,
  );
  if (contentDetailsAdmin && method === 'PATCH')
    return send(
      res,
      200,
      await adminRoutes.updateContentDetails(
        req,
        contentDetailsAdmin[1],
        decodeURIComponent(contentDetailsAdmin[2]),
      ),
    );
  if (contentAdmin && method === 'DELETE')
    return send(
      res,
      200,
      await adminRoutes.deleteContent(req, contentAdmin[1], decodeURIComponent(contentAdmin[2])),
    );
  if (method === 'PATCH' && pathname === '/admin/settings')
    return send(res, 200, await adminRoutes.updateSettings(req));

  return send(res, 404, { error: 'Endpoint não encontrado.' });
}

module.exports = { handle, apiPath };
