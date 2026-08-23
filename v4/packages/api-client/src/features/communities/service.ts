import {
  communityHubSchema,
  communityMembershipRequestsSchema,
  communityMembershipResultSchema,
  discussionSchema,
  type CommunityHub,
  type CommunityMembershipRequest,
  type CommunityMembershipResult,
  type Discussion,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class CommunitiesService {
  constructor(private readonly client: ApiClient) {}

  hub(slug: string): Promise<CommunityHub> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/hub`,
      communityHubSchema,
    );
  }

  createDiscussion(
    slug: string,
    input: { title: string; body: string; category: string },
  ): Promise<Discussion> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/discussions`,
      discussionSchema,
      { method: 'POST', body: input },
    );
  }

  join(slug: string): Promise<CommunityMembershipResult> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/membership`,
      communityMembershipResultSchema,
      { method: 'POST' },
    );
  }

  leave(slug: string): Promise<CommunityMembershipResult> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/membership`,
      communityMembershipResultSchema,
      { method: 'DELETE' },
    );
  }

  requestJoin(slug: string): Promise<CommunityMembershipResult> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/membership-request`,
      communityMembershipResultSchema,
      { method: 'POST' },
    );
  }

  requests(slug: string): Promise<CommunityMembershipRequest[]> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/membership-requests`,
      communityMembershipRequestsSchema,
    );
  }

  decideRequest(
    slug: string,
    userId: string,
    approve: boolean,
  ): Promise<CommunityMembershipResult> {
    const action = approve ? 'approve' : 'reject';
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/membership-requests/${encodeURIComponent(userId)}/${action}`,
      communityMembershipResultSchema,
      { method: 'POST' },
    );
  }
}
