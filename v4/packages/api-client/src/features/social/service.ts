import {
  feedResponseSchema,
  followMutationSchema,
  followSummarySchema,
  socialGraphSchema,
  type FeedResponse,
  type FollowMutation,
  type FollowSummary,
  type SocialGraph,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class SocialService {
  constructor(private readonly client: ApiClient) {}

  graph(): Promise<SocialGraph> {
    return this.client.request('/api/v4/social/me', socialGraphSchema);
  }

  feed(): Promise<FeedResponse> {
    return this.client.request('/api/v4/social/feed', feedResponseSchema);
  }

  profile(username: string): Promise<FollowSummary> {
    return this.client.request(
      `/api/v4/profiles/${encodeURIComponent(username)}/social`,
      followSummarySchema,
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
}
