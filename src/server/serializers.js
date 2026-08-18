function template(row) {
  return {
    id: row.id, title: row.title, slug: row.slug, category: row.category,
    docType: row.doc_type, style: row.style, description: row.description,
    downloads: row.downloads, featured: row.featured, sections: row.sections || [],
  };
}
function profile(row) {
  return {
    userId: row.user_id, username: row.username, displayName: row.display_name,
    bio: row.bio || '', profileType: row.profile_type, createdAt: row.created_at,
  };
}
function project(row) {
  return {
    id: row.id, userId: row.user_id, title: row.title, templateId: row.template_id,
    type: row.type, sections: row.sections || [], notes: row.notes || '',
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}
function publication(row) {
  return {
    id: row.id, ownerId: row.owner_id, authorName: row.author_name, title: row.title,
    slug: row.slug, abstract: row.abstract, content: row.content || '', area: row.area,
    level: row.level, keywords: row.keywords || [], license: row.license, status: row.status,
    views: row.views || 0, downloads: row.downloads || 0, featured: row.featured === true, createdAt: row.created_at,
    publishedAt: row.published_at || null, fileName: row.file_name || null,
    fileMime: row.file_mime || null,
  };
}
function discussion(row) {
  return {
    id: row.id, authorId: row.author_id, authorName: row.author_name, title: row.title,
    body: row.body, category: row.category, status: row.status, createdAt: row.created_at,
  };
}
function reply(row) {
  return {
    id: row.id, discussionId: row.discussion_id, authorId: row.author_id,
    authorName: row.author_name, body: row.body, status: row.status, createdAt: row.created_at,
  };
}
function adminUser(row, profile) {
  return {
    id: row.id, email: row.email, role: row.role, status: row.status || 'active',
    suspensionReason: row.suspension_reason || '', suspendedAt: row.suspended_at || null,
    isMinor: row.is_minor, birthYear: row.birth_year, createdAt: row.created_at,
    username: profile?.username || '', displayName: profile?.display_name || row.email.split('@')[0],
    profileType: profile?.profile_type || 'estudante', isPublic: profile?.is_public !== false,
  };
}
function report(row) {
  return {
    id: row.id, reporterId: row.reporter_id, targetType: row.target_type, targetId: row.target_id,
    category: row.category, description: row.description || '', status: row.status,
    priority: row.priority, moderatorNote: row.moderator_note || '', createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

function techResource(row){ return { id:row.id, ownerId:row.owner_id, authorName:row.author_name, title:row.title, slug:row.slug, summary:row.summary||'', body:row.body||'', hub:row.hub, category:row.category, tags:row.tags||[], status:row.status, featured:row.featured===true, createdAt:row.created_at, updatedAt:row.updated_at }; }
function codeProject(row){ return { id:row.id, ownerId:row.owner_id, title:row.title, description:row.description||'', html:row.html||'', css:row.css||'', javascript:row.javascript||'', visibility:row.visibility||'private', createdAt:row.created_at, updatedAt:row.updated_at }; }
module.exports = { template, profile, project, publication, discussion, reply, report, adminUser, techResource, codeProject };
