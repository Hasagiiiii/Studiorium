import type { ApiResponse } from './types.js';

export function applySecurityHeaders(response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('X-Frame-Options', 'DENY');
}

export function json(response: ApiResponse, status: number, body: unknown) {
  response.statusCode = status;
  applySecurityHeaders(response);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export function noContent(response: ApiResponse) {
  response.statusCode = 204;
  applySecurityHeaders(response);
  response.end();
}
