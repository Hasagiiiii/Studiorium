import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const { handleApi } = await import('../v4/apps/api/src/router.js');
  await handleApi(request, response);
}
