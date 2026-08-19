const { safePublicName } = require('./public-identity');

function template(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    docType: row.doc_type,
    style: row.style,
    description: row.description,
    downloads: row.downloads,
    featured: row.featured,
    sections: row.sections || [],
  };
}
function profile(row) {
  return {
    userId: row.user_id,
    username: row.username,
    displayName: safePublicName(row.display_name, row.username),
    bio: row.bio || '',
    profileType: row.profile_type,
    course: row.course || '',
    institution: row.institution || '',
    educationLevel: row.education_level || '',
    verificationStatus: row.verification_status || 'unverified',
    verifiedSpecialty: row.verified_specialty || '',
    contributionStatus: row.contribution_status || 'member',
    verifiedAt: row.verified_at || null,
    createdAt: row.created_at,
  };
}
function project(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    templateId: row.template_id,
    type: row.type,
    visibility: row.visibility || 'private',
    sections: row.sections || [],
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
  };
}
function publicProject(row) {
  return {
    id: row.id,
    ownerId: row.user_id,
    title: row.title,
    type: row.type,
    sections: row.sections || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function publication(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    authorName: safePublicName(row.author_name),
    title: row.title,
    slug: row.slug,
    abstract: row.abstract,
    content: row.content || '',
    area: row.area,
    level: row.level,
    keywords: row.keywords || [],
    license: row.license,
    status: row.status,
    views: row.views || 0,
    downloads: row.downloads || 0,
    boosts: row.boosts || 0,
    featured: row.featured === true,
    createdAt: row.created_at,
    publishedAt: row.published_at || null,
    fileName: row.file_name || null,
    fileMime: row.file_mime || null,
    coverName: row.cover_name || null,
    coverMime: row.cover_mime || null,
  };
}
function discussion(row) {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: safePublicName(row.author_name),
    title: row.title,
    body: row.body,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
  };
}
function reply(row) {
  return {
    id: row.id,
    discussionId: row.discussion_id,
    authorId: row.author_id,
    authorName: safePublicName(row.author_name),
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}
function adminUser(row, profile) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status || 'active',
    suspensionReason: row.suspension_reason || '',
    suspendedAt: row.suspended_at || null,
    isMinor: row.is_minor,
    birthYear: row.birth_year,
    createdAt: row.created_at,
    username: profile?.username || '',
    displayName: profile?.display_name || row.email.split('@')[0],
    profileType: profile?.profile_type || 'estudante',
    isPublic: profile?.is_public !== false,
    course: profile?.course || '',
    institution: profile?.institution || '',
    educationLevel: profile?.education_level || '',
    verificationStatus: profile?.verification_status || 'unverified',
    verifiedSpecialty: profile?.verified_specialty || '',
    contributionStatus: profile?.contribution_status || 'member',
  };
}

function verificationRequest(row, profile = null) {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: profile?.display_name || '',
    username: profile?.username || '',
    profileType: row.profile_type,
    course: row.course || '',
    institution: row.institution || '',
    educationLevel: row.education_level || '',
    specialty: row.specialty || '',
    credentialReference: row.credential_reference || '',
    statement: row.statement || '',
    status: row.status,
    reviewerId: row.reviewer_id || null,
    reviewNote: row.review_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function notification(row) {
  return {
    id: row.id,
    type: row.type || 'system',
    title: row.title,
    message: row.message || '',
    link: row.link || '',
    readAt: row.read_at || null,
    createdAt: row.created_at,
  };
}

function book(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description || '',
    category: row.category || 'Humanidades',
    coverTheme: row.cover_theme || 'umber',
    featured: row.featured === true,
  };
}

function bookSave(row) {
  return {
    bookId: row.book_id,
    shelfStatus: row.shelf_status || 'want_to_read',
    createdAt: row.created_at,
  };
}
function report(row) {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    category: row.category,
    description: row.description || '',
    status: row.status,
    priority: row.priority,
    moderatorNote: row.moderator_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at || null,
  };
}

function techResource(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    authorName: safePublicName(row.author_name),
    title: row.title,
    slug: row.slug,
    summary: row.summary || '',
    body: row.body || '',
    hub: row.hub,
    category: row.category,
    tags: row.tags || [],
    status: row.status,
    featured: row.featured === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function codeProject(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description || '',
    html: row.html || '',
    css: row.css || '',
    javascript: row.javascript || '',
    visibility: row.visibility || 'private',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
  };
}

function newsContributor(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    status: row.status,
    area: row.area || '',
    institution: row.institution || '',
    portfolioUrl: row.portfolio_url || '',
    statement: row.statement || '',
    reviewerId: row.reviewer_id || null,
    reviewNote: row.review_note || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function newsArticle(row) {
  return {
    id: row.id,
    contributorId: row.contributor_id,
    authorName: safePublicName(row.author_name),
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    category: row.category,
    sources: row.sources || [],
    status: row.status,
    aiReviewStatus: row.ai_review_status,
    aiReview: row.ai_review || {},
    editorialNote: row.editorial_note || '',
    featured: row.featured === true,
    hypes: Number(row.hypes || 0),
    certifiedBy: row.certified_by || null,
    certifiedAt: row.certified_at || null,
    publishedAt: row.published_at || null,
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function customTemplate(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description || '',
    document: row.document || { settings: {}, blocks: [] },
    sourceType: row.source_type || 'editor',
    status: row.status || 'private',
    featured: row.featured === true,
    deletedAt: row.deleted_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
module.exports = {
  template,
  profile,
  project,
  publicProject,
  publication,
  discussion,
  reply,
  report,
  adminUser,
  techResource,
  codeProject,
  newsContributor,
  newsArticle,
  customTemplate,
  verificationRequest,
  notification,
  book,
  bookSave,
};
