import {
  adminDashboardSchema,
  adminMutationResultSchema,
  newsArticleSchema,
  newsContributorSchema,
  publicationSchema,
  verificationDecisionResultSchema,
  verificationRequestSchema,
  type AdminDashboard,
  type NewsArticle,
  type NewsContributor,
  type NewsContributorDecisionInput,
  type NewsEditorialDecisionInput,
  type Publication,
  type PublicationReviewInput,
  type ReportDecisionInput,
  type RoleMutationInput,
  type SubmitVerificationInput,
  type UserStatusInput,
  type VerificationDecisionInput,
  type VerificationDecisionResult,
  type VerificationRequest,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class AdminService {
  constructor(private readonly client: ApiClient) {}

  dashboard(): Promise<AdminDashboard> {
    return this.client.request('/api/v4/admin', adminDashboardSchema);
  }

  submitVerification(input: SubmitVerificationInput): Promise<VerificationRequest> {
    return this.client.request('/api/v4/verification', verificationRequestSchema, {
      method: 'POST',
      body: input,
    });
  }

  decideVerification(requestId: string, input: VerificationDecisionInput): Promise<VerificationDecisionResult> {
    return this.client.request(
      `/api/v4/admin/verification/${encodeURIComponent(requestId)}`,
      verificationDecisionResultSchema,
      { method: 'POST', body: input },
    );
  }

  decideReport(reportId: string, input: ReportDecisionInput): Promise<{ ok: boolean }> {
    return this.client.request(
      `/api/v4/admin/reports/${encodeURIComponent(reportId)}`,
      adminMutationResultSchema,
      { method: 'POST', body: input },
    );
  }

  reviewResearch(publicationId: string, input: PublicationReviewInput): Promise<Publication> {
    return this.client.request(
      `/api/v4/admin/research/${encodeURIComponent(publicationId)}`,
      publicationSchema,
      { method: 'POST', body: input },
    );
  }

  reviewNewsContributor(userId: string, input: NewsContributorDecisionInput): Promise<NewsContributor> {
    return this.client.request(
      `/api/v4/admin/news/contributors/${encodeURIComponent(userId)}`,
      newsContributorSchema,
      { method: 'POST', body: input },
    );
  }

  reviewNewsArticle(articleId: string, input: NewsEditorialDecisionInput): Promise<NewsArticle> {
    return this.client.request(
      `/api/v4/admin/news/articles/${encodeURIComponent(articleId)}`,
      newsArticleSchema,
      { method: 'POST', body: input },
    );
  }

  setUserStatus(userId: string, input: UserStatusInput): Promise<{ ok: boolean }> {
    return this.client.request(
      `/api/v4/admin/users/${encodeURIComponent(userId)}/status`,
      adminMutationResultSchema,
      { method: 'POST', body: input },
    );
  }

  changeRole(userId: string, input: RoleMutationInput, grant: boolean): Promise<{ ok: boolean }> {
    return this.client.request(
      `/api/v4/admin/users/${encodeURIComponent(userId)}/roles`,
      adminMutationResultSchema,
      { method: grant ? 'POST' : 'DELETE', body: input },
    );
  }
}
