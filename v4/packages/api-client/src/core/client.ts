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

export class ApiClient {
  constructor(private readonly baseUrl = '') {}

  async request<T>(path: string, schema: RuntimeSchema<T>, options: RequestOptions = {}): Promise<T> {
    const method = String(options.method || 'GET').toUpperCase();
    const attempts = method === 'GET' ? 3 : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const headers = new Headers(options.headers);
        let body: BodyInit | undefined;

        if (options.body !== undefined) {
          headers.set('Content-Type', 'application/json');
          body = JSON.stringify(options.body);
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
          ...options,
          method,
          headers,
          body,
          credentials: 'same-origin',
        });
        const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));

        if (!response.ok) {
          const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
          const error = new ApiError(
            typeof record.error === 'string' ? record.error : 'Não foi possível concluir a ação.',
            response.status,
            typeof record.code === 'string' ? record.code : undefined,
          );

          if (method === 'GET' && attempt < attempts && RETRYABLE_GET_STATUSES.has(response.status)) {
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
}
