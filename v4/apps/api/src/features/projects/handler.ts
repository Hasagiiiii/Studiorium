import { createProjectInputSchema, projectSchema, type Project } from '@lorion/contracts';
import { createProject } from '@lorion/database';
import type { ApiRequest } from '../../core/http/types.js';
import { readJson } from '../../core/http/body.js';
import { requireSessionUser } from '../../auth/session.js';
import { entityId } from '../../core/security/token.js';
import { badRequest } from '../../core/http/errors.js';

export async function createUserProject(request: ApiRequest): Promise<Project> {
  const user = await requireSessionUser(request);
  const parsed = createProjectInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados do projeto.', 'INVALID_PROJECT');

  return projectSchema.parse(
    await createProject({
      ...parsed.data,
      id: entityId('prj'),
      ownerId: user.id,
    }),
  );
}
