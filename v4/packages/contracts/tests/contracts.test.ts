import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bookshelfStatusSchema,
  commentBodySchema,
  commentParentIdSchema,
  communityHubSchema,
  communityMembershipRequestSchema,
  communityMembershipResultSchema,
  contentInteractionsSchema,
  createCommentInputSchema,
  createPostInputSchema,
  newsArticleStatusSchema,
  parseBootstrap,
  postDetailSchema,
  profileDetailSchema,
  profileSchema,
  projectSchema,
  publicUserSchema,
  socialPostSchema,
  updateCommentInputSchema,
} from '../src/index.js';

test('bootstrap aplica defaults seguros para payload vazio', () => {
  const payload = parseBootstrap({});

  assert.deepEqual(payload.posts, []);
  assert.deepEqual(payload.publications, []);
  assert.deepEqual(payload.news, []);
  assert.deepEqual(payload.books, []);
  assert.deepEqual(payload.bookReviews, []);
  assert.deepEqual(payload.projects, []);
  assert.deepEqual(payload.discussions, []);
  assert.deepEqual(payload.profiles, []);
  assert.deepEqual(payload.communities, []);
  assert.equal(payload.settings.site_title, 'Lorion');
  assert.equal(payload.settings.registrations_open, true);
  assert.equal(payload.capabilities.passwordResetAvailable, false);
  assert.equal(payload.user, null);
});

test('bootstrap só habilita recuperação de senha quando o backend declara a capability', () => {
  const payload = parseBootstrap({
    capabilities: { passwordResetAvailable: true },
  });

  assert.equal(payload.capabilities.passwordResetAvailable, true);
});

test('usuário público rejeita e-mail inválido em runtime', () => {
  assert.throws(() =>
    publicUserSchema.parse({
      id: 'usr_1',
      displayName: 'Pessoa',
      email: 'nao-e-email',
    }),
  );
});

test('participação em comunidade exige contagem válida e estado explícito', () => {
  const membership = communityMembershipResultSchema.parse({
    communityId: 'community_1',
    joined: true,
    membershipStatus: 'active',
    role: 'member',
    memberModerationStatus: 'clear',
    memberCount: 1,
  });

  assert.equal(membership.joined, true);
  assert.equal(membership.membershipStatus, 'active');
  assert.equal(membership.memberCount, 1);
  assert.throws(() =>
    communityMembershipResultSchema.parse({
      ...membership,
      memberCount: -1,
    }),
  );
});

test('solicitação de comunidade mantém identidade navegável e data opcional', () => {
  const request = communityMembershipRequestSchema.parse({
    userId: 'usr_1',
    username: 'pessoa',
    displayName: 'Pessoa',
    requestedAt: '2026-08-23T15:00:00.000Z',
  });

  assert.equal(request.username, 'pessoa');
  assert.equal(request.userId, 'usr_1');
});

test('hub de comunidade mantém membros, posts e discussões relacionais', () => {
  const hub = communityHubSchema.parse({
    members: [
      {
        userId: 'usr_1',
        username: 'pessoa',
        displayName: 'Pessoa',
        role: 'member',
        joinedAt: null,
      },
    ],
    posts: [
      {
        id: 'pst_1',
        authorId: 'usr_1',
        authorUsername: 'pessoa',
        authorName: 'Pessoa',
        title: '',
        body: 'Atualização da comunidade',
        community: { id: 'community_1', slug: 'geral', name: 'Geral' },
        visibility: 'public',
        moderationStatus: 'clear',
        createdAt: null,
        updatedAt: null,
      },
    ],
    discussions: [
      {
        id: 'dsc_1',
        authorId: 'usr_1',
        authorName: 'Pessoa',
        title: 'Tema da comunidade',
        body: 'Conteúdo',
        category: 'Geral',
        status: 'published',
        createdAt: null,
        updatedAt: null,
      },
    ],
    canCreateDiscussion: true,
  });

  assert.equal(hub.members[0]?.username, 'pessoa');
  assert.equal(hub.posts[0]?.authorId, 'usr_1');
  assert.equal(hub.discussions[0]?.authorId, 'usr_1');
  assert.equal(hub.canCreateDiscussion, true);
});

test('post social preserva autor, comunidade opcional e visibilidade explícita', () => {
  const post = socialPostSchema.parse({
    id: 'pst_1',
    authorId: 'usr_1',
    authorUsername: 'pessoa',
    authorName: 'Pessoa',
    body: 'Conteúdo social',
    visibility: 'public',
    moderationStatus: 'clear',
    createdAt: null,
    updatedAt: null,
  });
  const input = createPostInputSchema.parse({
    title: '  Título  ',
    body: '  Texto  ',
    communitySlug: null,
  });

  assert.equal(post.community, null);
  assert.equal(input.title, 'Título');
  assert.equal(input.body, 'Texto');
  assert.throws(() => createPostInputSchema.parse({ body: '' }));
});

test('interações têm defaults consistentes e comentário exige texto válido', () => {
  const interactions = contentInteractionsSchema.parse({});
  const comment = createCommentInputSchema.parse({ body: '  Resposta útil  ' });
  const update = updateCommentInputSchema.parse({ body: '  Texto editado  ' });

  assert.equal(interactions.likeCount, 0);
  assert.equal(interactions.commentCount, 0);
  assert.equal(interactions.viewerLiked, false);
  assert.equal(interactions.canInteract, false);
  assert.deepEqual(interactions.comments, []);
  assert.equal(comment.body, 'Resposta útil');
  assert.equal(comment.parentId, null);
  assert.equal(update.body, 'Texto editado');
  assert.equal(commentBodySchema.parse('  válido  '), 'válido');
  assert.equal(commentParentIdSchema.parse('  cmt_1  '), 'cmt_1');
  assert.equal(commentParentIdSchema.parse(null), null);
  assert.throws(() => commentBodySchema.parse(''));
  assert.throws(() => commentBodySchema.parse('x'.repeat(2001)));
  assert.throws(() => commentParentIdSchema.parse('   '));
  assert.throws(() => commentParentIdSchema.parse('x'.repeat(181)));
  assert.throws(() => createCommentInputSchema.parse({ body: '' }));
  assert.throws(() => createCommentInputSchema.parse({ body: 'x'.repeat(2001) }));
  assert.throws(() => updateCommentInputSchema.parse({ body: '' }));
  assert.throws(() => updateCommentInputSchema.parse({ body: 'x'.repeat(2001) }));
});

test('detalhe de publicação reúne post e interações sem inventar contadores', () => {
  const detail = postDetailSchema.parse({
    post: {
      id: 'pst_1',
      authorId: 'usr_1',
      authorUsername: 'pessoa',
      authorName: 'Pessoa',
      body: 'Conteúdo social',
      visibility: 'public',
      moderationStatus: 'clear',
      createdAt: null,
      updatedAt: null,
    },
    interactions: {
      likeCount: 2,
      commentCount: 1,
      viewerLiked: true,
      canInteract: true,
      comments: [
        {
          id: 'cmt_1',
          contentId: 'pst_1',
          authorId: 'usr_2',
          authorUsername: 'leitor',
          authorName: 'Leitor',
          body: 'Comentário',
          moderationStatus: 'clear',
          createdAt: null,
          updatedAt: null,
        },
      ],
    },
  });

  assert.equal(detail.interactions.likeCount, 2);
  assert.equal(detail.interactions.comments[0]?.canEdit, false);
});

test('perfil mantém estante privada por padrão e detalhe social com coleções vazias', () => {
  const profile = profileSchema.parse({
    userId: 'usr_1',
    username: 'pessoa',
    displayName: 'Pessoa',
    isPublic: true,
    createdAt: null,
    updatedAt: null,
    verifiedAt: null,
  });
  const detail = profileDetailSchema.parse({ profile, isOwnProfile: false });

  assert.equal(profile.bookshelfPublic, false);
  assert.deepEqual(detail.posts, []);
  assert.deepEqual(detail.publications, []);
  assert.deepEqual(detail.projects, []);
  assert.deepEqual(detail.communities, []);
  assert.deepEqual(detail.bookshelf, []);
});

test('estante aceita todos os estados funcionais definidos pelo produto', () => {
  assert.equal(bookshelfStatusSchema.parse('want_to_read'), 'want_to_read');
  assert.equal(bookshelfStatusSchema.parse('reading'), 'reading');
  assert.equal(bookshelfStatusSchema.parse('read'), 'read');
  assert.equal(bookshelfStatusSchema.parse('abandoned'), 'abandoned');
  assert.throws(() => bookshelfStatusSchema.parse('unknown'));
});

test('notícia aceita somente estados editoriais definidos pelo domínio', () => {
  assert.equal(newsArticleStatusSchema.parse('draft'), 'draft');
  assert.equal(newsArticleStatusSchema.parse('published'), 'published');
  assert.equal(newsArticleStatusSchema.parse('archived'), 'archived');
  assert.throws(() => newsArticleStatusSchema.parse('unknown'));
});

test('projeto v4 exige ownerId e não aceita o contrato legado userId sozinho', () => {
  assert.throws(() =>
    projectSchema.parse({
      id: 'prj_1',
      userId: 'usr_legado',
      title: 'Projeto legado',
      visibility: 'public',
      sections: [],
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
    }),
  );
});
