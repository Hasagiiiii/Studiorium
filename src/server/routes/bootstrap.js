const { db, fail } = require('../db');
const { currentUser, publicUser } = require('../auth');
const S = require('../serializers');

async function bootstrap(req) {
  const client = db();
  const [templatesQ, publicationsQ, discussionsQ, profilesQ, settingsQ, techQ, codeQ, user] = await Promise.all([
    client.from('templates').select('*').order('featured', { ascending: false }).order('downloads', { ascending: false }),
    client.from('publications').select('*').eq('status', 'published').order('created_at', { ascending: false }),
    client.from('discussions').select('*').eq('status', 'published').order('created_at', { ascending: false }),
    client.from('profiles').select('*').eq('is_public', true).order('created_at', { ascending: false }),
    client.from('site_settings').select('*'),
    client.from('tech_resources').select('*').eq('status','published').order('featured',{ascending:false}).order('created_at',{ascending:false}),
    client.from('code_projects').select('*').eq('visibility','public').order('updated_at',{ascending:false}),
    currentUser(req),
  ]);
  [templatesQ, publicationsQ, discussionsQ, profilesQ, settingsQ, techQ, codeQ].forEach((q) => fail(q.error));
  const settings = Object.fromEntries(settingsQ.data.map((row) => [row.key, row.value]));
  return {
    templates: templatesQ.data.map(S.template),
    publications: publicationsQ.data.map(S.publication),
    codeProjects: codeQ.data.map(S.codeProject),
    discussions: discussionsQ.data.map(S.discussion),
    profiles: profilesQ.data.map(S.profile),
    settings,
    techResources: techQ.data.map(S.techResource),
    user: await publicUser(user),
  };
}

async function me(req) {
  const user = await currentUser(req);
  if (!user) return { user: null, projects: [], publications: [] };
  const [projectsQ, publicationsQ, codeQ] = await Promise.all([
    db().from('projects').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }),
    db().from('publications').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    db().from('code_projects').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false }),
  ]);
  fail(projectsQ.error); fail(publicationsQ.error); fail(codeQ.error);
  return {
    user: await publicUser(user),
    projects: projectsQ.data.map(S.project),
    publications: publicationsQ.data.map(S.publication),
    codeProjects: codeQ.data.map(S.codeProject),
  };
}

module.exports = { bootstrap, me };
