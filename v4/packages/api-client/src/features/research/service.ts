import {
  publicationDeleteResultSchema,
  publicationSchema,
  researchWorkspaceSchema,
  type Publication,
  type PublicationDeleteResult,
  type ResearchDraftInput,
  type ResearchWorkspace,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class ResearchService {
  constructor(private readonly client: ApiClient) {}

  workspace(): Promise<ResearchWorkspace> {
    return this.client.request('/api/v4/research', researchWorkspaceSchema);
  }

  create(input: ResearchDraftInput): Promise<Publication> {
    return this.client.request('/api/v4/research', publicationSchema, {
      method: 'POST',
      body: input,
    });
  }

  update(id: string, input: ResearchDraftInput): Promise<Publication> {
    return this.client.request(`/api/v4/research/${encodeURIComponent(id)}`, publicationSchema, {
      method: 'PATCH',
      body: input,
    });
  }

  submit(id: string): Promise<Publication> {
    return this.client.request(
      `/api/v4/research/${encodeURIComponent(id)}/submit`,
      publicationSchema,
      { method: 'POST' },
    );
  }

  remove(id: string): Promise<PublicationDeleteResult> {
    return this.client.request(
      `/api/v4/research/${encodeURIComponent(id)}`,
      publicationDeleteResultSchema,
      { method: 'DELETE' },
    );
  }

  restore(id: string): Promise<PublicationDeleteResult> {
    return this.client.request(
      `/api/v4/research/${encodeURIComponent(id)}/restore`,
      publicationDeleteResultSchema,
      { method: 'POST' },
    );
  }

  purge(id: string): Promise<PublicationDeleteResult> {
    return this.client.request(
      `/api/v4/research/${encodeURIComponent(id)}/purge`,
      publicationDeleteResultSchema,
      { method: 'DELETE' },
    );
  }
}
