import {
  newsArticleSchema,
  newsContributorSchema,
  newsDeleteResultSchema,
  newsWorkspaceSchema,
  type ApplyNewsContributorInput,
  type NewsArticle,
  type NewsContributor,
  type NewsDeleteResult,
  type NewsDraftInput,
  type NewsWorkspace,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class NewsService {
  constructor(private readonly client: ApiClient) {}

  workspace(): Promise<NewsWorkspace> {
    return this.client.request('/api/v4/news/workspace', newsWorkspaceSchema);
  }

  applyContributor(input: ApplyNewsContributorInput): Promise<NewsContributor> {
    return this.client.request('/api/v4/news/contributor', newsContributorSchema, {
      method: 'POST',
      body: input,
    });
  }

  create(input: NewsDraftInput): Promise<NewsArticle> {
    return this.client.request('/api/v4/news', newsArticleSchema, {
      method: 'POST',
      body: input,
    });
  }

  update(id: string, input: NewsDraftInput): Promise<NewsArticle> {
    return this.client.request(`/api/v4/news/${encodeURIComponent(id)}`, newsArticleSchema, {
      method: 'PATCH',
      body: input,
    });
  }

  submit(id: string): Promise<NewsArticle> {
    return this.client.request(`/api/v4/news/${encodeURIComponent(id)}/submit`, newsArticleSchema, {
      method: 'POST',
    });
  }

  remove(id: string): Promise<NewsDeleteResult> {
    return this.client.request(`/api/v4/news/${encodeURIComponent(id)}`, newsDeleteResultSchema, {
      method: 'DELETE',
    });
  }

  restore(id: string): Promise<NewsDeleteResult> {
    return this.client.request(
      `/api/v4/news/${encodeURIComponent(id)}/restore`,
      newsDeleteResultSchema,
      { method: 'POST' },
    );
  }

  purge(id: string): Promise<NewsDeleteResult> {
    return this.client.request(
      `/api/v4/news/${encodeURIComponent(id)}/purge`,
      newsDeleteResultSchema,
      { method: 'DELETE' },
    );
  }
}
