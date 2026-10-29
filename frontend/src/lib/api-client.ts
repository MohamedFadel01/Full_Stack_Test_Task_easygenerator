export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    throw new Error('VITE_API_URL is not configured');
  }
  return baseUrl.replace(/\/$/, '');
}

export function parseNestErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
}

type ApiRequestOptions = RequestInit & {
  accessToken?: string;
  /** Send cookies for refresh/logout/sign-in (cross-origin credentialed requests). */
  auth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { accessToken, auth, headers, ...init } = options;
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...init,
    credentials: auth ? 'include' : 'omit',
    headers: {
      ...(init.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      parseNestErrorMessage(body, 'Request failed'),
    );
  }

  return body as T;
}
