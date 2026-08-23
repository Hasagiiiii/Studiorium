import {
  createReportResultSchema,
  safetyControlResultSchema,
  type CreateReportInput,
  type CreateReportResult,
  type SafetyControlKind,
  type SafetyControlResult,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class ModerationService {
  constructor(private readonly client: ApiClient) {}

  setProfileControl(
    username: string,
    kind: SafetyControlKind,
    enabled: boolean,
  ): Promise<SafetyControlResult> {
    return this.client.request(
      `/api/v4/profiles/${encodeURIComponent(username)}/${kind}`,
      safetyControlResultSchema,
      { method: enabled ? 'POST' : 'DELETE' },
    );
  }

  report(input: CreateReportInput): Promise<CreateReportResult> {
    return this.client.request('/api/v4/reports', createReportResultSchema, {
      method: 'POST',
      body: input,
    });
  }
}
