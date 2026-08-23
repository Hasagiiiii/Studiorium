import {
  communityMembershipResultSchema,
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
}
