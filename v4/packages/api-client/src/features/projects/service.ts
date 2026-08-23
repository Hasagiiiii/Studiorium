import { projectSchema, type CreateProjectInput, type Project } from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class ProjectsService {
  constructor(private readonly client: ApiClient) {}

  create(input: CreateProjectInput): Promise<Project> {
    return this.client.request('/api/v4/projects', projectSchema, {
      method: 'POST',
      body: input,
    });
  }
}
