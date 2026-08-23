import {
  feedResponseSchema,
  followMutationSchema,
  followSummarySchema,
  mediaReservationSchema,
  postMediaSchema,
  socialGraphSchema,
  socialPostSchema,
  socialPostsResponseSchema,
  type CreatePostInput,
  type FeedResponse,
  type FollowMutation,
  type FollowSummary,
  type MediaFinalizeInput,
  type MediaReservation,
  type MediaReservationInput,
  type PostMedia,
  type SocialGraph,
  type SocialPost,
  type SocialPostsResponse,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

const okSchema = {
  parse(input: unknown) {
    const value = input as { ok?: unknown };
    if (!value || value.ok !== true) throw new Error('Resposta inválida da API.');
    return { ok: true as const };
  },
};

export async function uploadToSignedMediaUrl(signedUrl: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('cacheControl', '31536000');
  form.append('', file);
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'x-upsert': 'false' },
    body: form,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    throw new Error(typeof record.message === 'string' ? record.message : 'Falha ao enviar a mídia.');
  }
}

export class SocialService {
  constructor(private readonly client: ApiClient) {}

  graph(): Promise<SocialGraph> {
    return this.client.request('/api/v4/social/me', socialGraphSchema);
  }

  feed(): Promise<FeedResponse> {
    return this.client.request('/api/v4/social/feed', feedResponseSchema);
  }

  publicFeed(): Promise<FeedResponse> {
    return this.client.request('/api/v4/social/public-feed', feedResponseSchema);
  }

  profile(username: string): Promise<FollowSummary> {
    return this.client.request(
      `/api/v4/profiles/${encodeURIComponent(username)}/social`,
      followSummarySchema,
    );
  }

  profilePosts(username: string): Promise<SocialPostsResponse> {
    return this.client.request(
      `/api/v4/profiles/${encodeURIComponent(username)}/posts`,
      socialPostsResponseSchema,
    );
  }

  follow(username: string): Promise<FollowMutation> {
    return this.client.request(
      `/api/v4/profiles/${encodeURIComponent(username)}/follow`,
      followMutationSchema,
      { method: 'POST' },
    );
  }

  unfollow(username: string): Promise<FollowMutation> {
    return this.client.request(
      `/api/v4/profiles/${encodeURIComponent(username)}/follow`,
      followMutationSchema,
      { method: 'DELETE' },
    );
  }

  reserveMedia(input: MediaReservationInput): Promise<MediaReservation> {
    return this.client.request('/api/v4/social/media/reserve', mediaReservationSchema, {
      method: 'POST',
      body: input,
    });
  }

  finalizeMedia(input: MediaFinalizeInput): Promise<PostMedia | null> {
    return this.client.request('/api/v4/social/media/finalize', postMediaSchema.nullable(), {
      method: 'POST',
      body: input,
    });
  }

  discardMedia(mediaId: string): Promise<{ ok: true }> {
    return this.client.request(`/api/v4/social/media/${encodeURIComponent(mediaId)}`, okSchema, {
      method: 'DELETE',
    });
  }

  createPost(input: CreatePostInput): Promise<SocialPost> {
    return this.client.request('/api/v4/social/posts', socialPostSchema, {
      method: 'POST',
      body: input,
    });
  }

  deletePost(postId: string): Promise<{ ok: true }> {
    return this.client.request(`/api/v4/social/posts/${encodeURIComponent(postId)}`, okSchema, {
      method: 'DELETE',
    });
  }
}
