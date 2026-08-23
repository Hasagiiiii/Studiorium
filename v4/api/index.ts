import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApi } from '../apps/api/src/router.js';

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  await handleApi(request, response);
}
