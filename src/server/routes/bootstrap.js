const { db, fail } = require('../db');
const { currentUser, publicUser } = require('../auth');
const S = require('../serializers');

async function bootstrap(req) {
  const client = db();
  const [
    templatesQ,
    publicationsQ,
    discussionsQ,
    profilesQ,
    settingsQ,
    techQ,
    codeQ,
    newsQ,
    customTemplatesQ,
    user,
  ] = await Promise.all([
    client
      .from('templates')
      .select('*')
      .order('featured', { ascending: false })
      .order('downloads', { ascending: false }),
    client
      .from('publications')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    client
      .from('discussions')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    client
      .from('profiles')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    client.from('site_settings').select('*'),
    client
      .from('tech_resources')
      .select('*')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false }),
    client
      .from('code_projects')
      .select('*')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false }),
    client
      .from('news_articles')
      .select('*')
      .eq('status', 'published')
      .not('certified_at', 'is', null)
      .is('deleted_at', null)
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false }),
    client
      .from('custom_templates')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false }),
    currentUser(req),
  ]);
  [
    templatesQ,
    publicationsQ,
    discussionsQ,
    profilesQ,
    settingsQ,
    techQ,
    codeQ,
    newsQ,
    customTemplatesQ,
  ].forEach((query) => fail(query.error));
  const settings = Object.fromEntries(settingsQ.data.map((row) => [row.key, row.value]));
  return {
    templates: templatesQ.data.map(S.template),
    publications: publicationsQ.data.map(S.publication),
    codeProjects: codeQ.data.map(S.codeProject),
    news: newsQ.data.map(S.newsArticle),
    customTemplates: customTemplatesQ.data.map(S.customTemplate),
    discussions: discussionsQ.data.map(S.discussion),
    profiles: profilesQ.data.map(S.profile),
    settings,
    techResources: techQ.data.map(S.techResource),
    user: await publicUser(user),
  };
}

async function me(req) {
  const user = await currentUser(req);
  if (!user)
    return {
      user: null,
      projects: [],
      publications: [],
      techResources: [],
      codeProjects: [],
      news: [],
      customTemplates: [],
    };
  const [projectsQ, publicationsQ, techQ, codeQ, newsQ, templatesQ] = await Promise.all([
    db()
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    db()
      .from('publications')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    db()
      .from('tech_resources')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    db()
      .from('code_projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    db()
      .from('news_articles')
      .select('*')
      .eq('contributor_id', user.id)
      .order('updated_at', { ascending: false }),
    db()
      .from('custom_templates')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
  ]);
  [projectsQ, publicationsQ, techQ, codeQ, newsQ, templatesQ].forEach((query) => fail(query.error));
  return {
    user: await publicUser(user),
    projects: projectsQ.data.map(S.project),
    publications: publicationsQ.data.map(S.publication),
    techResources: techQ.data.map(S.techResource),
    codeProjects: codeQ.data.map(S.codeProject),
    news: newsQ.data.map(S.newsArticle),
    customTemplates: templatesQ.data.map(S.customTemplate),
  };
}

module.exports = { bootstrap, me };
