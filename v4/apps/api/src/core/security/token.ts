import { randomBytes, randomUUID } from 'node:crypto';

export function opaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function entityId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'membro'
  );
}
