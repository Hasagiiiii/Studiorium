import { bootstrapSchema, type BootstrapPayload } from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class BootstrapService {
  constructor(private readonly client: ApiClient) {}

  load(): Promise<BootstrapPayload> {
    return this.client.request('/api/v4/bootstrap', bootstrapSchema);
  }
}
