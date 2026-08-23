import type { ApiRequest } from './types.js';

export function parseCookies(request: ApiRequest): Record<string, string> {
  const raw = request.headers.cookie || '';
  const entries: Array<[string, string]> = [];

  raw
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const separator = part.indexOf('=');
      const name = separator < 0 ? part : part.slice(0, separator);
      const value = separator < 0 ? '' : part.slice(separator + 1);
      try {
        entries.push([decodeURIComponent(name), decodeURIComponent(value)]);
      } catch {
        entries.push([name, value]);
      }
    });

  return Object.fromEntries(entries);
}
