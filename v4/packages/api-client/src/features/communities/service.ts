import {
  communityHubSchema,
  communityManagementSchema,
  communityMembershipRequestsSchema,
  communityMembershipResultSchema,
  communitySchema,
  discussionSchema,
  type Community,
  type CommunityHub,
  type CommunityLeadershipTransferInput,
  type CommunityManagement,
  type CommunityMediaKind,
  type CommunityMediaUploadInput,
  type CommunityMemberUpdateInput,
  type CommunityMembershipRequest,
  type CommunityMembershipResult,
  type CreateCommunityInput,
  type Discussion,
  type UpdateCommunityInput,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class CommunitiesService {
  constructor(private readonly client: ApiClient) {}

  create(input: CreateCommunityInput): Promise<Community> {
    return this.client.request('/api/v4/communities', communitySchema, {
      method: 'POST',
      body: input,
    });
  }

  hub(slug: string): Promise<CommunityHub> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/hub`,
      communityHubSchema,
    );
  }

  management(slug: string): Promise<CommunityManagement> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/manage`,
      communityManagementSchema,
    );
  }

  update(slug: string, input: UpdateCommunityInput): Promise<Community> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}`,
      communitySchema,
      { method: 'PATCH', body: input },
    );
  }

  updateMember(
    slug: string,
    userId: string,
    input: CommunityMemberUpdateInput,
  ): Promise<CommunityManagement> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/members/${encodeURIComponent(userId)}`,
      communityManagementSchema,
      { method: 'PATCH', body: input },
    );
  }

  transferLeadership(
    slug: string,
    input: CommunityLeadershipTransferInput,
  ): Promise<CommunityManagement> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/leadership`,
      communityManagementSchema,
      { method: 'POST', body: input },
    );
  }

  uploadMedia(slug: string, input: CommunityMediaUploadInput): Promise<Community> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/media`,
      communitySchema,
      { method: 'POST', body: input },
    );
  }

  removeMedia(slug: string, kind: CommunityMediaKind): Promise<Community> {
    return this.client.request(
      `/api/v4/communities/${encodeURIComponent(slug)}/media/${kind}`,
      communitySchema,
      { method: 'DELETE' },
    );
  }

  mediaUrl(slug: string, kind: CommunityMediaKind): string {
    return `/api/v4/communities/${encodeURIComponent(slug)}/media/${kind}`;
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
