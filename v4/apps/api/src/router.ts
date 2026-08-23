import type { ApiRequest, ApiResponse } from './core/http/types.js';
import { HttpError, notFound } from './core/http/errors.js';
import { json, noContent } from './core/http/response.js';
import { assertSameOrigin } from './middleware/origin.js';
import {
  adminDashboard,
  changeUserRole,
  changeUserStatus,
  reviewReport,
} from './features/admin/handler.js';
import { bootstrap } from './features/bootstrap/handler.js';
import {
  changePassword,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
} from './features/auth/handler.js';
import {
  communityHub,
  createDiscussionInCommunity,
  decideCommunityMembershipRequest,
  joinCommunity,
  leaveCommunityMembership,
  pendingCommunityMembershipRequests,
  requestCommunityMembership,
} from './features/communities/handler.js';
import {
  createComment,
  deleteComment,
  postDetail,
  setLike,
  updateComment,
} from './features/interactions/handler.js';
import {
  bookDetail,
  createBook,
  removeBook,
  reviewBook,
  saveBook,
} from './features/library/handler.js';
import { createReport, setProfileSafetyControl } from './features/moderation/handler.js';
import {
  notifications,
  readAllNotifications,
  readNotification,
} from './features/notifications/handler.js';
import { createPost } from './features/posts/handler.js';
import {
  profileDetail,
  removeOwnProfileMedia,
  serveProfileMedia,
  updateBookshelfPrivacy,
  updateOwnProfile,
  uploadOwnProfileMedia,
} from './features/profiles/handler.js';
import {
  createUserProject,
  deleteUserProject,
  projectDetail,
  projectTrash,
  purgeUserProject,
  restoreUserProject,
  updateUserProject,
} from './features/projects/handler.js';
import { followingFeed, myGraph, profileSocial, setFollow } from './features/social/handler.js';
import { decideVerification, submitVerification } from './features/verification/handler.js';

function requestPath(request: ApiRequest): string {
  const host = request.headers.host || 'localhost';
  const url = new URL(request.url || '/', `http://${host}`);
  const rewritten = url.searchParams.get('path');
  if (rewritten) return rewritten.startsWith('/') ? rewritten : `/${rewritten}`;
  return url.pathname;
}

function methodOf(request: ApiRequest): string {
  return String(request.method || 'GET').toUpperCase();
}

async function route(request: ApiRequest, response: ApiResponse) {
  const method = methodOf(request);
  const path = requestPath(request);

  if (method === 'OPTIONS') return noContent(response);
  assertSameOrigin(request);

  if (method === 'GET' && path === '/api/v4/health') {
    return json(response, 200, { ok: true, version: '4.0.0-alpha.1' });
  }
  if (method === 'GET' && path === '/api/v4/bootstrap') {
    return json(response, 200, await bootstrap(request));
  }

  if (method === 'POST' && path === '/api/v4/auth/login') {
    return json(response, 200, await login(request, response));
  }
  if (method === 'POST' && path === '/api/v4/auth/register') {
    return json(response, 201, await register(request, response));
  }
  if (method === 'POST' && path === '/api/v4/auth/change-password') {
    return json(response, 200, await changePassword(request, response));
  }
  if (method === 'POST' && path === '/api/v4/auth/password-reset/request') {
    return json(response, 200, await requestPasswordReset(request));
  }
  if (method === 'POST' && path === '/api/v4/auth/password-reset') {
    return json(response, 200, await resetPassword(request));
  }
  if (method === 'POST' && path === '/api/v4/auth/logout') {
    return json(response, 200, await logout(request, response));
  }

  if (method === 'POST' && path === '/api/v4/posts') {
    return json(response, 201, await createPost(request));
  }

  const postDetailMatch = path.match(/^\/api\/v4\/posts\/([^/]+)\/detail$/);
  if (postDetailMatch && method === 'GET') {
    return json(response, 200, await postDetail(request, postDetailMatch[1] || ''));
  }

  const contentLikeMatch = path.match(/^\/api\/v4\/content\/([^/]+)\/like$/);
  if (contentLikeMatch && method === 'POST') {
    return json(response, 200, await setLike(request, contentLikeMatch[1] || '', true));
  }
  if (contentLikeMatch && method === 'DELETE') {
    return json(response, 200, await setLike(request, contentLikeMatch[1] || '', false));
  }

  const contentCommentMatch = path.match(/^\/api\/v4\/content\/([^/]+)\/comments$/);
  if (contentCommentMatch && method === 'POST') {
    return json(response, 201, await createComment(request, contentCommentMatch[1] || ''));
  }

  const contentCommentItemMatch = path.match(/^\/api\/v4\/content\/([^/]+)\/comments\/([^/]+)$/);
  if (contentCommentItemMatch && method === 'PATCH') {
    return json(
      response,
      200,
      await updateComment(
        request,
        contentCommentItemMatch[1] || '',
        contentCommentItemMatch[2] || '',
      ),
    );
  }
  if (contentCommentItemMatch && method === 'DELETE') {
    return json(
      response,
      200,
      await deleteComment(
        request,
        contentCommentItemMatch[1] || '',
        contentCommentItemMatch[2] || '',
      ),
    );
  }

  const communityHubMatch = path.match(/^\/api\/v4\/communities\/([^/]+)\/hub$/);
  if (communityHubMatch && method === 'GET') {
    return json(response, 200, await communityHub(request, communityHubMatch[1] || ''));
  }

  const communityDiscussionMatch = path.match(/^\/api\/v4\/communities\/([^/]+)\/discussions$/);
  if (communityDiscussionMatch && method === 'POST') {
    return json(
      response,
      201,
      await createDiscussionInCommunity(request, communityDiscussionMatch[1] || ''),
    );
  }

  const communityMembershipMatch = path.match(/^\/api\/v4\/communities\/([^/]+)\/membership$/);
  if (communityMembershipMatch && method === 'POST') {
    return json(response, 200, await joinCommunity(request, communityMembershipMatch[1] || ''));
  }
  if (communityMembershipMatch && method === 'DELETE') {
    return json(
      response,
      200,
      await leaveCommunityMembership(request, communityMembershipMatch[1] || ''),
    );
  }

  const communityRequestMatch = path.match(/^\/api\/v4\/communities\/([^/]+)\/membership-request$/);
  if (communityRequestMatch && method === 'POST') {
    return json(
      response,
      200,
      await requestCommunityMembership(request, communityRequestMatch[1] || ''),
    );
  }

  const communityRequestsMatch = path.match(
    /^\/api\/v4\/communities\/([^/]+)\/membership-requests$/,
  );
  if (communityRequestsMatch && method === 'GET') {
    return json(
      response,
      200,
      await pendingCommunityMembershipRequests(request, communityRequestsMatch[1] || ''),
    );
  }

  const communityRequestDecisionMatch = path.match(
    /^\/api\/v4\/communities\/([^/]+)\/membership-requests\/([^/]+)\/(approve|reject)$/,
  );
  if (communityRequestDecisionMatch && method === 'POST') {
    return json(
      response,
      200,
      await decideCommunityMembershipRequest(
        request,
        communityRequestDecisionMatch[1] || '',
        communityRequestDecisionMatch[2] || '',
        communityRequestDecisionMatch[3] === 'approve',
      ),
    );
  }

  if (method === 'POST' && path === '/api/v4/books') {
    return json(response, 201, await createBook(request));
  }
  const bookDetailMatch = path.match(/^\/api\/v4\/books\/([^/]+)\/detail$/);
  if (bookDetailMatch && method === 'GET') {
    return json(response, 200, await bookDetail(request, bookDetailMatch[1] || ''));
  }
  const bookShelfMatch = path.match(/^\/api\/v4\/books\/([^/]+)\/shelf$/);
  if (bookShelfMatch && method === 'PUT') {
    return json(response, 200, await saveBook(request, bookShelfMatch[1] || ''));
  }
  if (bookShelfMatch && method === 'DELETE') {
    return json(response, 200, await removeBook(request, bookShelfMatch[1] || ''));
  }
  const bookReviewMatch = path.match(/^\/api\/v4\/books\/([^/]+)\/review$/);
  if (bookReviewMatch && method === 'PUT') {
    return json(response, 200, await reviewBook(request, bookReviewMatch[1] || ''));
  }

  if (method === 'POST' && path === '/api/v4/projects') {
    return json(response, 201, await createUserProject(request));
  }
  if (method === 'GET' && path === '/api/v4/projects/trash') {
    return json(response, 200, await projectTrash(request));
  }
  const projectDetailMatch = path.match(/^\/api\/v4\/projects\/([^/]+)\/detail$/);
  if (projectDetailMatch && method === 'GET') {
    return json(response, 200, await projectDetail(request, projectDetailMatch[1] || ''));
  }
  const projectItemMatch = path.match(/^\/api\/v4\/projects\/([^/]+)$/);
  if (projectItemMatch && method === 'PATCH') {
    return json(response, 200, await updateUserProject(request, projectItemMatch[1] || ''));
  }
  if (projectItemMatch && method === 'DELETE') {
    return json(response, 200, await deleteUserProject(request, projectItemMatch[1] || ''));
  }
  const projectRestoreMatch = path.match(/^\/api\/v4\/projects\/([^/]+)\/restore$/);
  if (projectRestoreMatch && method === 'POST') {
    return json(response, 200, await restoreUserProject(request, projectRestoreMatch[1] || ''));
  }
  const projectPurgeMatch = path.match(/^\/api\/v4\/projects\/([^/]+)\/purge$/);
  if (projectPurgeMatch && method === 'DELETE') {
    return json(response, 200, await purgeUserProject(request, projectPurgeMatch[1] || ''));
  }

  if (method === 'GET' && path === '/api/v4/notifications') {
    return json(response, 200, await notifications(request));
  }
  if (method === 'POST' && path === '/api/v4/notifications/read-all') {
    return json(response, 200, await readAllNotifications(request));
  }
  const notificationReadMatch = path.match(/^\/api\/v4\/notifications\/([^/]+)\/read$/);
  if (notificationReadMatch && method === 'POST') {
    return json(
      response,
      200,
      await readNotification(request, decodeURIComponent(notificationReadMatch[1] || '')),
    );
  }

  if (method === 'PATCH' && path === '/api/v4/profiles/me') {
    return json(response, 200, await updateOwnProfile(request));
  }
  if (method === 'PATCH' && path === '/api/v4/profiles/me/bookshelf-privacy') {
    return json(response, 200, await updateBookshelfPrivacy(request));
  }
  if (method === 'POST' && path === '/api/v4/profiles/me/media') {
    return json(response, 200, await uploadOwnProfileMedia(request));
  }
  const ownProfileMediaMatch = path.match(/^\/api\/v4\/profiles\/me\/media\/(avatar|cover)$/);
  if (ownProfileMediaMatch && method === 'DELETE') {
    return json(response, 200, await removeOwnProfileMedia(request, ownProfileMediaMatch[1] || ''));
  }
  const profileMediaMatch = path.match(/^\/api\/v4\/profiles\/([^/]+)\/media\/(avatar|cover)$/);
  if (profileMediaMatch && method === 'GET') {
    await serveProfileMedia(
      request,
      response,
      profileMediaMatch[1] || '',
      profileMediaMatch[2] || '',
    );
    return;
  }
  const profileDetailMatch = path.match(/^\/api\/v4\/profiles\/([^/]+)\/detail$/);
  if (profileDetailMatch && method === 'GET') {
    return json(response, 200, await profileDetail(request, profileDetailMatch[1] || ''));
  }

  if (method === 'GET' && path === '/api/v4/social/me') {
    return json(response, 200, await myGraph(request));
  }
  if (method === 'GET' && path === '/api/v4/social/feed') {
    return json(response, 200, await followingFeed(request));
  }

  const profileSocialMatch = path.match(/^\/api\/v4\/profiles\/([^/]+)\/social$/);
  if (profileSocialMatch && method === 'GET') {
    return json(
      response,
      200,
      await profileSocial(request, decodeURIComponent(profileSocialMatch[1] || '')),
    );
  }

  const followMatch = path.match(/^\/api\/v4\/profiles\/([^/]+)\/follow$/);
  if (followMatch && method === 'POST') {
    return json(
      response,
      200,
      await setFollow(request, decodeURIComponent(followMatch[1] || ''), true),
    );
  }
  if (followMatch && method === 'DELETE') {
    return json(
      response,
      200,
      await setFollow(request, decodeURIComponent(followMatch[1] || ''), false),
    );
  }

  const safetyMatch = path.match(/^\/api\/v4\/profiles\/([^/]+)\/(block|mute)$/);
  if (safetyMatch && (method === 'POST' || method === 'DELETE')) {
    return json(
      response,
      200,
      await setProfileSafetyControl(
        request,
        safetyMatch[1] || '',
        safetyMatch[2] as 'block' | 'mute',
        method === 'POST',
      ),
    );
  }
  if (method === 'POST' && path === '/api/v4/reports') {
    return json(response, 201, await createReport(request));
  }

  if (method === 'POST' && path === '/api/v4/verification') {
    return json(response, 201, await submitVerification(request));
  }

  if (method === 'GET' && path === '/api/v4/admin') {
    return json(response, 200, await adminDashboard(request));
  }
  const adminReportMatch = path.match(/^\/api\/v4\/admin\/reports\/([^/]+)$/);
  if (adminReportMatch && method === 'POST') {
    return json(response, 200, await reviewReport(request, adminReportMatch[1] || ''));
  }
  const adminVerificationMatch = path.match(/^\/api\/v4\/admin\/verification\/([^/]+)$/);
  if (adminVerificationMatch && method === 'POST') {
    return json(response, 200, await decideVerification(request, adminVerificationMatch[1] || ''));
  }
  const adminUserStatusMatch = path.match(/^\/api\/v4\/admin\/users\/([^/]+)\/status$/);
  if (adminUserStatusMatch && method === 'POST') {
    return json(response, 200, await changeUserStatus(request, adminUserStatusMatch[1] || ''));
  }
  const adminUserRoleMatch = path.match(/^\/api\/v4\/admin\/users\/([^/]+)\/roles$/);
  if (adminUserRoleMatch && (method === 'POST' || method === 'DELETE')) {
    return json(
      response,
      200,
      await changeUserRole(request, adminUserRoleMatch[1] || '', method === 'POST'),
    );
  }

  throw notFound('Endpoint não encontrado.');
}

export async function handleApi(request: ApiRequest, response: ApiResponse) {
  try {
    await route(request, response);
  } catch (cause) {
    const record =
      cause && typeof cause === 'object' ? (cause as { status?: unknown; code?: unknown }) : {};
    const status =
      cause instanceof HttpError
        ? cause.status
        : typeof record.status === 'number'
          ? record.status
          : 500;
    const code =
      cause instanceof HttpError
        ? cause.code
        : typeof record.code === 'string'
          ? record.code
          : undefined;
    const publicMessage =
      status >= 500
        ? 'O serviço encontrou um erro inesperado.'
        : cause instanceof Error
          ? cause.message
          : 'Não foi possível concluir a solicitação.';

    if (status >= 500) console.error('[Lorion v4 API]', cause);
    json(response, status, code ? { error: publicMessage, code } : { error: publicMessage });
  }
}
