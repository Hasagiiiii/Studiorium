import {
  createProjectInputSchema,
  projectDeleteResultSchema,
  projectDetailSchema,
  projectSchema,
  projectTrashSchema,
  updateProjectInputSchema,
  type Project,
  type ProjectDeleteResult,
  type ProjectDetail,
  type ProjectTrash,
} from '@lorion/contracts';
import {
  createProject,
  findProjectForViewer,
  listDeletedUserProjects,
  purgeOwnedProject,
  restoreOwnedProject,
  softDeleteOwnedProject,
  updateOwnedProject,
} from '@lorion/database';
import type { ApiRequest } from '../../core/http/types.js';
import { readJson } from '../../core/http/body.js';
import { requireSessionUser, sessionUser } from '../../auth/session.js';
import { entityId } from '../../core/security/token.js';
import { badRequest, notFound } from '../../core/http/errors.js';
import { assertPublishableText } from '../../core/moderation/text.js';

function projectId(value: string): string {
  try {
    return decodeURIComponent(value || '').trim();
  } catch {
    return '';
  }
}

function moderateProject(input: { title: string; notes: string; sections: Array<{ name: string; content: string }> }) {
  assertPublishableText(
    [input.title, input.notes, ...input.sections.flatMap((section) => [section.name, section.content])]
      .filter(Boolean)
      .join('\n'),
    'Projeto',
  );
}

export async function createUserProject(request: ApiRequest): Promise<Project> {
  const user = await requireSessionUser(request);
  const parsed = createProjectInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise os dados do projeto.', 'INVALID_PROJECT');
  if (parsed.data.visibility === 'public') {
    assertPublishableText(`${parsed.data.title}\n${parsed.data.notes}`, 'Projeto');
  }

  return projectSchema.parse(
    await createProject({
      ...parsed.data,
      id: entityId('prj'),
      ownerId: user.id,
    }),
  );
}

export async function projectDetail(request: ApiRequest, rawProjectId: string): Promise<ProjectDetail> {
  const id = projectId(rawProjectId);
  if (!id) throw notFound('Projeto não encontrado.');
  const viewer = await sessionUser(request);
  const project = await findProjectForViewer(id, viewer?.id);
  if (!project) throw notFound('Projeto não encontrado.');
  return projectDetailSchema.parse({ project, isOwner: viewer?.id === project.ownerId });
}

export async function updateUserProject(request: ApiRequest, rawProjectId: string): Promise<Project> {
  const user = await requireSessionUser(request);
  const id = projectId(rawProjectId);
  if (!id) throw notFound('Projeto não encontrado.');
  const parsed = updateProjectInputSchema.safeParse(await readJson(request));
  if (!parsed.success) throw badRequest('Revise o título, as seções, as notas e a visibilidade do projeto.');
  if (parsed.data.visibility === 'public') moderateProject(parsed.data);
  const project = await updateOwnedProject(id, user.id, parsed.data);
  if (!project) throw notFound('Projeto não encontrado.');
  return projectSchema.parse(project);
}

export async function deleteUserProject(
  request: ApiRequest,
  rawProjectId: string,
): Promise<ProjectDeleteResult> {
  const user = await requireSessionUser(request);
  const id = projectId(rawProjectId);
  if (!id || !(await softDeleteOwnedProject(id, user.id))) throw notFound('Projeto não encontrado.');
  return projectDeleteResultSchema.parse({ ok: true, projectId: id });
}

export async function projectTrash(request: ApiRequest): Promise<ProjectTrash> {
  const user = await requireSessionUser(request);
  return projectTrashSchema.parse({ projects: await listDeletedUserProjects(user.id) });
}

export async function restoreUserProject(
  request: ApiRequest,
  rawProjectId: string,
): Promise<ProjectDeleteResult> {
  const user = await requireSessionUser(request);
  const id = projectId(rawProjectId);
  if (!id || !(await restoreOwnedProject(id, user.id))) {
    throw notFound('Projeto não encontrado na lixeira.');
  }
  return projectDeleteResultSchema.parse({ ok: true, projectId: id });
}

export async function purgeUserProject(
  request: ApiRequest,
  rawProjectId: string,
): Promise<ProjectDeleteResult> {
  const user = await requireSessionUser(request);
  const id = projectId(rawProjectId);
  if (!id || !(await purgeOwnedProject(id, user.id))) {
    throw notFound('Projeto não encontrado na lixeira.');
  }
  return projectDeleteResultSchema.parse({ ok: true, projectId: id });
}
