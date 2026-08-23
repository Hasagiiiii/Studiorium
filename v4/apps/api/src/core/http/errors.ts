export class HttpError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function badRequest(message = 'Requisição inválida.', code?: string) {
  return new HttpError(400, message, code);
}

export function unauthorized(message = 'Faça login para continuar.') {
  return new HttpError(401, message, 'UNAUTHORIZED');
}

export function forbidden(message = 'Você não tem permissão para esta ação.') {
  return new HttpError(403, message, 'FORBIDDEN');
}

export function notFound(message = 'Conteúdo não encontrado.') {
  return new HttpError(404, message, 'NOT_FOUND');
}
