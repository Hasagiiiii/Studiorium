import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApi } from '../v4/apps/api/src/router.js';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await handleApi(request, response);
}
