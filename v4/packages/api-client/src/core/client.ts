export type RuntimeSchema<T> = {
  parse(input: unknown): T;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

const RETRYABLE_GET_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRuntimeValidationError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'issues' in error);
}

async function responsePayload(response: Response): Promise<unknown> {
  return response.status === 204 ? {} : response.json().catch(() => ({}));
}

function apiError(payload: unknown, status: number): ApiError {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  return new ApiError(
    typeof record.error === 'string' ? record.error : 'Não foi possível concluir a ação.',
    status,
    typeof record.code === 'string' ? record.code : undefined,
  );
}

export class ApiClient {
  constructor(private readonly baseUrl = '') {}

  async request<T>(
    path: string,
    schema: RuntimeSchema<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    const method = String(options.method || 'GET').toUpperCase();
    const attempts = method === 'GET' ? 3 : 1;
    const { body: inputBody, ...requestOptions } = options;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const headers = new Headers(requestOptions.headers);
        const init: RequestInit = {
          ...requestOptions,
          method,
          headers,
          credentials: 'same-origin',
        };

        if (inputBody !== undefined) {
          headers.set('Content-Type', 'application/json');
          init.body = JSON.stringify(inputBody);
        }

        const response = await fetch(`${this.baseUrl}${path}`, init);
        const payload = await responsePayload(response);

        if (!response.ok) {
          const error = apiError(payload, response.status);
          if (
            method === 'GET' &&
            attempt < attempts &&
            RETRYABLE_GET_STATUSES.has(response.status)
          ) {
            lastError = error;
            await wait(350 * attempt);
            continue;
          }
          throw error;
        }

        return schema.parse(payload);
      } catch (error) {
        lastError = error;
        if (
          method !== 'GET' ||
          attempt >= attempts ||
          error instanceof ApiError ||
          isRuntimeValidationError(error)
        ) {
          throw error;
        }
        await wait(350 * attempt);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Falha de rede.');
  }

  async upload<T>(
    path: string,
    schema: RuntimeSchema<T>,
    body: Blob,
    headers?: HeadersInit,
  ): Promise<T> {
    const uploadHeaders = new Headers(headers);
    if (body.type) uploadHeaders.set('Content-Type', body.type);
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body,
      headers: uploadHeaders,
      credentials: 'same-origin',
    });
    const payload = await responsePayload(response);
    if (!response.ok) throw apiError(payload, response.status);
    return schema.parse(payload);
  }
}
