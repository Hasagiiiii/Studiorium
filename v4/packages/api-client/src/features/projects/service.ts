import {
  projectDeleteResultSchema,
  projectDetailSchema,
  projectSchema,
  projectTrashSchema,
  type CreateProjectInput,
  type Project,
  type ProjectDeleteResult,
  type ProjectDetail,
  type ProjectTrash,
  type UpdateProjectInput,
} from '@lorion/contracts';
import { ApiClient } from '../../core/client.js';

export class ProjectsService {
  constructor(private readonly client: ApiClient) {}

  create(input: CreateProjectInput): Promise<Project> {
    return this.client.request('/api/v4/projects', projectSchema, {
      method: 'POST',
      body: input,
    });
  }

  detail(projectId: string): Promise<ProjectDetail> {
    return this.client.request(`/api/v4/projects/${encodeURIComponent(projectId)}`, projectDetailSchema);
  }

  update(projectId: string, input: UpdateProjectInput): Promise<Project> {
    return this.client.request(`/api/v4/projects/${encodeURIComponent(projectId)}`, projectSchema, {
      method: 'PATCH',
      body: input,
    });
  }

  delete(projectId: string): Promise<ProjectDeleteResult> {
    return this.client.request(
      `/api/v4/projects/${encodeURIComponent(projectId)}`,
      projectDeleteResultSchema,
      { method: 'DELETE' },
    );
  }

  trash(): Promise<ProjectTrash> {
    return this.client.request('/api/v4/projects/trash', projectTrashSchema);
  }

  restore(projectId: string): Promise<ProjectDeleteResult> {
    return this.client.request(
      `/api/v4/projects/${encodeURIComponent(projectId)}/restore`,
      projectDeleteResultSchema,
      { method: 'POST' },
    );
  }

  purge(projectId: string): Promise<ProjectDeleteResult> {
    return this.client.request(
      `/api/v4/projects/${encodeURIComponent(projectId)}/purge`,
      projectDeleteResultSchema,
      { method: 'DELETE' },
    );
  }
}
