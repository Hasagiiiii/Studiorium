import {
  communityMembershipRequestsSchema,
  communityMembershipResultSchema,
  type CommunityMembershipRequest,
  type CommunityMembershipResult,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class CommunitiesService {
  constructor(private readonly client: ApiClient) {}

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
