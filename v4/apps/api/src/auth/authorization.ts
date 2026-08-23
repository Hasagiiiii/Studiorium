import { userHasPermission, userPermissions } from '@lorion/database';
import type { ApiRequest } from '../core/http/types.js';
import { forbidden } from '../core/http/errors.js';
import { requireSessionUser } from './session.js';

export async function requirePermission(request: ApiRequest, permission: string) {
  const user = await requireSessionUser(request);
  if (!(await userHasPermission(user.id, permission))) {
    throw forbidden('Você não possui permissão para esta área.');
  }
  return user;
}

export async function currentPermissions(request: ApiRequest): Promise<string[]> {
  const user = await requireSessionUser(request);
  return userPermissions(user.id);
}
